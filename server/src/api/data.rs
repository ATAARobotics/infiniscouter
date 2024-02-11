use poem_openapi::{Enum, Object, Union};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct DriverEntryIdData {
	pub match_id: String,
	pub team_id: String,
	pub data: MatchEntryData,
}

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
	pub scout: String,
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
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
	/// A metric that represents an amount of things
	Counter(CounterEntry),
	/// A text entry field, either single line or multi lined
	TextEntry(TextFieldEntry),
	/// An picture field, for example for pit scouting robot pictures
	Image(ImageEntry),
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

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CounterEntry {
	/// The value
	pub count: i32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TextFieldEntry {
	/// The text gathered from the user
	pub text: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImageEntry {
	/// A list of images
	pub images: Vec<ImageData>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImageData {
	/// The format mime type of the image, e.g. `image/png`
	pub image_mime: String,
	/// The actual image data, can be encoded as png, jpeg, or other formats idk (gif, bmp, or webp
	/// would all work I'm sure)
	pub image_data: Vec<u8>,
}
