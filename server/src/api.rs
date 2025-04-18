pub mod data;

use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;

use image::io::Reader as ImageReader;
use image::ImageFormat;
use log::warn;
use poem::http::StatusCode;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;
use poem_openapi::OpenApi;

use crate::analysis::{self, MatchAnalysisInfo, SingleTeamInfo, TeamInfoList};
use crate::api::data::{
	DriverEntryIdData, DriverEntryTimedId, FullEntryData, ImageEntryData, MatchEntryTimedId,
	PitEntryTimedId,
};
use crate::config::match_entry::MatchEntryFields;
use crate::config::{ConfigManager, GameConfig, TeamConfig};
use crate::data_validation::validate_match;
use crate::database::Database;
use crate::leaderboard::{self, LeaderboardInfo};
use crate::statbotics::StatboticsCache;
use crate::tba::{EventInfo, MatchId, SetMatch, Tba};

use self::data::{MatchEntryIdData, PitEntryIdData};

#[derive(Debug)]
pub struct Api {
	config: ConfigManager,
	database: Arc<Database>,
	tba: Arc<Tba>,
	statbotics: StatboticsCache,
}

impl Api {
	pub fn new(
		tba: Arc<Tba>,
		statbotics: StatboticsCache,
		config: ConfigManager,
		database: Arc<Database>,
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

	/// Get the fields to gather per match when scouting
	#[oai(path = "/match_entry/fields", method = "get")]
	pub async fn match_entry_fields(&self) -> Json<&MatchEntryFields> {
		Json(&self.config.get_current_game_config().match_entry_fields)
	}
	/// Get scouting data for a particular match
	#[oai(path = "/match_entry/data/:match_id/:team", method = "get")]
	pub async fn match_entry_data(
		&self,
		match_id: Path<String>,
		team: Path<String>,
	) -> poem::Result<Json<Option<FullEntryData>>> {
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
	/// Get filtered scouting data. All matches that are not specified as known
	/// or any that are newer than the known timestamp are returned.
	#[oai(path = "/match_entry/data/filtered", method = "post")]
	pub async fn match_entry_filtered_data(
		&self,
		data: Json<Vec<MatchEntryTimedId>>,
	) -> poem::Result<Json<Vec<MatchEntryIdData>>> {
		let known_timestamps = data
			.0
			.into_iter()
			.map(|timed_id| ((timed_id.match_id, timed_id.team_id), timed_id.timestamp_ms))
			.collect::<HashMap<_, _>>();
		let data = self
			.database
			.get_all_match_entries(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
			)
			.into_iter()
			.filter(|entry| {
				match known_timestamps.get(&(entry.match_id.to_string(), entry.team_id.to_string()))
				{
					None => true,
					Some(known_timestamp) => entry.data.get_timestamp() > *known_timestamp,
				}
			})
			.collect::<Vec<_>>();
		Ok(Json(data))
	}
	fn match_entry_set_data_inner(
		&self,
		match_id: &str,
		team: &str,
		data: FullEntryData,
	) -> poem::Result<()> {
		let server_config = self.config.get_server_config();
		if data.year != server_config.current_year || data.event != server_config.current_event {
			warn!(
				"Ignoring data for invalid year/event; expected {}:{}, got {}:{}",
				server_config.current_year, server_config.current_event, data.year, data.event
			);
			return Ok(());
		}
		let fields = &self.config.get_current_game_config().match_entry_fields;
		let data = validate_match(data, fields);
		self.database
			.set_match_entry_data(
				server_config.current_year,
				&server_config.current_event,
				match_id,
				team,
				data,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		Ok(())
	}
	/// Set scouting data for a particular match
	#[oai(path = "/match_entry/data/:match_id/:team", method = "put")]
	pub async fn match_entry_set_data(
		&self,
		match_id: Path<String>,
		team: Path<String>,
		data: Json<FullEntryData>,
	) -> poem::Result<()> {
		self.match_entry_set_data_inner(&match_id, &team, data.0)
	}
	/// Set scouting data for multiple matches
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

	/// Get the fields to gather from drive team
	#[oai(path = "/driver_entry/fields", method = "get")]
	pub async fn driver_entry_fields(&self) -> Json<&MatchEntryFields> {
		Json(&self.config.get_current_game_config().driver_entry_fields)
	}
	/// Get drive team data for a particular match
	#[oai(path = "/driver_entry/data/:match_id/:team", method = "get")]
	pub async fn driver_entry_data(
		&self,
		match_id: Path<String>,
		team: Path<String>,
	) -> poem::Result<Json<Option<FullEntryData>>> {
		let data = self
			.database
			.get_driver_entry_data(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
				&match_id,
				&team,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		let fields = &self.config.get_current_game_config().driver_entry_fields;
		Ok(Json(data.map(|data| validate_match(data, fields))))
	}
	/// Get filtered driver data. All matches that are not specified as known
	/// or any that are newer than the known timestamp are returned.
	#[oai(path = "/driver_entry/data/filtered", method = "post")]
	pub async fn driver_entry_filtered_data(
		&self,
		data: Json<Vec<DriverEntryTimedId>>,
	) -> poem::Result<Json<Vec<DriverEntryIdData>>> {
		let known_timestamps = data
			.0
			.into_iter()
			.map(|timed_id| ((timed_id.match_id, timed_id.team_id), timed_id.timestamp_ms))
			.collect::<HashMap<_, _>>();
		let data = self
			.database
			.get_all_driver_entries(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
			)
			.into_iter()
			.filter(|entry| {
				match known_timestamps.get(&(entry.match_id.to_string(), entry.team_id.to_string()))
				{
					None => true,
					Some(known_timestamp) => entry.data.get_timestamp() > *known_timestamp,
				}
			})
			.collect::<Vec<_>>();
		Ok(Json(data))
	}
	fn driver_entry_set_data_inner(
		&self,
		match_id: &str,
		team: &str,
		data: FullEntryData,
	) -> poem::Result<()> {
		let server_config = self.config.get_server_config();
		if data.year != server_config.current_year || data.event != server_config.current_event {
			warn!(
				"Ignoring data for invalid year/event; expected {}:{}, got {}:{}",
				server_config.current_year, server_config.current_event, data.year, data.event
			);
			return Ok(());
		}
		let fields = &self.config.get_current_game_config().driver_entry_fields;
		let data = validate_match(data, fields);
		self.database
			.set_driver_entry_data(
				server_config.current_year,
				&server_config.current_event,
				match_id,
				team,
				data,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		Ok(())
	}
	/// Set drive team data for a particular match
	#[oai(path = "/driver_entry/data/:match_id/:team", method = "put")]
	pub async fn driver_entry_set_data(
		&self,
		match_id: Path<String>,
		team: Path<String>,
		data: Json<FullEntryData>,
	) -> poem::Result<()> {
		self.driver_entry_set_data_inner(&match_id, &team, data.0)
	}
	/// Set drive team data for multiple matches
	#[oai(path = "/driver_entry/data/all", method = "put")]
	pub async fn driver_entry_set_multiple(
		&self,
		data: Json<Vec<DriverEntryIdData>>,
	) -> poem::Result<()> {
		for driver_entry in data.0 {
			self.driver_entry_set_data_inner(
				&driver_entry.match_id,
				&driver_entry.team_id,
				driver_entry.data,
			)?;
		}
		Ok(())
	}

	/// Get the fields to gather per team for pit scouting
	#[oai(path = "/pit_entry/fields", method = "get")]
	pub async fn pit_entry_fields(&self) -> Json<&MatchEntryFields> {
		Json(&self.config.get_current_game_config().pit_entry_fields)
	}
	/// Get pit data for a particular team
	#[oai(path = "/pit_entry/data/:team", method = "get")]
	pub async fn pit_entry_data(
		&self,
		team: Path<String>,
	) -> poem::Result<Json<Option<FullEntryData>>> {
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
	/// Get filtered driver data. All matches that are not specified as known
	/// or any that are newer than the known timestamp are returned.
	#[oai(path = "/pit_entry/data/filtered", method = "post")]
	pub async fn pit_entry_filtered_data(
		&self,
		data: Json<Vec<PitEntryTimedId>>,
	) -> poem::Result<Json<Vec<PitEntryIdData>>> {
		let known_timestamps = data
			.0
			.into_iter()
			.map(|timed_id| (timed_id.team_id, timed_id.timestamp_ms))
			.collect::<HashMap<_, _>>();
		let data = self
			.database
			.get_all_pit_entries(
				self.config.get_server_config().current_year,
				&self.config.get_server_config().current_event,
			)
			.into_iter()
			.filter_map(|(team, data)| {
				let unknown = match known_timestamps.get(&team) {
					None => true,
					Some(known_timestamp) => data.get_timestamp() > *known_timestamp,
				};
				if unknown {
					Some(PitEntryIdData {
						team_id: team,
						data,
					})
				} else {
					None
				}
			})
			.collect::<Vec<_>>();
		Ok(Json(data))
	}
	fn pit_entry_set_data_inner(&self, team: &str, data: FullEntryData) -> poem::Result<()> {
		let server_config = self.config.get_server_config();
		if data.year != server_config.current_year || data.event != server_config.current_event {
			warn!(
				"Ignoring data for invalid year/event; expected {}:{}, got {}:{}",
				server_config.current_year, server_config.current_event, data.year, data.event
			);
			return Ok(());
		}
		let fields = &self.config.get_current_game_config().pit_entry_fields;
		let data = validate_match(data, fields);
		self.database
			.set_pit_entry_data(
				server_config.current_year,
				&server_config.current_event,
				team,
				data,
			)
			.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		Ok(())
	}
	/// Set pit data for a particular team
	#[oai(path = "/pit_entry/data/:team", method = "put")]
	pub async fn pit_entry_set_data(
		&self,
		team: Path<String>,
		data: Json<FullEntryData>,
	) -> poem::Result<()> {
		self.pit_entry_set_data_inner(&team, data.0)
	}
	/// Set pit data for multiple teams
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

	/// Saves a batch of images fro mthe client
	#[oai(path = "/images", method = "put")]
	pub async fn save_images(&self, data: Json<Vec<ImageEntryData>>) -> poem::Result<()> {
		for image_data in data.0 {
			let mut image_reader = ImageReader::new(Cursor::new(image_data.image_data));
			let image_result = match ImageFormat::from_mime_type(image_data.image_mime) {
				Some(image_format) => {
					image_reader.set_format(image_format);
					image_reader.decode()
				}
				None => image_reader
					.with_guessed_format()
					.map_err(|err| poem::Error::new(err, StatusCode::BAD_REQUEST))?
					.decode(),
			};
			let image =
				image_result.map_err(|err| poem::Error::new(err, StatusCode::BAD_REQUEST))?;

			self.database
				.write_image(&image, &image_data.image_id)
				.map_err(|e| poem::Error::new(e, StatusCode::INTERNAL_SERVER_ERROR))?;
		}
		Ok(())
	}

	/// Get a list of all matches for the current event (as well as any teams involved)
	#[oai(path = "/event/matches", method = "get")]
	pub async fn event_list_matches(&self) -> Json<Option<EventInfo>> {
		Json(
			self.tba
				.get_event(
					self.config.get_server_config().current_year,
					&self.config.get_server_config().current_event,
				)
				.await,
		)
	}
	#[oai(path = "/analysis/list", method = "get")]
	pub async fn analysis_list(&self) -> Json<TeamInfoList> {
		Json(
			analysis::get_analysis_list(
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
			analysis::get_single_team_analysis(
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
	#[oai(path = "/analysis/match/:match_type/:num/:set", method = "get")]
	pub async fn analysis_match(
		&self,
		match_type: Path<String>,
		num: Path<u32>,
		set: Path<u32>,
	) -> poem::Result<Json<MatchAnalysisInfo>> {
		let match_id = match match_type.as_str() {
			"practice" => MatchId::Practice(SetMatch {
				set: *set,
				num: *num,
			}),
			"qualification" => MatchId::Qualification(SetMatch {
				set: *set,
				num: *num,
			}),
			"quarterfinal" => MatchId::Quarterfinal(SetMatch {
				set: *set,
				num: *num,
			}),
			"semifinal" => MatchId::Semifinal(SetMatch {
				set: *set,
				num: *num,
			}),
			"final" => MatchId::Final(SetMatch {
				set: *set,
				num: *num,
			}),
			_ => {
				return Err(poem::Error::from_status(StatusCode::BAD_REQUEST));
			}
		};
		Ok(Json(
			analysis::get_match_analysis(
				&self.tba,
				&self.statbotics,
				&self.database,
				self.config.get_server_config(),
				self.config.get_current_game_config(),
				match_id,
			)
			.await,
		))
	}
	#[oai(path = "/leaderboard", method = "get")]
	pub async fn get_leaderboard(&self) -> Json<LeaderboardInfo> {
		Json(leaderboard::get_leaderboard(
			&self.database,
			self.config.get_server_config(),
		))
	}
}
