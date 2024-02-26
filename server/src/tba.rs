use std::collections::HashSet;
use std::time::{Duration, Instant};
use std::{
	collections::{BTreeMap, HashMap},
	sync::Arc,
};

use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use color_eyre::{eyre::bail, Result};
use futures_util::future;
use log::{error, info};
use poem::http::{HeaderMap, HeaderValue};
use poem_openapi::{Enum, Object, Union};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use tokio::sync::{Mutex, RwLock};
use ts_rs::TS;

use crate::api::data::{CounterEntry, MatchBoolEntry, MatchEntryValue, MatchEnumEntry};
use crate::config::{GameConfig, GameConfigs};
use crate::DefaultInstant;

type AvatarCache = RwLock<HashMap<(u32, u32), Option<Vec<u8>>>>;

/// A struct to manage and cache information from the blue alliance
#[derive(Debug)]
pub struct Tba {
	event_cache: Arc<RwLock<BTreeMap<String, EventInfo>>>,
	events_loading: Arc<Mutex<HashSet<String>>>,
	avatar_cache: Arc<AvatarCache>,
	client: Client,
	game_configs: Arc<GameConfigs>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct EventInfo {
	pub match_infos: Vec<MatchInfo>,
	pub team_infos: HashMap<u32, TeamInfo>,
	pub event: String,
	pub year: u32,
	#[serde(skip)]
	#[ts(skip)]
	#[oai(skip)]
	last_update: DefaultInstant,
}

impl EventInfo {
	async fn new(
		match_infos: Vec<RawTbaMatch>,
		team_infos: Vec<TeamInfo>,
		year: u32,
		event: &str,
		game_config: &GameConfig,
	) -> EventInfo {
		let mut match_infos: Vec<_> = match_infos
			.into_iter()
			.filter_map(|m| m.into_match(game_config).ok())
			.collect();
		match_infos.sort_by_key(|m| m.start_time);
		EventInfo {
			match_infos,
			team_infos: team_infos
				.into_iter()
				.map(|team_info| (team_info.num, team_info))
				.collect(),
			event: event.to_string(),
			year,
			last_update: DefaultInstant(Instant::now()),
		}
	}
}

impl Tba {
	pub fn new(game_configs: Arc<GameConfigs>, key: String) -> Result<Tba> {
		let mut headers = HeaderMap::new();
		headers.insert("X-TBA-Auth-Key", HeaderValue::from_str(&key)?);
		Ok(Tba {
			event_cache: Arc::new(RwLock::new(BTreeMap::new())),
			events_loading: Arc::new(Mutex::new(HashSet::new())),
			avatar_cache: Arc::new(RwLock::new(HashMap::new())),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.default_headers(headers)
				.build()?,
			game_configs,
		})
	}

	pub async fn get_avatar(&self, team: u32, year: u32) -> Option<Vec<u8>> {
		Self::get_avatar_impl(&self.avatar_cache, &self.client, team, year).await
	}

	pub async fn get_event(&self, year: u32, event: &str) -> Option<EventInfo> {
		let event_info = self.event_cache.read().await.get(event).cloned();

		match event_info {
			None => match Self::load_event(
				&self.client,
				&self.avatar_cache,
				&self.game_configs.game_config,
				year,
				event,
			)
			.await
			{
				Ok(event_info) => {
					info!("TBA ({event}): load complete");
					self.event_cache
						.write()
						.await
						.insert(event.to_string(), event_info.clone());
					Some(event_info)
				}
				Err(err) => {
					error!("TBA ({event}): load error: {err}");
					None
				}
			},
			Some(event_info) => {
				if event_info.last_update.0.elapsed() > Duration::from_secs(5 * 60) {
					self.trigger_load(year, event).await;
				}

				Some(event_info)
			}
		}
	}

	async fn trigger_load(&self, year: u32, event: &str) {
		let mut lock = self.events_loading.lock().await;

		if !lock.contains(event) {
			lock.insert(event.to_string());
			drop(lock);

			let event = event.to_string();
			let client_clone = self.client.clone();
			let avatar_cache_clone = self.avatar_cache.clone();
			let event_cache_clone = self.event_cache.clone();
			let events_loading_clone = self.events_loading.clone();
			let game_configs = self.game_configs.clone();
			spawn(async move {
				match Self::load_event(
					&client_clone,
					&avatar_cache_clone,
					&game_configs.game_config,
					year,
					&event,
				)
				.await
				{
					Ok(data) => {
						info!("TBA ({event}): background load complete");
						event_cache_clone.write().await.insert(event.clone(), data);
					}
					Err(err) => {
						error!("TBA ({event}): background load error: {err}");
					}
				}

				events_loading_clone.lock().await.remove(&event);
			});
		}
	}

