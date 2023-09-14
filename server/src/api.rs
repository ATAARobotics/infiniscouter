pub mod data;

use crate::api::data::{MatchEntry, MatchEntryData, MatchEntryFields, MatchEntryPage};
use crate::config::{ConfigManager, GameConfig, TeamConfig};
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
	#[oai(path = "/config/server", method = "get")]
	pub async fn server_config(&self) -> Json<&TeamConfig> {
		Json(self.config.get_server_config())
	}
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
	#[oai(path = "/match_entry/fields", method = "get")]
	pub async fn match_entry_fields(&self) -> Json<MatchEntryFields> {
		let game_config = self.config.get_current_game_config();
		Json(MatchEntryFields {
			entries: game_config
				.categories
				.values()
				.flat_map(|category| {
					category
						.metrics
						.iter()
						.filter(|(_, metric)| metric.collect.collect_in_match())
						.map(|(metric_id, metric)| {
							(
								metric_id.clone(),
								MatchEntry {
									title: metric.name.clone(),
									description: metric.description.clone(),
									entry: (&metric.metric).into(),
								},
							)
						})
				})
				.collect(),
			pages: ["auto", "teleop", "endgame", "impressions"]
				.into_iter()
				.filter_map(|page| game_config.categories.get(page))
				.map(|cat| MatchEntryPage {
					title: cat.name.clone(),
					description: None,
					layout: cat
						.metrics
						.iter()
						.filter(|(_, metric)| metric.collect.collect_in_match())
						.map(|(metric, _)| metric.clone())
						.collect(),
				})
				.collect(),
		})
	}
	#[oai(path = "/match_entry/data/:event/:match/:team", method = "get")]
	pub async fn match_entry_data(
		&self,
		event: Path<String>,
		match_id: Path<String>,
		team: Path<String>,
	) -> Json<Option<MatchEntryData>> {
		Json(self.database.get_match_entry_data(&event, &match_id, &team))
	}
}
