use crate::config::{AbilityMetric, BoolMetric, CollectedMetricType, EnumMetric, TimerMetric};
use poem_openapi::{Enum, Object, Union};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

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

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntryData {
	/// The mapping from entry ids to entry values.
	pub entries: HashMap<String, MatchEntryValue>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(tag = "type", rename_all = "snake_case")]
#[oai(discriminator_name = "type", rename_all = "snake_case")]
pub enum MatchEntryValue {
	/// An entry that represents whether the robot has the ability to do something
	Ability(MatchAbilityEntry),
	/// An entry that represents one of a selection of options
	Enum(MatchEnumEntry),
	/// An entry that represents a yes/no question
	Bool(MatchBoolEntry),
	/// An entry that represents an amount of real-world time
	Timer(MatchTimerEntry),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchAbilityEntry {
	/// The value
	pub value: MatchAbilityValue,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Enum, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(rename_all = "snake_case")]
#[oai(rename_all = "snake_case")]
pub enum MatchAbilityValue {
	/// No attempt
	Nothing,
	/// Attempted, but did not succeed
	Attempted,
	/// Attempted and succeeded
	Succeeded,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEnumEntry {
	/// The value
	pub value: u32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchBoolEntry {
	/// The value
	pub value: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchTimerEntry {
	/// The value, in seconds
	pub time_seconds: f32,
}
