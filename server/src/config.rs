pub mod match_entry;

use crate::config::match_entry::MatchEntryFields;
use color_eyre::eyre::eyre;
use color_eyre::Result;
use poem_openapi::{Enum, Object, Union};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::iter;
use ts_rs::TS;

/// Global configuration for a "game" e.g. rapid react
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct GameConfig {
	/// The name of this game
	pub name: String,
	/// The year of this game
	pub year: u32,
	/// Metric categories
	pub categories: HashMap<String, MetricCategory>,
	/// Names of the numbered ranking points, usually 2
	pub ranking_points: Vec<String>,
	/// Configuration on how to display collected information
	pub display: DisplayConfig,
}

/// A category for metrics to collect
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MetricCategory {
	/// The display name for the category
	pub name: String,
	/// List of metrics to collect in this category
	pub metrics: HashMap<String, CollectedMetric>,
}

/// A metric to collect
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CollectedMetric {
	/// The name of this metric
	pub name: String,
	/// A lengthy description for this metric
	pub description: String,
	/// What data gathering stages to collect from
	#[serde(default)]
	pub collect: CollectionOption,
	/// Config for what type of data to collect
	pub metric: CollectedMetricType,
}

/// Where to get the data from
#[derive(Debug, Clone, Copy, PartialEq, Default, Deserialize, Serialize, Enum, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(rename_all = "snake_case")]
#[oai(rename_all = "snake_case")]
pub enum CollectionOption {
	/// Collect in the match and the pits, the default
	#[default]
	MatchPit,
	/// Only collect in the match
	MatchOnly,
	/// Only collect in the pits
	PitOnly,
	/// Collect in pits and from the drivers
	PitDrive,
	/// Only collect from the drivers
	DriveOnly,
	/// Not collected (for values gathered from the internet)
	Never,
}

impl CollectionOption {
	pub fn collect_in_match(&self) -> bool {
		matches!(
			self,
			CollectionOption::MatchOnly | CollectionOption::MatchPit
		)
	}
}

