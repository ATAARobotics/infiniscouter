use base64::Engine;
use std::{
	collections::{btree_map::Entry, BTreeMap, HashMap},
	sync::Arc,
};

use base64::engine::general_purpose::STANDARD;
use color_eyre::{eyre::bail, Result};
use futures_util::future;
use log::error;
use poem::http::{HeaderMap, HeaderValue};
use poem_openapi::{Enum, Object, Union};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, RwLock};
use ts_rs::TS;

/// A struct to manage and cache information from the blue alliance
#[derive(Debug)]
pub struct Tba {
	event_cache: Mutex<BTreeMap<String, Arc<EventInfo>>>,
	#[allow(clippy::type_complexity)]
	avatar_cache: RwLock<HashMap<(u32, u32), Option<Vec<u8>>>>,
	client: Client,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct EventInfo {
	pub match_infos: Vec<MatchInfo>,
	pub team_infos: HashMap<u32, TeamInfo>,
	pub event: String,
	pub year: u32,
}

impl EventInfo {
	async fn new(
		match_infos: Vec<RawTbaMatch>,
		team_infos: Vec<TeamInfo>,
		year: u32,
		event: &str,
	) -> EventInfo {
		let mut match_infos: Vec<_> = match_infos
			.into_iter()
			.filter_map(|m| m.into_match().ok())
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
		}
	}
}

impl Tba {
	pub fn new(key: String) -> Result<Tba> {
		let mut headers = HeaderMap::new();
		headers.insert("X-TBA-Auth-Key", HeaderValue::from_str(&key)?);
		Ok(Tba {
			avatar_cache: RwLock::new(HashMap::new()),
			event_cache: Mutex::new(BTreeMap::new()),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.default_headers(headers)
				.build()?,
		})
	}

	pub async fn get_avatar(&self, team: u32, year: u32) -> Option<Vec<u8>> {
		if let Some(data) = self.avatar_cache.read().await.get(&(team, year)) {
			return data.clone();
		}

		let image = self
			.client
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

		self.avatar_cache
			.write()
			.await
			.insert((team, year), image.clone());

		image
	}

	pub async fn get_event(&self, year: u32, event: &str) -> Option<Arc<EventInfo>> {
		Some(
			match self.event_cache.lock().await.entry(event.to_string()) {
				Entry::Occupied(entry) => entry.into_mut(),
				Entry::Vacant(entry) => entry.insert(Arc::new({
					let mut teams = self
						.client
						.get(format!(
							"https://www.thebluealliance.com/api/v3/event/{event}/teams"
						))
						.send()
						.await
						.ok()?
						.json::<Vec<RawTbaTeam>>()
						.await
						.ok()?;
					teams.retain(|t| !(9990..=9999).contains(&t.team_number));
					let team_infos: Vec<_> =
						future::join_all(teams.into_iter().map(|raw_team| async move {
							TeamInfo {
								num: raw_team.team_number,
								name: raw_team
									.nickname
									.or(raw_team.name)
									.unwrap_or_else(|| "unknown".to_string()),
								has_avatar: self
									.get_avatar(raw_team.team_number, year)
									.await
									.is_some(),
							}
						}))
						.await
						.into_iter()
						.collect();
					EventInfo::new(
						self.client
							.get(format!(
								"https://www.thebluealliance.com/api/v3/event/{event}/matches"
							))
							.send()
							.await
							.ok()?
							.json::<Vec<RawTbaMatch>>()
							.await
							.ok()?,
						team_infos,
						year,
						event,
					)
					.await
				})),
			}
			.to_owned(),
		)
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
	winning_alliance: Option<String>,
}

impl RawTbaMatch {
	fn into_match(self) -> Result<MatchInfo> {
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
		})
	}
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
}
