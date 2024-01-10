use std::sync::Arc;
use std::time::Instant;
use std::{collections::HashMap, time::Duration};

use poem_openapi::Object;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq)]
struct DefaultInstant(Instant);

impl Default for DefaultInstant {
	fn default() -> Self {
		Self(Instant::now())
	}
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct StatboticsTeam {
	pub epa_end: f32,
	pub auto_epa_end: f32,
	pub teleop_epa_end: f32,
	pub endgame_epa_end: f32,
	pub rp_1_epa_end: f32,
	pub rp_2_epa_end: f32,
	pub wins: u32,
	pub losses: u32,
	pub ties: u32,
	#[serde(skip)]
	#[ts(skip)]
	#[oai(skip)]
	last_update: DefaultInstant,
}

#[derive(Debug)]
pub struct StatboticsCache {
	client: Client,
	teams: RwLock<HashMap<u32, Arc<StatboticsTeam>>>,
	year: u32,
}

impl StatboticsCache {
	pub fn new(year: u32) -> Self {
		Self {
			teams: RwLock::new(HashMap::new()),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.build()
				.unwrap(),
			year,
		}
	}
	pub async fn get(&self, team: u32) -> Option<Arc<StatboticsTeam>> {
		if self
			.teams
			.read()
			.await
			.get(&team)
			.map(|team| team.last_update.0.elapsed() > Duration::from_secs(5 * 60))
			.unwrap_or(true)
		{
			self.teams.write().await.insert(
				team,
				Arc::new(
					self.client
						.get(format!(
							"https://api.statbotics.io/v2/team_year/{team}/{}",
							self.year
						))
						.send()
						.await
						.ok()?
						.json::<StatboticsTeam>()
						.await
						.ok()?,
				),
			);
		}
		Some(self.teams.read().await[&team].clone())
	}
}