/// How to collect the metric
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(tag = "type", rename_all = "snake_case")]
#[oai(discriminator_name = "type", rename_all = "snake_case")]
pub enum CollectedMetricType {
	/// A metric that represents whether the robot has the ability to do something
	Ability(AbilityMetric),
	/// A metric that represents one of a selection of options
	Enum(EnumMetric),
	/// A metric that represents a yes/no question
	Bool(BoolMetric),
	/// A metric that represents an amount of real-world time
	Timer(TimerMetric),
	/// A metric that represents data fetched from statbotics' team api
	StatboticsTeam(StatboticsTeamMetric),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct AbilityMetric {
	/// If this implies another ability, or set of abilities
	#[serde(default)]
	pub implies: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct EnumMetric {
	/// Options for the enum
	pub options: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct BoolMetric {}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TimerMetric {}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct StatboticsTeamMetric {
	/// The property to extract from the statbotics team object
	pub prop: String,
}

/// Configure how the data is processed and displayed
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct DisplayConfig {
	/// Config for the alliance selection team-list table, specifically the data for a single row
	pub team_row: Vec<DisplayColumn>,
	/// Config for the pre-match display
	pub pre_match: PreMatchDisplay,
}

/// A column for the alliance selection team-list table
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(tag = "source", rename_all = "snake_case")]
#[oai(discriminator_name = "source", rename_all = "snake_case")]
pub enum DisplayColumn {
	/// Display a single metric
	Single(SingleMetric),
	/// Team name
	TeamName(TeamNameMetric),
	/// Special variant used by the common config, don't use
	#[doc(hidden)]
	#[serde(rename = "_YEAR_SPECIFIC")]
	#[oai(mapping = "_YEAR_SPECIFIC")]
	#[ts(skip)]
	CommonYearSpecific(CommonYearSpecificMetrics),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct SingleMetric {
	/// The id of the metric
	pub metric: String,
    #[serde(default)]
    #[oai(default)]
    pub display: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamNameMetric {
    #[serde(default)]
    #[oai(default)]
    pub display: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CommonYearSpecificMetrics {}

/// Configuration for the pre-match display
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PreMatchDisplay {}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamConfig {
	pub team: u32,
	pub current_year: u32,
	/// The FRC event code for the current event (technically also includes the year)
	pub current_event: String,
	/// TBA auth key, we probably don't want this to be sent to the client ever
	#[doc(hidden)]
	#[serde(skip_serializing)]
	#[oai(skip)]
	#[ts(skip)]
	pub tba_auth_key: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct GameConfigs {
	/// The actual game config, all other configs are generated from this
	pub game_config: GameConfig,
	/// The fields to gather per match
	pub match_entry_fields: MatchEntryFields,
}

impl From<GameConfig> for GameConfigs {
	fn from(value: GameConfig) -> Self {
		GameConfigs {
			match_entry_fields: MatchEntryFields::from_game_config(&value),
			game_config: value,
		}
	}
}

#[derive(Debug, Clone, PartialEq)]
pub struct ConfigManager {
	/// Game configs for each year.
	/// Also preprocesses and caches the
	games: HashMap<u32, GameConfigs>,
	/// Configuration that varies per-instance
	config: TeamConfig,
}

#[derive(RustEmbed)]
#[folder = "games"]
struct GameConfigFolder;

impl ConfigManager {
	pub fn new() -> Result<Self> {
		let mut games = HashMap::new();
		let common_config = serde_yaml::from_slice::<GameConfig>(
			&GameConfigFolder::get("common.yaml")
				.ok_or_else(|| eyre!("Missing common config file"))?
				.data,
		)?;
		for (filename, file) in GameConfigFolder::iter()
			.filter(|f| (f.ends_with(".yaml") || f.ends_with(".yml")) && f != "common.yaml")
			.filter_map(|f| GameConfigFolder::get(&f).map(|c| (f, c)))
		{
			match serde_yaml::from_slice::<GameConfig>(&file.data) {
				Ok(mut config) => {
					config.display.team_row = common_config
						.display
						.team_row
						.iter()
						.flat_map(|col| {
							if matches!(col, DisplayColumn::CommonYearSpecific(_)) {
								Box::new(config.display.team_row.iter().cloned())
									as Box<dyn Iterator<Item = DisplayColumn>>
							} else {
								Box::new(iter::once(col.clone()))
									as Box<dyn Iterator<Item = DisplayColumn>>
							}
						})
						.collect();
					for (cat_id, common_cat) in &common_config.categories {
						if let Some(cat) = config.categories.get_mut(cat_id) {
							for (id, met) in &common_cat.metrics {
								cat.metrics.insert(id.clone(), met.clone());
							}
						} else {
							config.categories.insert(cat_id.clone(), common_cat.clone());
						}
					}
					for cat in config.categories.values_mut() {
						for met in cat.metrics.values_mut() {
							if matches!(met.metric, CollectedMetricType::StatboticsTeam(_)) {
								met.collect = CollectionOption::Never;
							}
						}
					}
					games.insert(config.year, config.into());
				}
				Err(err) => {
					log::error!("Failed to load game config file '{filename}': {err}");
				}
			}
		}

		let team_config: TeamConfig = serde_yaml::from_reader(File::open("team_config.yaml")?)?;

		assert!(games.contains_key(&team_config.current_year));

		Ok(Self {
			games,
			config: team_config,
		})
	}
	/// Get the full configuration for a specific year's game
	pub fn get_game_config(&self, year: u32) -> Option<&GameConfigs> {
		self.games.get(&year)
	}
	pub fn get_current_game_config(&self) -> &GameConfigs {
		&self.games[&self.config.current_year]
	}
	pub fn get_server_config(&self) -> &TeamConfig {
		&self.config
	}

	pub fn get_tba_auth_key(&self) -> &str {
		&self.config.tba_auth_key
	}
}
