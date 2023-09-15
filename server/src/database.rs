use crate::api::data::MatchEntryData;
use sled::{Db, Tree};
use std::path::Path;
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
}

impl Database {}

impl Database {
	pub fn get_match_entry_data(
		&self,
		event: &str,
		match_id: &str,
		team: &str,
	) -> Result<Option<MatchEntryData>, DbError> {
		let value = self
			.match_entries
			.get(Self::match_entry_key(event, match_id, team))?;
		Ok(if let Some(val) = value {
			Some(serde_json::from_slice(&val)?)
		} else {
			None
		})
	}
	pub fn set_match_entry_data(
		&self,
		event: &str,
		match_id: &str,
		team: &str,
		data: &MatchEntryData,
	) -> Result<(), DbError> {
		let data = serde_json::to_vec(data)?;
		self.match_entries
			.insert(Self::match_entry_key(event, match_id, team), data)?;
		Ok(())
	}
	fn match_entry_key(event: &str, match_id: &str, team: &str) -> Vec<u8> {
		let mut bytes = "match_entry".as_bytes().to_vec();
		bytes.push(255);
		bytes.extend_from_slice(event.as_bytes());
		bytes.push(255);
		bytes.extend_from_slice(match_id.as_bytes());
		bytes.push(255);
		bytes.extend_from_slice(team.as_bytes());
		bytes
	}
}

impl Database {
	pub fn open<P: AsRef<Path>>(path: P) -> Result<Database, DbError> {
		let db = sled::open(path)?;
		let match_entries = db.open_tree("match_entires".as_bytes())?;
		Ok(Database {
			_inner: db,
			match_entries,
		})
	}
}
