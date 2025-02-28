use crate::api::data::{FullEntryData, MatchEntryValue};
use crate::config::match_entry::{MatchEntryFields, MatchEntryType};

pub fn validate_match(mut data: FullEntryData, fields: &MatchEntryFields) -> FullEntryData {
	data.entries.retain(|field_name, data| {
		if let Some(entry) = fields.entries.get(field_name) {
			matches!(
				(&entry.entry, &data),
				(MatchEntryType::Ability(_), MatchEntryValue::Ability(_))
					| (MatchEntryType::Enum(_), MatchEntryValue::Enum(_))
					| (MatchEntryType::Bool(_), MatchEntryValue::Bool(_))
					| (MatchEntryType::Timer(_), MatchEntryValue::Timer(_))
					| (MatchEntryType::Counter(_), MatchEntryValue::Counter(_))
					| (MatchEntryType::TextEntry(_), MatchEntryValue::TextEntry(_))
					| (MatchEntryType::Image(_), MatchEntryValue::Image(_))
			)
		} else {
			false
		}
	});
	data
}
