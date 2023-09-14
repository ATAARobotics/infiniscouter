use std::path::Path;
use crate::api::data::MatchEntryData;

#[derive(Debug, Clone)]
pub struct Database {}

impl Database {
	pub fn get_match_entry_data(&self, event: &str, match_id: &str, team: &str) -> Option<MatchEntryData> {
		None
	}
}

impl Database {
	pub fn open<P: AsRef<Path>>(_path: P) -> Database {
		Database {}
	}
}
