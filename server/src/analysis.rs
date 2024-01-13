use std::collections::HashMap;

use futures_util::future;
use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
	api::data::{MatchEntryIdData, MatchEntryValue},
	config::{match_entry::MatchEntryType, GameConfigs, TeamConfig, SingleMetric, TeamNameMetric},
	database::Database,
	statbotics::{StatboticsCache, StatboticsTeam},
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
	TeamName(TeamNameEntry),
	Text(TeamInfoTextEntry),
	PieChart(PieChartEntry),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamNameEntry {
	pub number: u32,
	pub name: String,
	pub icon_uri: Option<String>,
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
    default_display: Vec<usize>,
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
	statbotics: Option<&StatboticsTeam>,
	team: u32,
) -> Vec<TeamInfoEntry> {
	config
		.game_config
		.display
		.team_row
		.iter()
		.map(|column| match column {
			crate::config::DisplayColumn::Single(metric) => {
				const SB_PREFIX: &str = "statbotics-";
				if metric.metric.starts_with(SB_PREFIX) {
					if let Some(sb) = statbotics {
						let real_metric = metric.metric.strip_prefix(SB_PREFIX).unwrap();
						if let Some(pie_values) = match real_metric {
							"wlt-ratio" => Some(PieChartEntry {
								options: vec![
									PieChartOption {
										label: "Wins".to_string(),
										value: sb.wins as f32,
									},
									PieChartOption {
										label: "Losses".to_string(),
										value: sb.losses as f32,
									},
									PieChartOption {
										label: "Ties".to_string(),
										value: sb.ties as f32,
									},
								],
								sort_value: sb.wins as f32 - sb.losses as f32,
							}),
							"rps" => Some(PieChartEntry {
								options: vec![
									PieChartOption {
										label: "None".to_string(),
										value: (1.0 - (sb.rp_1_epa_end + sb.rp_2_epa_end)).max(0.0),
									},
									PieChartOption {
										label: "RP 1".to_string(),
										value: sb.rp_1_epa_end,
									},
									PieChartOption {
										label: "RP 2".to_string(),
										value: sb.rp_2_epa_end,
									},
								],
								sort_value: sb.rp_1_epa_end + sb.rp_2_epa_end,
							}),
							_ => None,
						} {
							TeamInfoEntry::PieChart(pie_values)
						} else {
							let value = match real_metric {
								"points" => sb.epa_end,
								"auto-points" => sb.auto_epa_end,
								"teleop-points" => sb.teleop_epa_end,
								"endgame-points" => sb.endgame_epa_end,
								"wins" => sb.wins as f32,
								"losses" => sb.losses as f32,
								"ties" => sb.ties as f32,
								"games" => (sb.wins + sb.losses + sb.ties) as f32,
								"rp-1" => sb.rp_1_epa_end,
								"rp-2" => sb.rp_2_epa_end,
								_ => panic!("That's not a statbotics thing bruh"),
							};
                            TeamInfoEntry::Text(TeamInfoTextEntry { sort_text: format!("{value:09.4}"), display_text: format!("{value:.2}") })
						}
					} else {
						TeamInfoEntry::Text(TeamInfoTextEntry {
							sort_text: "zzzzzz".to_string(),
							display_text: format!("ERROR: No statbotics for team"),
						})
					}
				} else {
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
							sort_text: "zzzzzz".to_string(),
							display_text: format!("TODO: {}", metric.metric),
						}),
					}
				}
			}
			crate::config::DisplayColumn::TeamName(_) => TeamInfoEntry::TeamName(TeamNameEntry {
				number: tba_data.team_infos[&team].num,
				name: tba_data.team_infos[&team].name.clone(),
				icon_uri: tba_data.team_infos[&team].icon_uri.clone(),
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
			crate::config::DisplayColumn::Single(metric) => {
                if metric.metric.starts_with("statbotics-") {
                    match metric.metric.trim_start_matches("statbotics-") {
                        "wlt-ratio" => "W/L/T",
                        "rps" => "Ranking Points",
                        "points" => "Total Points",
                        "auto-points" => "Auto Points",
                        "teleop-points" => "Teleop Points",
                        "endgame-points" => "Endgame Points",
                        "wins" => "Wins",
                        "losses" => "Losses",
                        "ties" => "Ties",
                        "games" => "Games",
                        "rp1" => "RP 1",
                        "rp2" => "RP 2",
                        _ => "Unknown Statbotics",
                    }.to_string()
                } else if let Some(title) = config.match_entry_fields.entries.get(&metric.metric).as_ref().map(|m| &m.title) {
                    title.clone()
                } else {
                    metric.metric.clone()
                }
            },
			crate::config::DisplayColumn::TeamName(_) => "Team Name".to_string(),
			crate::config::DisplayColumn::CommonYearSpecific(_) => "INVALID".to_string(),
		})
		.collect()
}

fn default_display(config: &GameConfigs) -> Vec<usize> {
	config
		.game_config
		.display
		.team_row
		.iter()
        .enumerate()
		.filter(|(_id, column)| match column {
			crate::config::DisplayColumn::Single(SingleMetric { display, .. }) |
			crate::config::DisplayColumn::TeamName(TeamNameMetric { display, .. }) => *display,
			_ => false,
		})
        .map(|(id, _col)| id)
		.collect()
}

pub async fn single_team(
	tba: &Tba,
	statbotics: &StatboticsCache,
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
		data: table_labels(config)
			.into_iter()
			.zip(
				single_team_impl(
					config,
					&match_entries,
					&tba_data,
					statbotics.get(team).await.as_deref(),
					team,
				)
				.into_iter(),
			)
			.collect(),
	}
}

pub async fn list(
	tba: &Tba,
	statbotics: &StatboticsCache,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
) -> TeamInfoList {
	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba.get_event(&team_config.current_event).await.unwrap();
	let tba_teams = future::join_all(
		tba_data
			.team_infos
			.keys()
			.map(|team| async move { (team, statbotics.get(*team).await) }),
	)
	.await;
	TeamInfoList {
		names: table_labels(config),
		list: tba_teams
			.into_iter()
			.map(|(team, sb)| TeamInfoDisplay {
				info: single_team_impl(config, &match_entries, &tba_data, sb.as_deref(), *team),
				pin_right_count: 5,
				pin_left_count: 4,
			})
			.collect(),
        default_display: default_display(config),
	}
}
