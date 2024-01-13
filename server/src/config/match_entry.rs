use crate::config::{
	AbilityMetric, BoolMetric, CollectedMetricType, EnumMetric, GameConfig, TimerMetric,
};
use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

// TODO: Rename the following types

/// The list of entries to display to the user to collect and then send back to the server
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntryFields {
	/// List of pages to display, pages can be swiped between
	pub pages: Vec<MatchEntryPage>,
	/// List of entries paired with ids, which are referenced on the pages
	pub entries: HashMap<String, MatchEntry>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntryPage {
	/// Title of this page
	pub title: String,
	/// Description of this page
	pub description: Option<String>,
	/// "Layout" of the page, simply a list of entry ids to display in-order on this page.
	pub layout: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntry {
	/// Human readable name/title of the entry
	pub title: String,
	/// Human readable description of the entry
	pub description: String,
	/// The type of entry along with any parameters (if present)
	pub entry: MatchEntryType,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(tag = "type", rename_all = "snake_case")]
#[oai(discriminator_name = "type", rename_all = "snake_case")]
pub enum MatchEntryType {
	/// An entry that represents whether the robot has the ability to do something
	Ability(AbilityMetric),
	/// An entry that represents one of a selection of options
	Enum(EnumMetric),
	/// An entry that represents a yes/no question
	Bool(BoolMetric),
	/// An entry that represents an amount of real-world time
	Timer(TimerMetric),
}

impl From<&CollectedMetricType> for MatchEntryType {
	fn from(value: &CollectedMetricType) -> Self {
		match value {
			CollectedMetricType::Ability(a) => Self::Ability(a.clone()),
			CollectedMetricType::Enum(e) => Self::Enum(e.clone()),
			CollectedMetricType::Bool(b) => Self::Bool(b.clone()),
			CollectedMetricType::Timer(t) => Self::Timer(t.clone()),
			CollectedMetricType::StatboticsTeam(_) => {
				unimplemented!("Statbotics metrics aren't collectable per-match.");
			}
		}
	}
}

impl MatchEntryFields {
	pub fn from_game_config(game_config: &GameConfig, is_pit: bool) -> Self {
		Self {
			entries: game_config
				.categories
				.values()
				.flat_map(|category| {
					category
						.metrics
						.iter()
						.filter(|(_, metric)| {
							(is_pit && metric.collect.collect_in_pit())
								|| (!is_pit && metric.collect.collect_in_match())
						})
						.map(|(metric_id, metric)| {
							(
								metric_id.clone(),
								MatchEntry {
									title: metric.name.clone(),
									description: metric.description.clone(),
									entry: (&metric.metric).into(),
								},
							)
						})
				})
				.collect(),
			pages: ["auto", "teleop", "endgame", "impressions"]
				.into_iter()
				.filter_map(|page| game_config.categories.get(page))
				.map(|cat| MatchEntryPage {
					title: cat.name.clone(),
					description: None,
					layout: cat
						.metrics
						.iter()
						.filter(|(_, metric)| {
							(is_pit && metric.collect.collect_in_pit())
								|| (!is_pit && metric.collect.collect_in_match())
						})
						.map(|(metric, _)| metric.clone())
						.collect(),
				})
				.collect(),
		}
	}
}
