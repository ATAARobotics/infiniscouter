pub mod data;

use std::sync::Arc;

use crate::analysis::{self, SingleTeamInfo, TeamInfoList};
use crate::api::data::MatchEntryData;
use crate::config::match_entry::MatchEntryFields;
use crate::config::{ConfigManager, GameConfig, TeamConfig};
use crate::data_validation::validate_match;
use crate::database::Database;
use crate::statbotics::StatboticsCache;
use crate::tba::{EventInfo, Tba};
use poem::http::StatusCode;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;
use poem_openapi::OpenApi;

use self::data::{MatchEntryIdData, PitEntryIdData};

#[derive(Debug)]
pub struct Api {
	config: ConfigManager,
	database: Database,
	tba: Tba,
	statbotics: StatboticsCache,
}

impl Api {
	pub fn new(
		tba: Tba,
		statbotics: StatboticsCache,
		config: ConfigManager,
		database: Database,
	) -> Self {
		Self {
			config,
			database,
			tba,
			statbotics,
		}
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
		Json(&self.config.get_current_game_config().game_config)
	}
	/// Get the configuration for a certain game
	#[oai(path = "/config/game/:year", method = "get")]
	pub async fn game_config(&self, year: Path<u32>) -> Json<Option<&GameConfig>> {
		Json(self.config.get_game_config(*year).map(|gc| &gc.game_config))
	}
	/// Get the fields to gather per match
	#[oai(path = "/match_entry/fields", method = "get")]
	pub async fn match_entry_fields(&self) -> Json<&MatchEntryFields> {
		Json(&self.config.get_current_game_config().match_entry_fields)
	}
	/// Get data for a particular match
	#[oai(path = "/match_entry/data/:match_id/:team", method = "get")]
	pub async fn match_entry_data(
		&self,
		match_id: Path<String>,
		team: Path<String>,
	) -> poem::Result<Json<Option<MatchEntryData>>> {
		let data = self
			.database
			.get_match_entry_data(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
				&match_id,
				&team,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		let fields = &self.config.get_current_game_config().match_entry_fields;
		Ok(Json(data.map(|data| validate_match(data, fields))))
	}
	fn match_entry_set_data_inner(
		&self,
		match_id: &str,
		team: &str,
		data: MatchEntryData,
	) -> poem::Result<()> {
		let fields = &self.config.get_current_game_config().match_entry_fields;
		let data = validate_match(data, fields);
		self.database
			.set_match_entry_data(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
				&match_id,
				&team,
				&data,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		Ok(())
	}
	/// Set data for a particular match
	#[oai(path = "/match_entry/data/:match_id/:team", method = "put")]
	pub async fn match_entry_set_data(
		&self,
		match_id: Path<String>,
		team: Path<String>,
		data: Json<MatchEntryData>,
	) -> poem::Result<()> {
		self.match_entry_set_data_inner(&match_id, &team, data.0)
	}
	/// Set data for multiple matches
	#[oai(path = "/match_entry/data/all", method = "put")]
	pub async fn match_entry_set_multiple(
		&self,
		data: Json<Vec<MatchEntryIdData>>,
	) -> poem::Result<()> {
		for match_entry in data.0 {
			self.match_entry_set_data_inner(
				&match_entry.match_id,
				&match_entry.team_id,
				match_entry.data,
			)?;
		}
		Ok(())
	}
	/// Get the fields to gather per match
	#[oai(path = "/pit_entry/fields", method = "get")]
	pub async fn pit_entry_fields(&self) -> Json<&MatchEntryFields> {
		Json(&self.config.get_current_game_config().pit_entry_fields)
	}
	/// Get pit data for a particular team
	#[oai(path = "/pit_entry/data/:match_id/:team", method = "get")]
	pub async fn pit_entry_data(
		&self,
		team: Path<String>,
	) -> poem::Result<Json<Option<MatchEntryData>>> {
		let data = self
			.database
			.get_pit_entry_data(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
				&team,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		let fields = &self.config.get_current_game_config().pit_entry_fields;
		Ok(Json(data.map(|data| validate_match(data, fields))))
	}
	fn pit_entry_set_data_inner(&self, team: &str, data: MatchEntryData) -> poem::Result<()> {
		let fields = &self.config.get_current_game_config().pit_entry_fields;
		let data = validate_match(data, fields);
		self.database
			.set_pit_entry_data(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
				&team,
				&data,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		Ok(())
	}
	/// Set data for a particular match
	#[oai(path = "/pit_entry/data/:match_id/:team", method = "put")]
	pub async fn pit_entry_set_data(
		&self,
		team: Path<String>,
		data: Json<MatchEntryData>,
	) -> poem::Result<()> {
		self.pit_entry_set_data_inner(&team, data.0)
	}
	/// Set data for multiple matches
	#[oai(path = "/pit_entry/data/all", method = "put")]
	pub async fn pit_entry_set_multiple(
		&self,
		data: Json<Vec<PitEntryIdData>>,
	) -> poem::Result<()> {
		for match_entry in data.0 {
			self.pit_entry_set_data_inner(&match_entry.team_id, match_entry.data)?;
		}
		Ok(())
	}
	/// Get a list of all matches for the current event (as well as any teams involved)
	#[oai(path = "/event/matches", method = "get")]
	pub async fn event_list_matches(&self) -> Json<Option<Arc<EventInfo>>> {
		Json(
			self.tba
				.get_event(&self.config.get_server_config().current_event)
				.await,
		)
	}
	#[oai(path = "/analysis/list", method = "get")]
	pub async fn analysis_list(&self) -> Json<TeamInfoList> {
		Json(
			analysis::list(
				&self.tba,
				&self.statbotics,
				&self.database,
				self.config.get_server_config(),
				self.config.get_current_game_config(),
			)
			.await,
		)
	}
	#[oai(path = "/analysis/team/:team", method = "get")]
	pub async fn analysis_team(&self, team: Path<u32>) -> Json<SingleTeamInfo> {
		Json(
			analysis::single_team(
				&self.tba,
				&self.statbotics,
				&self.database,
				self.config.get_server_config(),
				self.config.get_current_game_config(),
				team.0,
			)
			.await,
		)
	}
}
