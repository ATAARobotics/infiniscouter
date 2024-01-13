use crate::api::data::{MatchEntryData, MatchEntryIdData};
use sled::{Db, Tree};
use std::{collections::HashMap, path::Path};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
	#[error("Database error: {0}")]
	Sled(#[from] sled::Error),
	#[error("Database serde error: {0}")]
	Serde(#[from] serde_json::Error),
}

#[derive(Debug, Clone)]
pub struct Database {
	_inner: Db,
	match_entries: Tree,
	pit_entries: Tree,
}

impl Database {
	pub fn get_all_match_entries(&self, year: u32, event: &str) -> Vec<MatchEntryIdData> {
		self.match_entries
			.scan_prefix(Self::match_entry_prefix(year, event))
			.flatten()
			.map(|(k, v)| {
				let mut key_parts = k.split(|n| *n == 255).skip(3);
				let match_id = String::from_utf8_lossy(key_parts.next().unwrap());
				let team_id = String::from_utf8_lossy(key_parts.next().unwrap());
				MatchEntryIdData {
					match_id: match_id.to_string(),
					team_id: team_id.to_string(),
					data: serde_json::from_slice(&v).unwrap(),
				}
			})
			.collect()
	}
	pub fn get_all_pit_entries(&self, year: u32, event: &str) -> HashMap<String, MatchEntryData> {
		self.pit_entries
			.scan_prefix(Self::pit_entry_prefix(year, event))
			.flatten()
			.map(|(k, v)| {
				let mut key_parts = k.split(|n| *n == 255).skip(3);
				let team_id = String::from_utf8_lossy(key_parts.next().unwrap());
				(team_id.to_string(), serde_json::from_slice(&v).unwrap())
			})
			.collect()
	}
}

impl Database {
	pub fn get_match_entry_data(
		&self,
		year: u32,
		event: &str,
		match_id: &str,
		team: &str,
	) -> Result<Option<MatchEntryData>, DbError> {
		let value = self
			.match_entries
			.get(Self::match_entry_key(year, event, match_id, team))?;
		Ok(if let Some(val) = value {
			Some(serde_json::from_slice(&val)?)
		} else {
			None
		})
	}
	pub fn set_match_entry_data(
		&self,
		year: u32,
		event: &str,
		match_id: &str,
		team: &str,
		data: &MatchEntryData,
	) -> Result<(), DbError> {
		let data = serde_json::to_vec(data)?;
		self.match_entries
			.insert(Self::match_entry_key(year, event, match_id, team), data)?;
		Ok(())
	}
	pub fn get_pit_entry_data(
		&self,
		year: u32,
		event: &str,
		team: &str,
	) -> Result<Option<MatchEntryData>, DbError> {
		let value = self
			.match_entries
			.get(Self::pit_entry_key(year, event, team))?;
		Ok(if let Some(val) = value {
			Some(serde_json::from_slice(&val)?)
		} else {
			None
		})
	}
	pub fn set_pit_entry_data(
		&self,
		year: u32,
		event: &str,
		team: &str,
		data: &MatchEntryData,
	) -> Result<(), DbError> {
		let data = serde_json::to_vec(data)?;
		self.pit_entries
			.insert(Self::pit_entry_key(year, event, team), data)?;
		Ok(())
	}
	fn match_entry_prefix(year: u32, event: &str) -> Vec<u8> {
		let mut bytes = "match_entry".as_bytes().to_vec();
		bytes.push(255);
		bytes.extend_from_slice(&year.to_le_bytes());
		bytes.push(255);
		bytes.extend_from_slice(event.as_bytes());
		bytes.push(255);
		bytes
	}
	fn match_entry_key(year: u32, event: &str, match_id: &str, team: &str) -> Vec<u8> {
		let mut bytes = Self::match_entry_prefix(year, event);
		bytes.extend_from_slice(match_id.as_bytes());
		bytes.push(255);
		bytes.extend_from_slice(team.as_bytes());
		bytes
	}
	fn pit_entry_prefix(year: u32, event: &str) -> Vec<u8> {
		let mut bytes = "pit_entry".as_bytes().to_vec();
		bytes.push(255);
		bytes.extend_from_slice(&year.to_le_bytes());
		bytes.push(255);
		bytes.extend_from_slice(event.as_bytes());
		bytes.push(255);
		bytes
	}
	fn pit_entry_key(year: u32, event: &str, team: &str) -> Vec<u8> {
		let mut bytes = Self::pit_entry_prefix(year, event);
		bytes.extend_from_slice(team.as_bytes());
		bytes
	}
}

impl Database {
	pub fn open<P: AsRef<Path>>(path: P) -> Result<Database, DbError> {
		let db = sled::open(path)?;
		let match_entries = db.open_tree("match_entires".as_bytes())?;
		let pit_entries = db.open_tree("pit_entires".as_bytes())?;
		Ok(Database {
			_inner: db,
			match_entries,
			pit_entries,
		})
	}
}
