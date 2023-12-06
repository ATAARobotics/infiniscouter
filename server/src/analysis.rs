use std::collections::HashSet;

use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
	config::{GameConfigs, TeamConfig},
	database::Database,
	tba::Tba,
};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoDisplay {
	pub info: Vec<TeamInfoEntry>,
	pub pin_right_count: usize,
	pub pin_left_count: usize,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub enum TeamInfoEntry {
	Text(TeamInfoTextEntry),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoTextEntry {
	pub sort_text: String,
	pub display_text: String,
}

pub async fn list(
	tba: &Tba,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
) -> Vec<TeamInfoDisplay> {
	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba.get_event(&team_config.current_event).await.unwrap();
	let tba_teams = tba_data
		.match_infos
		.iter()
		.flat_map(|mat| mat.teams_red.iter().chain(mat.teams_blue.iter()))
		.collect::<HashSet<_>>();
	tba_teams
        .into_iter()
		.map(|team| TeamInfoDisplay {
			info: config
				.game_config
				.display
				.team_row
                .iter()
				.map(|column| match column {
					crate::config::DisplayColumn::Single(_) => {
						TeamInfoEntry::Text(TeamInfoTextEntry {
							sort_text: "TODO".to_string(),
							display_text: "TODO".to_string(),
						})
					}
					crate::config::DisplayColumn::TeamName(_) => {
						TeamInfoEntry::Text(TeamInfoTextEntry {
							sort_text: team.to_string(),
							display_text: team.to_string(),
						})
					}
					crate::config::DisplayColumn::CommonYearSpecific(_) => {
						TeamInfoEntry::Text(TeamInfoTextEntry {
							sort_text: "zzzzzzzz".to_string(),
							display_text: "ERROR".to_string(),
						})
					}
				})
				.collect(),
			pin_right_count: 5,
			pin_left_count: 4,
		})
		.collect()
}
