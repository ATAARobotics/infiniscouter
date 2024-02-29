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
pub struct DriverEntryTimedId {
	pub match_id: String,
	pub team_id: String,
	#[ts(type = "number")]
	pub timestamp_ms: u64,
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
pub struct MatchEntryTimedId {
	pub match_id: String,
	pub team_id: String,
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PitEntryIdData {
	pub team_id: String,
	pub data: MatchEntryData,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PitEntryTimedId {
	pub team_id: String,
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchEntryData {
	/// The mapping from entry ids to entry values.
	pub entries: HashMap<String, MatchEntryValue>,
	/// The scout for the whole match (for old data)
	pub scout: Option<String>,
	/// The timestamp for the whole match (for old data)
	#[ts(type = "number")]
	pub timestamp_ms: Option<u64>,
}

impl MatchEntryData {
	pub fn get_latest_scout(&self) -> Option<String> {
		self
			.entries
			.values()
			.map(|value| (value.get_scout(), value.get_timestamp()))
			.max_by_key(|(_, t)| *t)
			.map(|(s, _)| s.to_string())
	}
	
	pub fn get_scouts(&self) -> Vec<(String, usize)> {
		let mut scouts = self
			.entries
			.values()
			.map(|value| value.get_scout())
			.collect::<Vec<_>>();

		scouts.sort();

		scouts
			.chunk_by(|a, b| a == b)
			.map(|chunk| (chunk[0].to_string(), chunk.len()))
			.collect()
	}

	pub fn get_timestamp(&self) -> u64 {
		self.entries
			.values()
			.map(|value| value.get_timestamp())
			.max()
			.unwrap_or_default()
	}
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

impl MatchEntryValue {
	pub fn get_scout(&self) -> &str {
		match self {
			MatchEntryValue::Ability(MatchAbilityEntry { scout, .. })
			| MatchEntryValue::Enum(MatchEnumEntry { scout, .. })
			| MatchEntryValue::Bool(MatchBoolEntry { scout, .. })
			| MatchEntryValue::Counter(CounterEntry { scout, .. })
			| MatchEntryValue::TextEntry(TextFieldEntry { scout, .. })
			| MatchEntryValue::Image(ImageEntry { scout, .. })
			| MatchEntryValue::Timer(MatchTimerEntry { scout, .. }) => scout,
		}
	}

	pub fn set_scout_if_blank(&mut self, new_scout: &str) {
		match self {
			MatchEntryValue::Ability(MatchAbilityEntry { scout, .. })
			| MatchEntryValue::Enum(MatchEnumEntry { scout, .. })
			| MatchEntryValue::Bool(MatchBoolEntry { scout, .. })
			| MatchEntryValue::Counter(CounterEntry { scout, .. })
			| MatchEntryValue::TextEntry(TextFieldEntry { scout, .. })
			| MatchEntryValue::Image(ImageEntry { scout, .. })
			| MatchEntryValue::Timer(MatchTimerEntry { scout, .. }) => {
				if scout.is_empty() {
					*scout = new_scout.to_string()
				}
			}
		};
	}

	pub fn get_timestamp(&self) -> u64 {
		match self {
			MatchEntryValue::Ability(MatchAbilityEntry { timestamp_ms, .. })
			| MatchEntryValue::Enum(MatchEnumEntry { timestamp_ms, .. })
			| MatchEntryValue::Bool(MatchBoolEntry { timestamp_ms, .. })
			| MatchEntryValue::Counter(CounterEntry { timestamp_ms, .. })
			| MatchEntryValue::TextEntry(TextFieldEntry { timestamp_ms, .. })
			| MatchEntryValue::Image(ImageEntry { timestamp_ms, .. })
			| MatchEntryValue::Timer(MatchTimerEntry { timestamp_ms, .. }) => *timestamp_ms,
		}
	}

	pub fn set_timestamp_if_blank(&mut self, new_timestamp_ms: u64) {
		match self {
			MatchEntryValue::Ability(MatchAbilityEntry { timestamp_ms, .. })
			| MatchEntryValue::Enum(MatchEnumEntry { timestamp_ms, .. })
			| MatchEntryValue::Bool(MatchBoolEntry { timestamp_ms, .. })
			| MatchEntryValue::Counter(CounterEntry { timestamp_ms, .. })
			| MatchEntryValue::TextEntry(TextFieldEntry { timestamp_ms, .. })
			| MatchEntryValue::Image(ImageEntry { timestamp_ms, .. })
			| MatchEntryValue::Timer(MatchTimerEntry { timestamp_ms, .. }) => {
				if *timestamp_ms == 0 {
					*timestamp_ms = new_timestamp_ms
				}
			}
		};
	}

	pub fn is_different(&self, other: &MatchEntryValue) -> bool {
		match (self, other) {
			(
				MatchEntryValue::Ability(MatchAbilityEntry { value: value1, .. }),
				MatchEntryValue::Ability(MatchAbilityEntry { value: value2, .. }),
			) => value1 != value2,
			(
				MatchEntryValue::Enum(MatchEnumEntry { value: value1, .. }),
				MatchEntryValue::Enum(MatchEnumEntry { value: value2, .. }),
			) => value1 != value2,
			(
				MatchEntryValue::Bool(MatchBoolEntry { value: value1, .. }),
				MatchEntryValue::Bool(MatchBoolEntry { value: value2, .. }),
			) => value1 != value2,
			(
				MatchEntryValue::Counter(CounterEntry { count: value1, .. }),
				MatchEntryValue::Counter(CounterEntry { count: value2, .. }),
			) => value1 != value2,
			(
				MatchEntryValue::TextEntry(TextFieldEntry { text: value1, .. }),
				MatchEntryValue::TextEntry(TextFieldEntry { text: value2, .. }),
			) => value1 != value2,
			(
				MatchEntryValue::Image(ImageEntry { images: value1, .. }),
				MatchEntryValue::Image(ImageEntry { images: value2, .. }),
			) => value1 != value2,
			(
				MatchEntryValue::Timer(MatchTimerEntry {
					time_seconds: value1,
					..
				}),
				MatchEntryValue::Timer(MatchTimerEntry {
					time_seconds: value2,
					..
				}),
			) => value1 != value2,
			_ => true,
		}
	}
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchAbilityEntry {
	/// The value
	pub value: MatchAbilityValue,
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
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
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchBoolEntry {
	/// The value
	pub value: bool,
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchTimerEntry {
	/// The value, in seconds
	pub time_seconds: f32,
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct CounterEntry {
	/// The value
	pub count: i32,
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TextFieldEntry {
	/// The text gathered from the user
	pub text: String,
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImageEntry {
	/// A list of image entries
	pub images: Vec<ImageEntryItem>,
	/// The scout that recorded this value
	#[serde(default)]
	#[oai(default)]
	pub scout: String,
	/// The timestamp for this change (to ensure old changes don't overwrite new changes)
	#[serde(default)]
	#[oai(default)]
	#[ts(type = "number")]
	pub timestamp_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImageEntryItem {
	/// The unique ID for this image
	#[serde(default)]
	pub image_id: String,
	/// The format mime type of the image, e.g. `image/png`
	pub image_mime: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImageEntryData {
	/// The unique ID for this image
	pub image_id: String,
	/// The format mime type of the image, e.g. `image/png`
	pub image_mime: String,
	/// The actual image data, can be encoded as png, jpeg, or other formats idk (gif, bmp, or webp
	/// would all work I'm sure)
	pub image_data: Vec<u8>,
}
