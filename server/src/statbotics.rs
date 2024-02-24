use std::collections::HashSet;
use std::sync::Arc;
use std::{collections::HashMap, time::Duration};

use color_eyre::Result;
use log::{error, info};
use poem_openapi::Object;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use tokio::sync::{Mutex, RwLock};
use ts_rs::TS;

use crate::DefaultInstant;

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
	pub rps: u32,
	#[serde(skip)]
	#[ts(skip)]
	#[oai(skip)]
	last_update: DefaultInstant,
}

#[derive(Debug)]
pub struct StatboticsCache {
	client: Client,
	teams: Arc<RwLock<HashMap<u32, Arc<StatboticsTeam>>>>,
	teams_loading: Arc<Mutex<HashSet<u32>>>,
	event: String,
}

impl StatboticsCache {
	pub fn new(event: &str) -> Self {
		Self {
			teams: Arc::new(RwLock::new(HashMap::new())),
			teams_loading: Arc::new(Mutex::new(HashSet::new())),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.build()
				.unwrap(),
			event: event.to_string(),
		}
	}
	pub async fn get(&self, team: u32) -> Option<Arc<StatboticsTeam>> {
		let team_stats = self.teams.read().await.get(&team).cloned();

		match team_stats {
			None => match Self::load_team(&self.client, team, &self.event).await {
				Ok(team_stats) => {
					info!("Statbotics ({team}): load complete");
					self.teams.write().await.insert(team, team_stats.clone());
					Some(team_stats)
				}
				Err(err) => {
					error!("Statbotics ({team}): load error: {err}");
					None
				}
			},
			Some(team_stats) => {
				if team_stats.last_update.0.elapsed() > Duration::from_secs(5 * 60) {
					self.trigger_load_team(team).await;
				}

				Some(team_stats)
			}
		}
	}
	async fn load_team(client: &Client, team: u32, event: &str) -> Result<Arc<StatboticsTeam>> {
		info!("Statbotics ({team}): Loading data");

		Ok(Arc::new(
			client
				.get(format!(
					"https://api.statbotics.io/v2/team_event/{team}/{event}",
				))
				.send()
				.await?
				.json::<StatboticsTeam>()
				.await?,
		))
	}
	async fn trigger_load_team(&self, team: u32) {
		let mut lock = self.teams_loading.lock().await;

		if !lock.contains(&team) {
			lock.insert(team);
			drop(lock);

			let client_clone = self.client.clone();
			let teams_clone = self.teams.clone();
			let teams_loading_clone = self.teams_loading.clone();
			let event = self.event.clone();
			spawn(async move {
				match Self::load_team(&client_clone, team, &event).await {
					Ok(data) => {
						info!("Statbotics ({team}): background load complete");
						teams_clone.write().await.insert(team, data);
					}
					Err(err) => {
						error!("Statbotics ({team}): background load error: {err}");
					}
				}

				teams_loading_clone.lock().await.remove(&team);
			});
		}
	}
}
