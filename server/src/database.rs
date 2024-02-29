use std::io::Cursor;
use std::{collections::HashMap, path::Path};

use image::imageops::FilterType;
use image::{DynamicImage, ImageError};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use sled::{Db, Tree};
use thiserror::Error;

use crate::api::data::{DriverEntryIdData, MatchEntryData, MatchEntryIdData};

#[derive(Debug, Error)]
pub enum DbError {
	#[error("Failed to encode image: {0}")]
	Image(#[from] ImageError),
	#[error("Database error: {0}")]
	Sled(#[from] sled::Error),
	#[error("Failed to decode data in database: {0}")]
	Bincode(#[from] bincode::Error),
	#[error("Database serde error: {0}")]
	Serde(#[from] serde_json::Error),
}

#[derive(Debug, Clone)]
pub struct Database {
	inner: Db,
	driver_entries: Tree,
	match_entries: Tree,
	pit_entries: Tree,
}

const IMAGE_PREFIX_FULL: &str = "image-full:"; // Map image id to image data
const IMAGE_PREFIX_SMALL: &str = "image-small:"; // Map image id to image data (small size)
const IMAGE_SIZE_SMALL: u32 = 300;

#[derive(Debug, Copy, Clone)]
pub enum ImageSize {
	Full,
	Small,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ImageData {
	pub mime_type: String,
	pub width: u32,
	pub height: u32,
	pub image_data: Vec<u8>,
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
					data: Self::tidy_entry_data(serde_json::from_slice(&v).unwrap()),
				}
			})
			.collect()
	}
	pub fn get_all_driver_entries(&self, year: u32, event: &str) -> Vec<DriverEntryIdData> {
		self.driver_entries
			.scan_prefix(Self::driver_entry_prefix(year, event))
			.flatten()
			.map(|(k, v)| {
				let mut key_parts = k.split(|n| *n == 255).skip(3);
				let match_id = String::from_utf8_lossy(key_parts.next().unwrap());
				let team_id = String::from_utf8_lossy(key_parts.next().unwrap());
				DriverEntryIdData {
					match_id: match_id.to_string(),
					team_id: team_id.to_string(),
					data: Self::tidy_entry_data(serde_json::from_slice(&v).unwrap()),
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
				(
					team_id.to_string(),
					Self::tidy_entry_data(serde_json::from_slice(&v).unwrap()),
				)
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
			Some(Self::tidy_entry_data(serde_json::from_slice(&val)?))
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
		data: MatchEntryData,
	) -> Result<(), DbError> {
		if let Some(new_data) = Self::get_merged_data(
			"MATCH",
			team,
			Some(match_id),
			self.get_match_entry_data(year, event, match_id, team)
				.unwrap(),
			data,
		) {
			let data = serde_json::to_vec(&new_data)?;
			self.match_entries
				.insert(Self::match_entry_key(year, event, match_id, team), data)?;
		}

		Ok(())
	}
	pub fn get_driver_entry_data(
		&self,
		year: u32,
		event: &str,
		match_id: &str,
		team: &str,
	) -> Result<Option<MatchEntryData>, DbError> {
		let value = self
			.driver_entries
			.get(Self::driver_entry_key(year, event, match_id, team))?;
		Ok(if let Some(val) = value {
			Some(Self::tidy_entry_data(serde_json::from_slice(&val)?))
		} else {
			None
		})
	}
	pub fn set_driver_entry_data(
		&self,
		year: u32,
		event: &str,
		match_id: &str,
		team: &str,
		data: MatchEntryData,
	) -> Result<(), DbError> {
		if let Some(new_data) = Self::get_merged_data(
			"DRIVER",
			team,
			Some(match_id),
			self.get_driver_entry_data(year, event, match_id, team)
				.unwrap(),
			data,
		) {
			let data = serde_json::to_vec(&new_data)?;
			self.driver_entries
				.insert(Self::driver_entry_key(year, event, match_id, team), data)?;
		}

		Ok(())
	}
	pub fn get_pit_entry_data(
		&self,
		year: u32,
		event: &str,
		team: &str,
	) -> Result<Option<MatchEntryData>, DbError> {
		let value = self
			.pit_entries
			.get(Self::pit_entry_key(year, event, team))?;
		Ok(if let Some(val) = value {
			Some(Self::tidy_entry_data(serde_json::from_slice(&val)?))
		} else {
			None
		})
	}
	pub fn set_pit_entry_data(
		&self,
		year: u32,
		event: &str,
		team: &str,
		data: MatchEntryData,
	) -> Result<(), DbError> {
		if let Some(new_data) = Self::get_merged_data(
			"PIT",
			team,
			None,
			self.get_pit_entry_data(year, event, team).unwrap(),
			data,
		) {
			let data = serde_json::to_vec(&new_data)?;
			self.pit_entries
				.insert(Self::pit_entry_key(year, event, team), data)?;
		}

		Ok(())
	}

	pub fn write_image(&self, image: &DynamicImage, image_id: &str) -> Result<(), DbError> {
		let mut image_data_full: Vec<u8> = Vec::new();
		image.write_to(
			&mut Cursor::new(&mut image_data_full),
			image::ImageOutputFormat::Jpeg(90),
		)?;
		let full_image_data = ImageData {
			mime_type: "image/jpeg".to_string(),
			width: image.width(),
			height: image.height(),
			image_data: image_data_full,
		};

		let mut image_key_full = Vec::from(IMAGE_PREFIX_FULL);
		image_key_full.extend(image_id.as_bytes());
		let image_bytes = bincode::serialize(&full_image_data)?;
		self.inner.insert(image_key_full, image_bytes)?;

		// insert scaled-down image (or the same image if it is already small)
		let mut image_key_small = Vec::from(IMAGE_PREFIX_SMALL);
		image_key_small.extend(image_id.as_bytes());
		if image.width() > IMAGE_SIZE_SMALL || image.height() > IMAGE_SIZE_SMALL {
			let mut resized_image_data: Vec<u8> = Vec::new();
			let resized_image =
				image.resize(IMAGE_SIZE_SMALL, IMAGE_SIZE_SMALL, FilterType::Lanczos3);
			resized_image.write_to(
				&mut Cursor::new(&mut resized_image_data),
				image::ImageOutputFormat::Jpeg(80),
			)?;
			let image_bytes = bincode::serialize(&ImageData {
				mime_type: "image/jpeg".to_string(),
				width: resized_image.width(),
				height: resized_image.height(),
				image_data: resized_image_data,
			})?;
			self.inner.insert(image_key_small, image_bytes)?;
		} else {
			let image_bytes = bincode::serialize(&full_image_data)?;
			self.inner.insert(image_key_small, image_bytes)?;
		}

		Ok(())
	}
	pub fn get_image(&self, id: &str, size: ImageSize) -> Result<Option<ImageData>, DbError> {
		let mut key = Vec::from(match size {
			ImageSize::Full => IMAGE_PREFIX_FULL,
			ImageSize::Small => IMAGE_PREFIX_SMALL,
		});
		key.extend(id.as_bytes());
		self.inner
			.get(key)?
			.map(|image_bytes| {
				let image: ImageData = bincode::deserialize(&image_bytes)?;
				Ok(Some(image))
			})
			.unwrap_or(Ok(None))
	}

	fn driver_entry_prefix(year: u32, event: &str) -> Vec<u8> {
		let mut bytes = "driver_entry".as_bytes().to_vec();
		bytes.push(255);
		bytes.extend_from_slice(&year.to_le_bytes());
		bytes.push(255);
		bytes.extend_from_slice(event.as_bytes());
		bytes.push(255);
		bytes
	}
	fn driver_entry_key(year: u32, event: &str, match_id: &str, team: &str) -> Vec<u8> {
		let mut bytes = Self::driver_entry_prefix(year, event);
		bytes.extend_from_slice(match_id.as_bytes());
		bytes.push(255);
		bytes.extend_from_slice(team.as_bytes());
		bytes
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

	fn get_merged_data(
		data_type: &str,
		team: &str,
		match_id: Option<&str>,
		old_data: Option<MatchEntryData>,
		new_data: MatchEntryData,
	) -> Option<MatchEntryData> {
		let match_bit = if let Some(match_id) = match_id {
			format!("match {match_id} and ")
		} else {
			"".to_string()
		};

		if new_data.entries.is_empty() {
			warn!("Ignoring {data_type} scouting data for {match_bit}team {team} (no data)",);

			return None;
		}

		let new_scout = new_data.get_latest_scout().unwrap();

		let old_data = match old_data {
			None => {
				info!("Saving new {data_type} scouting data for {match_bit}team {team} by scout {new_scout}");

				return Some(new_data);
			}
			Some(old_data) => old_data,
		};

		let mut count = 0;
		let mut final_data = old_data;

		for (id, new_value) in new_data.entries.into_iter() {
			if let Some(old_value) = final_data.entries.get(&id) {
				if new_value.get_timestamp() > old_value.get_timestamp()
					&& new_value.is_different(old_value)
				{
					final_data.entries.insert(id, new_value);
					count += 1;
				}
			} else {
				final_data.entries.insert(id, new_value);
				count += 1;
			}
		}

		if count > 0 {
			info!("Updating {data_type} scouting data for {match_bit}team {team} by scout {new_scout} ({count} new items)");

			Some(final_data)
		} else {
			info!("Ignoring {data_type} scouting data for {match_bit}team {team} by scout {new_scout} (nothing new)");

			None
		}
	}

	fn tidy_entry_data(mut data: MatchEntryData) -> MatchEntryData {
		if let Some(scout) = &data.scout {
			for entry in data.entries.iter_mut() {
				entry.1.set_scout_if_blank(scout);
			}
			data.scout = None;
		}
		if let Some(timestamp_ms) = &data.timestamp_ms {
			for entry in data.entries.iter_mut() {
				entry.1.set_timestamp_if_blank(*timestamp_ms);
			}
			data.timestamp_ms = None;
		}

		data
	}
}

impl Database {
	pub fn open<P: AsRef<Path>>(path: P) -> Result<Database, DbError> {
		let db = sled::open(path)?;
		let driver_entries = db.open_tree("driver_entires".as_bytes())?;
		let match_entries = db.open_tree("match_entires".as_bytes())?;
		let pit_entries = db.open_tree("pit_entires".as_bytes())?;
		Ok(Database {
			inner: db,
			driver_entries,
			match_entries,
			pit_entries,
		})
	}
}
