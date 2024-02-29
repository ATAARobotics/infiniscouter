use std::collections::HashMap;

use poem_openapi::Object;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{api::data::MatchEntryIdData, config::TeamConfig, database::Database};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct LeaderboardInfo {
	pub leaderboard: HashMap<String, LeaderboardPerson>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct LeaderboardPerson {
	pub name: String,
	pub matches_scouted: usize,
	pub pits_scouted: usize,
	pub drivers_scouted: usize,
	pub teams_scouted: HashMap<usize, usize>,
}

#[derive(Debug)]
enum EntryType {
	Match,
	Pit,
	Driver,
}

pub fn get_leaderboard(db: &Database, team_config: &TeamConfig) -> LeaderboardInfo {
	let mut scouts = HashMap::new();
	for (entry_type, entry) in db
		.get_all_match_entries(team_config.current_year, &team_config.current_event)
		.into_iter()
		.map(|me| (EntryType::Match, me))
		.chain(
			db.get_all_pit_entries(team_config.current_year, &team_config.current_event)
				.into_iter()
				.map(|pe| {
					(
						EntryType::Pit,
						MatchEntryIdData {
							match_id: String::new(),
							team_id: pe.0,
							data: pe.1,
						},
					)
				}),
		)
		.chain(
			db.get_all_driver_entries(team_config.current_year, &team_config.current_event)
				.into_iter()
				.map(|de| {
					(
						EntryType::Driver,
						MatchEntryIdData {
							match_id: de.match_id,
							team_id: de.team_id,
							data: de.data,
						},
					)
				}),
		) {
		let scout = scouts
			.entry(entry.data.scout.trim().to_lowercase())
			.or_insert_with(|| LeaderboardPerson {
				name: entry.data.scout.clone(),
				matches_scouted: 0,
				pits_scouted: 0,
				drivers_scouted: 0,
				teams_scouted: HashMap::new(),
			});
		match entry_type {
			EntryType::Match => scout.matches_scouted += 1,
			EntryType::Pit => scout.pits_scouted += 1,
			EntryType::Driver => scout.drivers_scouted += 1,
		}
		*scout
			.teams_scouted
			.entry(entry.team_id.parse().unwrap())
			.or_default() += 1;
	}
	LeaderboardInfo {
		leaderboard: scouts,
	}
}
