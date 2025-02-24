use std::collections::HashSet;
use std::sync::Arc;
use std::time::Instant;
use std::{collections::HashMap, time::Duration};

use color_eyre::Result;
use log::{error, info};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use tokio::sync::{Mutex, RwLock};

use crate::config::{MatchStatisticsPropType, StatboticsConfig};

#[derive(Debug, Clone, PartialEq)]
pub struct StatboticsTeam {
	pub epa: StatboticsEpa,
	pub record: StatboticsRecordQuals,
	pub other_details: HashMap<String, f32>,
	pub last_update: Instant,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsTeamEvent {
	pub epa: StatboticsEpa,
	pub record: StatboticsRecordOuter,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsTeamYear {
	pub epa: StatboticsEpa,
	pub record: StatboticsRecordSimple,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsEpa {
	pub total_points: StatboticsTotalPoints,
	pub breakdown: StatboticsEpaBreakdown,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsTotalPoints {
	pub mean: f32,
	pub sd: f32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsEpaBreakdown {
	pub total_points: f32,
	pub auto_points: f32,
	pub teleop_points: f32,
	pub endgame_points: f32,
	pub rp_1: f32,
	pub rp_2: f32,
	pub rp_3: Option<f32>,
	#[serde(flatten)]
	pub extra: HashMap<String, f32>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsRecordOuter {
	pub qual: StatboticsRecordQuals,
	pub elim: StatboticsRecordSimple,
	pub total: StatboticsRecordSimple,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsRecordQuals {
	pub wins: u32,
	pub losses: u32,
	pub ties: u32,
	pub count: u32,
	pub rps: u32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct StatboticsRecordSimple {
	pub wins: u32,
	pub losses: u32,
	pub ties: u32,
	pub count: u32,
}

#[derive(Debug)]
pub struct StatboticsCache {
	client: Client,
	teams: Arc<RwLock<HashMap<u32, Arc<StatboticsTeam>>>>,
	teams_loading: Arc<Mutex<HashSet<u32>>>,
	event: String,
	year: u32,
	config: StatboticsConfig,
}

impl StatboticsCache {
	pub fn new(event: &str, year: u32, config: StatboticsConfig) -> Self {
		Self {
			teams: Arc::new(RwLock::new(HashMap::new())),
			teams_loading: Arc::new(Mutex::new(HashSet::new())),
			client: Client::builder()
				.user_agent(env!("CARGO_PKG_NAME"))
				.build()
				.unwrap(),
			event: event.to_string(),
			year,
			config,
		}
	}
	pub async fn get(&self, team: u32) -> Option<Arc<StatboticsTeam>> {
		let team_stats = self.teams.read().await.get(&team).cloned();

		match team_stats {
			None => match Self::load_team(&self.client, team, &self.event, self.year, &self.config)
				.await
			{
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
				if team_stats.last_update.elapsed() > Duration::from_secs(5 * 60) {
					self.trigger_load_team(team).await;
				}

				Some(team_stats)
			}
		}
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
			let year = self.year;
			let config = self.config.clone();
			spawn(async move {
				match Self::load_team(&client_clone, team, &event, year, &config).await {
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

	async fn load_team(
		client: &Client,
		team: u32,
		event: &str,
		year: u32,
		config: &StatboticsConfig,
	) -> Result<Arc<StatboticsTeam>> {
		info!("Statbotics ({team}): Loading data");

		if let Ok(team_event) = client
			.get(format!(
				"https://api.statbotics.io/v3/team_event/{team}/{event}",
			))
			.send()
			.await?
			.json::<StatboticsTeamEvent>()
			.await
		{
			return Ok(Arc::new(StatboticsTeam {
				other_details: Self::get_other_details(&team_event.epa.breakdown, config),
				epa: team_event.epa,
				record: StatboticsRecordQuals {
					wins: team_event.record.total.wins,
					losses: team_event.record.total.losses,
					ties: team_event.record.total.ties,
					count: team_event.record.total.count,
					rps: team_event.record.qual.rps,
				},
				last_update: Instant::now(),
			}));
		}

		let team_year = client
			.get(format!(
				"https://api.statbotics.io/v3/team_year/{team}/{year}",
			))
			.send()
			.await?
			.json::<StatboticsTeamYear>()
			.await?;

		Ok(Arc::new(StatboticsTeam {
			other_details: Self::get_other_details(&team_year.epa.breakdown, config),
			epa: team_year.epa,
			record: StatboticsRecordQuals {
				wins: team_year.record.wins,
				losses: team_year.record.losses,
				ties: team_year.record.ties,
				count: team_year.record.count,
				rps: 0,
			},
			last_update: Instant::now(),
		}))
	}
	fn get_other_details(
		epa: &StatboticsEpaBreakdown,
		config: &StatboticsConfig,
	) -> HashMap<String, f32> {
		config
			.props
			.iter()
			.filter_map(|(key, prop)| {
				match prop.ty {
					MatchStatisticsPropType::Number => prop
						.property
						.as_ref()
						.and_then(|p| epa.extra.get(p))
						.map(|value| (key.clone(), *value)),
					MatchStatisticsPropType::Sum => prop
						.properties
						.as_ref()
						.map(|properties| {
							properties
								.iter()
								.filter_map(|p| epa.extra.get(p))
								.sum::<f32>()
						})
						.map(|value| (key.clone(), value)),
					MatchStatisticsPropType::Bool | MatchStatisticsPropType::Enum => {
						// TODO
						None
					}
				}
			})
			.collect()
	}
}
