use std::{
	collections::{btree_map::Entry, BTreeMap},
	sync::Arc,
};

use color_eyre::{eyre::bail, Result};
use log::error;
use poem::http::{HeaderMap, HeaderValue};
use poem_openapi::{Object, Union};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use ts_rs::TS;

/// A struct to manage and cache information from the blue alliance
#[derive(Debug)]
pub struct Tba {
	event_cache: Mutex<BTreeMap<String, Arc<EventInfo>>>,
	client: Client,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct EventInfo {
	pub match_infos: Vec<MatchInfo>,
}

impl EventInfo {
	fn from_match_infos(match_infos: Vec<RawTbaMatch>) -> EventInfo {
		EventInfo {
			match_infos: match_infos
				.into_iter()
				.filter_map(|m| m.to_match().ok())
				.collect(),
		}
	}
}

impl Tba {
	pub fn new(key: String) -> Result<Tba> {
		let mut headers = HeaderMap::new();
		headers.insert("X-TBA-Auth-Key", HeaderValue::from_str(&key)?);
		Ok(Tba {
			event_cache: Mutex::new(BTreeMap::new()),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.default_headers(headers)
				.build()?,
		})
	}
	pub async fn get_event(&self, event: &str) -> Option<Arc<EventInfo>> {
		Some(
			match self.event_cache.lock().await.entry(event.to_string()) {
				Entry::Occupied(entry) => entry.into_mut(),
				Entry::Vacant(entry) => entry.insert(Arc::new(EventInfo::from_match_infos(
					self.client
						.get("https://www.thebluealliance.com/api/v3/event/2022bcvi/matches")
						.send()
						.await
						.ok()?
						.json::<Vec<RawTbaMatch>>()
						.await
						.ok()?,
				))),
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
}

impl RawTbaMatch {
	fn to_match(self) -> Result<MatchInfo> {
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
			completed: false,
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
	team_keys: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct SetMatch {
	set: u32,
	num: u32,
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
	pub completed: bool,
}
