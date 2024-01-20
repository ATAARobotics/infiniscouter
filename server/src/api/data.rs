use poem_openapi::{Enum, Object, Union};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntryIdData {
	pub match_id: String,
	pub team_id: String,
	pub data: MatchEntryData,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PitEntryIdData {
	pub team_id: String,
	pub data: MatchEntryData,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntryData {
	/// The mapping from entry ids to entry values.
	pub entries: HashMap<String, MatchEntryValue>,
	#[serde(default)]
    #[oai(default)]
	pub timestamp_ms: u32,
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
	pub value: String,
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
