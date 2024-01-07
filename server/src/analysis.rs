use std::collections::{HashSet, HashMap};

use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
	api::data::{MatchEntryIdData, MatchEntryValue},
	config::{match_entry::MatchEntryType, GameConfigs, TeamConfig},
	database::Database,
	tba::{EventInfo, Tba},
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
#[serde(tag = "type", rename_all = "snake_case")]
#[oai(discriminator_name = "type", rename_all = "snake_case")]
pub enum TeamInfoEntry {
	Text(TeamInfoTextEntry),
	PieChart(PieChartEntry),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoTextEntry {
	pub sort_text: String,
	pub display_text: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct SingleTeamInfo {
    team_number: u32,
    team_name: String,
    team_icon_uri: Option<String>,
    data: HashMap<String, TeamInfoEntry>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoList {
	names: Vec<String>,
	list: Vec<TeamInfoDisplay>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PieChartEntry {
	options: Vec<PieChartOption>,
	sort_value: f32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct PieChartOption {
	label: String,
	value: f32,
}

fn get_pie_chart(data_points: &[&MatchEntryValue]) -> TeamInfoEntry {
	let mut values = data_points
		.iter()
		.map(|dp| match dp {
			MatchEntryValue::Enum(ab) => ab.value.to_string(),
			MatchEntryValue::Ability(ab) => {
				format!("{:?}", ab.value)
			}
			MatchEntryValue::Bool(bl) => {
				format!("{:?}", bl.value)
			}
			_ => {
				panic!("AHHHhhhhhhhhhh")
			}
		})
		.collect::<Vec<_>>();

	values.sort();

	let options = values
		.group_by(|a, b| a == b)
		.map(|group| PieChartOption {
			label: group[0].to_string(),
			value: group.len() as f32,
		})
		.collect::<Vec<_>>();
	TeamInfoEntry::PieChart(PieChartEntry {
		options,
		sort_value: 0.0,
	})
}

fn single_team_impl(
	config: &GameConfigs,
	match_entries: &[MatchEntryIdData],
	tba_data: &EventInfo,
	team: u32,
) -> Vec<TeamInfoEntry> {
	config
		.game_config
		.display
		.team_row
		.iter()
		.map(|column| match column {
			crate::config::DisplayColumn::Single(metric) => {
				let data_points: Vec<_> = match_entries
					.iter()
					.filter(|match_entry| match_entry.team_id.parse::<u32>().unwrap() == team)
					.filter_map(|match_entry| match_entry.data.entries.get(&metric.metric))
					.collect();
				match config
					.match_entry_fields
					.entries
					.get(&metric.metric)
					.as_ref()
					.map(|e| &e.entry)
				{
					Some(MatchEntryType::Ability(_)) => get_pie_chart(&data_points),
					Some(MatchEntryType::Enum(_)) => get_pie_chart(&data_points),
					Some(MatchEntryType::Bool(_)) => get_pie_chart(&data_points),
					Some(MatchEntryType::Timer(_)) => {
						let value = data_points
							.iter()
							.map(|dp| {
								if let MatchEntryValue::Timer(tm) = dp {
									tm.time_seconds
								} else {
									panic!("Timeer noooooo waaaaa")
								}
							})
							.sum::<f32>() / data_points.len() as f32;
						TeamInfoEntry::Text(TeamInfoTextEntry {
							sort_text: value.to_string(),
							display_text: format!("{value:.1}s"),
						})
					}
					_ => TeamInfoEntry::Text(TeamInfoTextEntry {
						sort_text: "TODO".to_string(),
						display_text: metric.metric.clone(),
					}),
				}
			}
			crate::config::DisplayColumn::TeamName(_) => TeamInfoEntry::Text(TeamInfoTextEntry {
				sort_text: team.to_string(),
				display_text: format!(
					"{} ({})",
					tba_data.team_infos[&team].name, tba_data.team_infos[&team].num
				),
			}),
			crate::config::DisplayColumn::CommonYearSpecific(_) => {
				TeamInfoEntry::Text(TeamInfoTextEntry {
					sort_text: "zzzzzzzz".to_string(),
					display_text: "ERROR".to_string(),
				})
			}
		})
		.collect()
}

fn table_labels(config: &GameConfigs) -> Vec<String> {
    config
			.game_config
			.display
			.team_row
			.iter()
			.map(|column| match column {
				crate::config::DisplayColumn::Single(metric) => metric.metric.clone(),
				crate::config::DisplayColumn::TeamName(_) => "Team Name".to_string(),
				crate::config::DisplayColumn::CommonYearSpecific(_) => "INVALID".to_string(),
			})
			.collect()
}

pub async fn single_team(
	tba: &Tba,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
	team: u32,
) -> SingleTeamInfo {
	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba.get_event(&team_config.current_event).await.unwrap();
    SingleTeamInfo {
        team_number: team,
        team_name: tba_data.team_infos[&team].name.clone(),
        team_icon_uri: tba_data.team_infos[&team].icon_uri.clone(),
        data: table_labels(config).into_iter().zip(single_team_impl(config, &match_entries, &tba_data, team).into_iter()).collect(),
    }
}

pub async fn list(
	tba: &Tba,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
) -> TeamInfoList {
	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba.get_event(&team_config.current_event).await.unwrap();
	let tba_teams = tba_data.team_infos.keys().collect::<HashSet<_>>();
	TeamInfoList {
		names: table_labels(config),
		list: tba_teams
			.into_iter()
			.map(|team| TeamInfoDisplay {
				info: single_team_impl(config, &match_entries, &tba_data, *team),
				pin_right_count: 5,
				pin_left_count: 4,
			})
			.collect(),
	}
}
