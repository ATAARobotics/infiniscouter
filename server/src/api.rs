mod data;

use crate::api::data::MatchEntryFields;
use crate::config::{ConfigManager, GameConfig};
use crate::database::Database;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;
use poem_openapi::OpenApi;

#[derive(Debug, Clone)]
pub struct Api {
	config: ConfigManager,
	database: Database,
}

impl Api {
	pub fn new(config: ConfigManager, database: Database) -> Self {
		Self { config, database }
	}
}

#[OpenApi]
impl Api {
	/// Get the currently selected game
	#[oai(path = "/config/game", method = "get")]
	pub async fn current_game_config(&self) -> Json<&GameConfig> {
		Json(self.config.get_current_game_config())
	}
	/// Get the configuration for a certain game
	#[oai(path = "/config/game/:year", method = "get")]
	pub async fn game_config(&self, year: Path<u32>) -> Json<Option<&GameConfig>> {
		Json(self.config.get_game_config(*year))
	}
	#[oai(path = "/match_entry_fields", method = "get")]
	pub async fn match_entry_fields(&self) -> Json<MatchEntryFields> {
		Json(MatchEntryFields { pages: Vec::new() })
	}
}
