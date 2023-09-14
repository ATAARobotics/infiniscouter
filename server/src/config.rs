use color_eyre::eyre::eyre;
use color_eyre::Result;
use poem_openapi::{Enum, Object, Union};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::iter;
use ts_rs::TS;

/// Global configuration for a "game" e.g. rapid react
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct GameConfig {
	/// The name of this game
	name: String,
	/// The year of this game
	year: u32,
	/// Metric categories
	categories: HashMap<String, MetricCategory>,
	/// Names of the numbered ranking points, usually 2
	ranking_points: Vec<String>,
	/// Configuration on how to display collected information
	display: DisplayConfig,
}

/// A category for metrics to collect
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct MetricCategory {
	/// The display name for the category
	name: String,
	/// List of metrics to collect in this category
	metrics: HashMap<String, CollectedMetric>,
}

/// A metric to collect
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct CollectedMetric {
	/// The name of this metric
	name: String,
	/// A lengthy description for this metric
	description: String,
	/// What data gathering stages to collect from
	#[serde(default)]
	collect: CollectionOption,
	/// Config for what type of data to collect
	metric: CollectedMetricType,
}

/// Where to get the data from
#[derive(Debug, Clone, PartialEq, Default, Deserialize, Serialize, Enum, TS)]
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

/// How to collect the metric
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
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
pub struct AbilityMetric {
	/// If this implies another ability, or set of abilities
	#[serde(default)]
	implies: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct EnumMetric {
	/// Options for the enum
	options: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct BoolMetric {}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct TimerMetric {}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct StatboticsTeamMetric {
	/// The property to extract from the statbotics team object
	prop: String,
}

/// Configure how the data is processed and displayed
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct DisplayConfig {
	/// Config for the alliance selection team-list table, specifically the data for a single row
	team_row: Vec<DisplayColumn>,
	/// Config for the pre-match display
	pre_match: PreMatchDisplay,
}

/// A column for the alliance selection team-list table
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
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
	CommonYearSpecific(CommonYearSpecificMetrics),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct SingleMetric {
	/// The id of the metric
	metric: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct TeamNameMetric {}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct CommonYearSpecificMetrics {}

/// Configuration for the pre-match display
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
pub struct PreMatchDisplay {}

#[derive(Debug, Clone, PartialEq)]
pub struct ConfigManager {
	/// Game configs for each year.
	games: HashMap<u32, GameConfig>,
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
					games.insert(config.year, config);
				}
				Err(err) => {
					log::error!("Failed to load game config file '{filename}': {err}");
				}
			}
		}

		Ok(Self { games })
	}
	/// Get the full configuration for a specific year's game
	pub fn get_game_config(&self, year: u32) -> Option<&GameConfig> {
		self.games.get(&year)
	}
}
