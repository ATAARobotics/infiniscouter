use std::collections::{BTreeMap, HashMap};

use color_eyre::Result;
use poem::http::HeaderMap;
use poem_openapi::{Object, Union};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// A struct to manage and cache information from the blue alliance
pub struct Tba {
	event_cache: BTreeMap<String, EventInfo>,
	client: Client,
}

struct EventInfo {
	match_infos: Vec<MatchInfo>,
}

impl Tba {
	pub fn new(key: String) -> Tba {
		let mut headers = HeaderMap::new();
		headers.insert("X-TBA-Auth-Key", key);
		Tba {
			event_cache: BTreeMap::new(),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.default_headers(headers)
				.build(),
		}
	}
	pub async fn get_event(&mut self, event: &str) -> EventInfo {
		self.event_cache
			.entry(event.to_string())
			.or_insert_with(|| {
				let raw_matches: Vec<RawTbaMatch> = self
					.client
					.get("https://www.thebluealliance.com/api/v3/event/2022bcvi/matches")
					.send()
					.await
					.json()
					.unwrap();
			})
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
	fn to_match(&self) -> Result<MatchInfo> {
		MatchInfo {
			id: match &self.comp_level {
				"q" => MatchId::Qualification(self.match_number),
				"qf" => MatchId::Qualification(self.match_number),
				"sf" => MatchId::Qualification(self.match_number),
				"f" => MatchId::Qualification(self.match_number),
			},
			start_time: self.actual_time.unwrap_or(self.predicted_time),
			teams_blue: self.alliances.blue.team_keys,
			teams_red: self.alliances.red.team_keys,
			completed: false,
		}
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

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub enum MatchId {
	Practice(u32),
	Qualification(u32),
	Quarterfinal(u32, u32),
	Semifinal(u32, u32),
	Final(u32),
}

impl MatchId {
	fn to_key(&self) -> String {
		match self {
			MatchId::Practice(num) => format!("pm{num}"), // Not on TBA?
			MatchId::Qualification(num) => format!("qm{num}"),
			MatchId::Semifinal(round, num) => format!("sf{round}m{num}"),
			MatchId::Final(num) => format!("f1m{num}"),
		}
	}
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchInfo {
	pub id: MatchId,
	/// Start time in milliseconds since the unix epoch.
	pub start_time: u64,
	pub teams_blue: [u32; 3],
	pub teams_red: [u32; 3],
	pub completed: bool,
}
