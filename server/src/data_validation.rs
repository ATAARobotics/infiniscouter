use crate::api::data::{MatchEntryData, MatchEntryValue};
use crate::config::match_entry::{MatchEntryFields, MatchEntryType};

pub fn validate_match(mut data: MatchEntryData, fields: &MatchEntryFields) -> MatchEntryData {
	data.entries.retain(|field_name, data| {
		if let Some(entry) = fields.entries.get(field_name) {
			matches!(
				(&entry.entry, &data),
				(MatchEntryType::Ability(_), MatchEntryValue::Ability(_))
					| (MatchEntryType::Enum(_), MatchEntryValue::Enum(_))
					| (MatchEntryType::Bool(_), MatchEntryValue::Bool(_))
					| (MatchEntryType::Timer(_), MatchEntryValue::Timer(_))
			)
		} else {
			false
		}
	});
	data
}
