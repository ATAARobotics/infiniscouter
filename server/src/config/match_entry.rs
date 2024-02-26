use crate::config::{
	AbilityMetric, BoolMetric, CollectedMetricType, CounterMetric, EnumMetric, GameConfig,
	ImageMetric, TextEntryMetric, TimerMetric,
};
use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

// TODO: Rename the following types

/// The type of data entry
#[derive(Debug, Clone, Copy)]
pub enum EntryType {
	/// Data entered by the drive team
	DriveTeam,
	/// Data entered when scouting a match
	Match,
	/// Data entered when pit scouting
	Pit,
}

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
	/// The page that holds this metric
	pub page: String,
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
	/// A metric that represents an amount of things
	Counter(CounterMetric),
	/// A text entry field, either single line or multi lined
	TextEntry(TextEntryMetric),
	/// An picture field, for example for pit scouting robot pictures
	Image(ImageMetric),
	/// An entry that represents an amount of real-world time
	Timer(TimerMetric),
}

impl MatchEntryType {
	fn from(value: &CollectedMetricType, entry_type: EntryType) -> Self {
		match value {
			CollectedMetricType::Ability(a) => match entry_type {
				EntryType::Pit => Self::Bool(BoolMetric {}),
				EntryType::DriveTeam | EntryType::Match => Self::Ability(a.clone()),
			},
			CollectedMetricType::Enum(e) => Self::Enum(e.clone()),
			CollectedMetricType::Bool(b) => Self::Bool(b.clone()),
			CollectedMetricType::Timer(t) => Self::Timer(t.clone()),
			CollectedMetricType::Counter(c) => Self::Counter(c.clone()),
			CollectedMetricType::TextEntry(t) => Self::TextEntry(t.clone()),
			CollectedMetricType::Image(i) => Self::Image(i.clone()),
			CollectedMetricType::StatboticsTeam(_) => {
				unimplemented!("Statbotics metrics aren't collectable per-match.");
			}
			CollectedMetricType::TbaMatch(_) => {
				unimplemented!("TBA metrics aren't collectable per-match.");
			}
		}
	}
}

impl MatchEntryFields {
	pub fn from_game_config(game_config: &GameConfig, entry_type: EntryType) -> Self {
		let mut pages = game_config
			.categories
			.keys()
			.filter_map(|page| game_config.categories.get(page))
			.map(|cat| {
				let mut metrics = cat
					.metrics
					.iter()
					.filter(|(_, metric)| match entry_type {
						EntryType::DriveTeam => metric.collect.collect_from_drive(),
						EntryType::Match => metric.collect.collect_in_match(),
						EntryType::Pit => metric.collect.collect_in_pit(),
					})
					.collect::<Vec<_>>();
				metrics.sort_by_key(|(_, metric)| metric.order);
				(
					cat.order.unwrap_or(1000),
					MatchEntryPage {
						title: cat.name.clone(),
						description: None,
						layout: metrics
							.iter()
							.map(|(metric, _)| metric.to_string())
							.collect(),
					},
				)
			})
			.filter(|(_, page)| !page.layout.is_empty())
			.collect::<Vec<_>>();
		pages.sort_by_key(|(order, _)| *order);
		Self {
			entries: game_config
				.categories
				.values()
				.flat_map(|category| {
					category
						.metrics
						.iter()
						.filter(|(_, metric)| match entry_type {
							EntryType::DriveTeam => metric.collect.collect_from_drive(),
							EntryType::Match => metric.collect.collect_in_match(),
							EntryType::Pit => metric.collect.collect_in_pit(),
						})
						.map(|(metric_id, metric)| {
							(
								metric_id.clone(),
								MatchEntry {
									title: metric.name.clone(),
									description: metric.description.clone(),
									page: category.name.clone(),
									entry: MatchEntryType::from(&metric.metric, entry_type),
								},
							)
						})
				})
				.collect(),
			pages: pages.into_iter().map(|(_, page)| page).collect(),
		}
	}
}