	async fn get_avatar_impl(
		avatar_cache: &AvatarCache,
		client: &Client,
		team: u32,
		year: u32,
	) -> Option<Vec<u8>> {
		if let Some(data) = avatar_cache.read().await.get(&(team, year)) {
			return data.clone();
		}

		let image = client
			.get(format!(
				"https://www.thebluealliance.com/api/v3/team/frc{team}/media/{year}",
			))
			.send()
			.await
			.unwrap()
			.json::<Vec<RawTbaImage>>()
			.await
			.ok()
			.and_then(|media| {
				media
					.into_iter()
					.filter(|i| i.image_type == "avatar")
					.find_map(|i| i.details.and_then(|d| d.base64_image))
			})
			.and_then(|image_base64| STANDARD.decode(image_base64).ok());

		avatar_cache
			.write()
			.await
			.insert((team, year), image.clone());

		image
	}

	async fn load_event(
		client: &Client,
		avatar_cache: &AvatarCache,
		game_config: &GameConfig,
		year: u32,
		event: &str,
	) -> Result<EventInfo> {
		info!("TBA ({event}): Loading data");

		let mut teams = client
			.get(format!(
				"https://www.thebluealliance.com/api/v3/event/{event}/teams"
			))
			.send()
			.await?
			.json::<Vec<RawTbaTeam>>()
			.await?;
		teams.retain(|t| !(9990..=9999).contains(&t.team_number));
		let team_infos: Vec<_> = future::join_all(teams.into_iter().map(|raw_team| async move {
			TeamInfo {
				num: raw_team.team_number,
				name: raw_team
					.nickname
					.or(raw_team.name)
					.unwrap_or_else(|| "unknown".to_string()),
				has_avatar: Self::get_avatar_impl(avatar_cache, client, raw_team.team_number, year)
					.await
					.is_some(),
			}
		}))
		.await
		.into_iter()
		.collect();
		Ok(EventInfo::new(
			client
				.get(format!(
					"https://www.thebluealliance.com/api/v3/event/{event}/matches"
				))
				.send()
				.await?
				.json::<Vec<RawTbaMatch>>()
				.await?,
			team_infos,
			year,
			event,
			game_config,
		)
		.await)
	}
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
struct RawTbaMatch {
	alliances: RawTbaAlliances,
	actual_time: Option<u64>,
	predicted_time: u64,
	comp_level: String,
	set_number: u32,
	match_number: u32,
	#[serde(default)]
	score_breakdown: RawTbaScoreBreakdowns,
	winning_alliance: Option<String>,
}

impl RawTbaMatch {
	fn into_match(self, game_config: &GameConfig) -> Result<MatchInfo> {
		Ok(MatchInfo {
			id: match self.comp_level.as_str() {
				"q" | "qm" => MatchId::Qualification(SetMatch {
					set: self.set_number,
					num: self.match_number,
				}),
				"qf" => MatchId::Quarterfinal(SetMatch {
					set: self.set_number,
					num: self.match_number,
				}),
				"sf" => MatchId::Semifinal(SetMatch {
					set: self.set_number,
					num: self.match_number,
				}),
				"f" => MatchId::Final(SetMatch {
					set: self.set_number,
					num: self.match_number,
				}),
				lvl => {
					error!("Unkown comp level: '{lvl}'");
					bail!("Unknown comp level: '{lvl}'")
				}
			},
			start_time: self.actual_time.unwrap_or(self.predicted_time),
			teams_blue: self
				.alliances
				.blue
				.team_keys
				.into_iter()
				.map(|t| t.trim_start_matches("frc").parse().unwrap())
				.collect(),
			teams_red: self
				.alliances
				.red
				.team_keys
				.into_iter()
				.map(|t| t.trim_start_matches("frc").parse().unwrap())
				.collect(),
			score_blue: self.alliances.blue.score.and_then(|score| {
				if score >= 0 {
					Some(score as u16)
				} else {
					None
				}
			}),
			score_red: self.alliances.red.score.and_then(|score| {
				if score >= 0 {
					Some(score as u16)
				} else {
					None
				}
			}),
			result: match self.winning_alliance.as_deref() {
				Some("red") => MatchResult::Red,
				Some("blue") => MatchResult::Blue,
				_ => MatchResult::Tbd,
			},
			custom_entries: CustomEntries {
				blue: custom_entries_for(game_config, self.score_breakdown.blue),
				red: custom_entries_for(game_config, self.score_breakdown.red),
			},
		})
	}
}

fn custom_entries_for(
	game_config: &GameConfig,
	value: HashMap<String, RawTbaScoreBreakdownValue>,
) -> [HashMap<String, MatchEntryValue>; 3] {
	[1, 2, 3].map(|n| {
		game_config
			.get_tba_props()
			.into_iter()
			.map(|(prop_name, prop)| {
				let name = prop.name.replace("{N}", &n.to_string());
				let data = value
					.get(&name)
					.expect("TBA Data wasn't included in report from TBA.");
				(
					prop_name.clone(),
					match prop.ty {
						crate::config::TbaMatchPropType::Bool => {
							if let RawTbaScoreBreakdownValue::Boolean(value) = *data {
								MatchEntryValue::Bool(MatchBoolEntry { value })
							} else if let RawTbaScoreBreakdownValue::String(value) = data {
								MatchEntryValue::Bool(MatchBoolEntry {
									value: value.starts_with('Y') || value.starts_with('y'),
								})
							} else {
								panic!("Expected TBA data of type bool for prop {name}, but found {data:?}");
							}
						}
						crate::config::TbaMatchPropType::Enum => {
							if let RawTbaScoreBreakdownValue::String(string) = data {
								if !prop
									.options
									.as_ref()
									.map(|o| o.contains(string))
									.unwrap_or_default()
								{
									panic!("Invalid enum string {string:?} for TBA prop {name}, expected one of: {:?}", prop.options);
								}
								MatchEntryValue::Enum(MatchEnumEntry {
									value: string.clone(),
								})
							} else {
								panic!("Expected TBA data of type string (enum) for prop {name}, but found {data:?}");
							}
						}
						crate::config::TbaMatchPropType::Number => {
							if let RawTbaScoreBreakdownValue::Number(count) = *data {
								MatchEntryValue::Counter(CounterEntry { count })
							} else {
								panic!("Expected TBA data of type number for prop {name}, but found {data:?}");
							}
						}
					},
				)
			})
			.collect()
	})
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
struct RawTbaAlliances {
	blue: RawTbaAlliance,
	red: RawTbaAlliance,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
struct RawTbaAlliance {
	score: Option<i16>,
	team_keys: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(untagged)]
enum RawTbaScoreBreakdownValue {
	Number(i32),
	String(String),
	Boolean(bool),
	//#[serde(default)]
	//Unknown,
}

#[derive(Debug, Default, Clone, PartialEq, Deserialize)]
struct RawTbaScoreBreakdowns {
	blue: HashMap<String, RawTbaScoreBreakdownValue>,
	red: HashMap<String, RawTbaScoreBreakdownValue>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
struct RawTbaTeam {
	team_number: u32,
	name: Option<String>,
	nickname: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
struct RawTbaImage {
	#[serde(rename = "type")]
	image_type: String,
	details: Option<RawTbaImageDetails>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawTbaImageDetails {
	base64_image: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfo {
	pub num: u32,
	pub name: String,
	pub has_avatar: bool,
}

impl TeamInfo {
	pub fn get_icon_url(&self) -> Option<String> {
		self.has_avatar.then(|| format!("/avatar/{}", self.num))
	}
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct SetMatch {
	pub set: u32,
	pub num: u32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(tag = "match_type", rename_all = "snake_case")]
#[oai(discriminator_name = "match_type", rename_all = "snake_case")]
pub enum MatchId {
	Practice(SetMatch),
	Qualification(SetMatch),
	Quarterfinal(SetMatch),
	Semifinal(SetMatch),
	Final(SetMatch),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Enum, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub enum MatchResult {
	Tbd,
	Red,
	Blue,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CustomEntries {
	pub blue: [HashMap<String, MatchEntryValue>; 3],
	pub red: [HashMap<String, MatchEntryValue>; 3],
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchInfo {
	pub id: MatchId,
	/// Start time in milliseconds since the unix epoch.
	pub start_time: u64,
	// Sometimes there are actually more or less than 3 teams for various
	// gross real-world "practical" reasons (ew)
	pub teams_blue: Vec<u32>,
	pub teams_red: Vec<u32>,
	pub result: MatchResult,
	pub score_blue: Option<u16>,
	pub score_red: Option<u16>,
	pub custom_entries: CustomEntries,
}
