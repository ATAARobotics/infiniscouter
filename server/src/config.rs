pub mod match_entry;

use color_eyre::eyre::eyre;
use color_eyre::Result;
use poem_openapi::{Enum, Object, Union};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::iter;
use std::sync::Arc;
use ts_rs::TS;

use crate::analysis::TBA_PREFIX;
use crate::config::match_entry::{EntryType, MatchEntryFields};

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
	/// Names of stats to get from the blue alliance
	pub tba: TbaConfig,
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
	/// The relative position of this category in the UI; lower comes before higher
	pub order: Option<u32>,
	/// List of metrics to collect in this category
	#[serde(default)]
	pub metrics: HashMap<String, CollectedMetric>,
}

/// A metric to collect
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CollectedMetric {
	/// The name of this metric
	pub name: String,
	/// The relative position of this metric in the UI; lower comes before higher
	pub order: u32,
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
	/// Only collect in the match, the default
	#[default]
	MatchOnly,
	/// Collect in the match and the pits
	MatchPit,
	/// Only collect in the pits
	PitOnly,
	/// Only collect from the drivers
	DriveOnly,
	/// Not collected (for values gathered from the internet)
	Never,
}

impl CollectionOption {
	pub fn collect_from_drive(&self) -> bool {
		matches!(self, CollectionOption::DriveOnly)
	}
	pub fn collect_in_match(&self) -> bool {
		matches!(
			self,
			CollectionOption::MatchOnly | CollectionOption::MatchPit
		)
	}
	pub fn collect_in_pit(&self) -> bool {
		matches!(self, CollectionOption::PitOnly | CollectionOption::MatchPit)
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
	/// A metric that represents an amount of things
	Counter(CounterMetric),
	/// A text entry field, either single line or multi lined
	TextEntry(TextEntryMetric),
	/// An picture field, for example for pit scouting robot pictures
	Image(ImageMetric),
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
pub struct CounterMetric {
	limit_range: Option<CounterRange>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CounterRange {
	start: i32,
	end_inclusive: i32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TextEntryMetric {
	multiline: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImageMetric {
	allow_video: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct StatboticsTeamMetric {
	/// The Statbotics properties to include
	pub props: Vec<String>,
}

/// Configuration for The Blue Alliance
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TbaConfig {
	pub order: u32,
	/// The set of TBA match data properties
	pub props: HashMap<String, TbaMatchProp>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TbaMatchProp {
	#[serde(rename = "type")]
	#[oai(rename = "type")]
	pub ty: TbaMatchPropType,
	pub property: String,
	pub name: String,
	pub options: Option<Vec<TbaMatchPropOption>>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Enum, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(rename_all = "snake_case")]
#[oai(rename_all = "snake_case")]
pub enum TbaMatchPropType {
	Bool,
	Enum,
	Number,
	Sum
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TbaMatchPropOption {
	pub id: String,
	pub name: Option<String>,
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
	/// Display a single metric, but filter the data by another metric
	Filtered(FilteredMetric),
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
pub struct FilteredMetric {
	/// The id of the metric
	pub metric: String,
	/// The id of the boolean metric to filter by
	pub filter_by: String,
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
pub struct PreMatchDisplay {
	/// The metric to use for the score
	pub score: String,
	/// The definition of the score bar graph
	pub graph: Vec<PreMatchGraphElement>,
	/// The metrics to also show on the page
	pub metrics: Vec<String>,
}

/// Configuration for the pre-match display
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PreMatchGraphElement {
	// The name of the bar graph component
	pub name: String,
	// The metric to use for the bar graph component
	pub metric: String,
}

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
	/// The fields to gather per match when scouting
	pub match_entry_fields: MatchEntryFields,
	/// The fields to gather per match from the drive team
	pub driver_entry_fields: MatchEntryFields,
	/// The fields to gather for pit scouting
	pub pit_entry_fields: MatchEntryFields,
	/// All the categories for all field types
	pub all_metrics: Vec<String>,
}

impl From<GameConfig> for GameConfigs {
	fn from(value: GameConfig) -> Self {
		let mut all_categories = value.categories.values().cloned().collect::<Vec<_>>();
		all_categories.push(MetricCategory {
			name: "TBA".to_string(),
			order: Some(value.tba.order),
			metrics: value
				.tba
				.props
				.keys()
				.cloned()
				.enumerate()
				.map(|(idx, prop)| (format!("{TBA_PREFIX}{prop}"), CollectedMetric {
					name: "N/A".to_string(),
					order: idx as u32,
					collect: CollectionOption::Never,
					description: "N/A".to_string(),
					metric: CollectedMetricType::Bool(BoolMetric {

					})
				}))
				.collect(),
		});
		all_categories.sort_by_key(|c| c.order);

		GameConfigs {
			match_entry_fields: MatchEntryFields::from_game_config(&value, EntryType::Match),
			driver_entry_fields: MatchEntryFields::from_game_config(&value, EntryType::DriveTeam),
			pit_entry_fields: MatchEntryFields::from_game_config(&value, EntryType::Pit),
			all_metrics: all_categories
				.into_iter()
				.flat_map(|category| {
					let mut metrics = category
						.metrics
						.iter()
						.map(|(metric_name, metric)| (metric_name.clone(), metric))
						.collect::<Vec<_>>();
					metrics.sort_by_key(|(_, m)| m.order);

					metrics
						.into_iter()
						.flat_map(|(metric_name, metric)| {
							if let CollectedMetricType::StatboticsTeam(statbotics) = &metric.metric
							{
								statbotics
									.props
									.iter()
									.map(|prop| format!("statbotics-{prop}"))
									.collect()
							} else {
								vec![metric_name]
							}
						})
						.collect::<Vec<_>>()
				})
				.collect(),
			game_config: value,
		}
	}
}

#[derive(Debug, Clone, PartialEq)]
pub struct ConfigManager {
	/// Game configs for each year.
	/// Also preprocesses and caches the
	games: HashMap<u32, Arc<GameConfigs>>,
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
							if cat.order.is_none() {
								cat.order = common_cat.order;
							}
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
					games.insert(config.year, Arc::new(config.into()));
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
	pub fn get_game_config(&self, year: u32) -> Option<&Arc<GameConfigs>> {
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
