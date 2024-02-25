use std::collections::HashMap;

use futures_util::future;
use log::info;
use poem_openapi::{Enum, Object, Union};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
	api::data::{DriverEntryIdData, ImageData, MatchEntryData, MatchEntryIdData, MatchEntryValue},
	config::{
		match_entry::MatchEntryType, DisplayColumn, GameConfigs, PreMatchDisplay, SingleMetric,
		TeamConfig, TeamNameMetric,
	},
	database::Database,
	statbotics::{StatboticsCache, StatboticsTeam},
	tba::{EventInfo, MatchId, Tba},
};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoDisplay {
	pub info: Vec<TeamInfoEntry>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(tag = "type", rename_all = "snake_case")]
#[oai(discriminator_name = "type", rename_all = "snake_case")]
pub enum TeamInfoEntry {
	TeamName(TeamNameEntry),
	Text(TeamInfoTextEntry),
	Numeric(TeamInfoNumericEntry),
	PieChart(PieChartEntry),
	MultiText(MultiTextEntry),
	Images(ImagesEntry),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Enum, TS)]
#[ts(export, export_to = "../client/src/generated/")]
#[serde(rename_all = "camelCase")]
#[oai(rename_all = "camelCase")]
pub enum DataSource {
	Match,
	Pit,
	Driver,
	Statbotics,
	Tba,
	Unknown,
	System,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamNameEntry {
	pub number: u32,
	pub name: String,
	pub icon_uri: Option<String>,
	pub sort_value: f32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoTextEntry {
	pub sort_value: f32,
	pub display_text: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoNumericEntry {
	pub sort_value: f32,
	pub number: f32,
	pub min_max_avg: Option<MinMaxAvg>,
	pub is_time: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MinMaxAvg {
	min: f32,
	max: f32,
	avg: f32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct InfoEntryWithSource {
	name: NameAndSource,
	entry: TeamInfoEntry,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct SingleTeamInfo {
	team_number: u32,
	team_name: String,
	team_icon_uri: Option<String>,
	data: Vec<InfoEntryWithSource>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct NameAndSource {
	name: String,
	page: String,
	source: DataSource,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchAnalysisInfo {
	red_teams: Vec<MatchAnalysisTeamInfo>,
	blue_teams: Vec<MatchAnalysisTeamInfo>,
	other_data_names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchAnalysisTeamInfo {
	team_number: u32,
	team_name: String,
	team_icon_uri: Option<String>,
	expected_score: f32,
	expected_score_parts: Vec<MatchAnalysisScorePart>,
	other_data: Vec<TeamInfoEntry>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MatchAnalysisScorePart {
	name: String,
	score: f32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct TeamInfoList {
	heading: Vec<NameAndSource>,
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

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct MultiTextEntry {
	strings: Vec<String>,
	sentiment: f32,
	sort_value: f32,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
pub struct ImagesEntry {
	images: Vec<ImageData>,
	sort_value: f32,
}

const SB_PREFIX: &str = "statbotics-";

fn get_pie_chart(
	data_points: &[&MatchEntryValue],
	option_values: &[(&str, Option<f32>)],
) -> TeamInfoEntry {
	let mut actual_values = data_points
		.iter()
		.map(|dp| match dp {
			MatchEntryValue::Enum(ab) => ab.value.to_string(),
			MatchEntryValue::Ability(ab) => {
				format!("{:?}", ab.value)
			}
			MatchEntryValue::Bool(bl) => {
				if bl.value {
					"Yes".to_string()
				} else {
					"No".to_string()
				}
			}
			value => {
				panic!("Invalid MatchEntryValue type found: {:?}", value)
			}
		})
		.collect::<Vec<_>>();

	actual_values.sort();

	let options_map: HashMap<_, _> = actual_values
		.group_by(|a, b| a == b)
		.map(|group| (group[0].to_string(), group.len() as f32))
		.collect();
	let count = option_values
		.iter()
		.map(|(option, value)| match value {
			Some(_) => options_map.get(*option).copied().unwrap_or(0.0),
			None => 0.0,
		})
		.sum::<f32>();
	let sort_value = if count > 0.0 {
		option_values
			.iter()
			.map(|(option, value)| match value {
				Some(value) => value * options_map.get(*option).unwrap_or(&0.0),
				None => 0.0,
			})
			.sum::<f32>()
			/ count
	} else {
		-420.0
	};
	let options = option_values
		.iter()
		.filter_map(|(option, value)| {
			value.map(|_| PieChartOption {
				label: option.to_string(),
				value: options_map.get(*option).copied().unwrap_or(0.0),
			})
		})
		.collect::<Vec<_>>();
	TeamInfoEntry::PieChart(PieChartEntry {
		options,
		sort_value,
	})
}

fn single_team_impl(
	config: &GameConfigs,
	match_entries: &[MatchEntryIdData],
	driver_entries: &[DriverEntryIdData],
	pit_entry: Option<&MatchEntryData>,
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
			DisplayColumn::Single(metric) => get_single_metric(
				config,
				match_entries,
				driver_entries,
				pit_entry,
				statbotics,
				team,
				&metric.metric,
			),
			DisplayColumn::TeamName(_) => TeamInfoEntry::TeamName(TeamNameEntry {
				number: tba_data.team_infos[&team].num,
				name: tba_data.team_infos[&team].name.clone(),
				icon_uri: tba_data.team_infos[&team].get_icon_url(),
				sort_value: tba_data.team_infos[&team].num as f32,
			}),
			DisplayColumn::CommonYearSpecific(_) => TeamInfoEntry::Text(TeamInfoTextEntry {
				sort_value: 999999.0,
				display_text: "ERROR".to_string(),
			}),
		})
		.collect()
}

fn get_single_metric(
	config: &GameConfigs,
	match_entries: &[MatchEntryIdData],
	driver_entries: &[DriverEntryIdData],
	pit_entry: Option<&MatchEntryData>,
	statbotics: Option<&StatboticsTeam>,
	team: u32,
	metric: &str,
) -> TeamInfoEntry {
	if metric.starts_with(SB_PREFIX) {
		if let Some(sb) = statbotics {
			let real_metric = metric.strip_prefix(SB_PREFIX).unwrap();
			let total_matches = sb.wins as f32 + sb.losses as f32 + sb.ties as f32;
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
					sort_value: if total_matches == 0.0 {
						-420.0
					} else {
						(sb.wins as f32 + sb.ties as f32 * 0.5) / total_matches
					},
				}),
				"rps-ratio" => Some(PieChartEntry {
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
					"rps" => sb.rps as f32,
					"games" => (sb.wins + sb.losses + sb.ties) as f32,
					"rp-1" => sb.rp_1_epa_end,
					"rp-2" => sb.rp_2_epa_end,
					_ => panic!("That's not a statbotics thing bruh"),
				};
				TeamInfoEntry::Numeric(TeamInfoNumericEntry {
					sort_value: value,
					number: value,
					min_max_avg: None,
					is_time: false,
				})
			}
		} else {
			TeamInfoEntry::Text(TeamInfoTextEntry {
				sort_value: 9999999.0,
				display_text: "ERROR: No statbotics for team".to_string(),
			})
		}
	} else {
		let data_points: Vec<_> = match_entries
			.iter()
			.filter(|match_entry| match_entry.team_id.parse::<u32>().unwrap() == team)
			.filter_map(|match_entry| match_entry.data.entries.get(metric))
			.chain(
				pit_entry
					.and_then(|pe| pe.entries.get(metric))
					.iter()
					.copied(),
			)
			.chain(
				driver_entries
					.iter()
					.filter(|match_entry| match_entry.team_id.parse::<u32>().unwrap() == team)
					.filter_map(|match_entry| match_entry.data.entries.get(metric)),
			)
			.collect();
		match config
			.match_entry_fields
			.entries
			.get(metric)
			.as_ref()
			.map(|e| &e.entry)
			.or_else(|| {
				config
					.pit_entry_fields
					.entries
					.get(metric)
					.as_ref()
					.map(|e| &e.entry)
			})
			.or_else(|| {
				config
					.driver_entry_fields
					.entries
					.get(metric)
					.as_ref()
					.map(|e| &e.entry)
			}) {
			Some(MatchEntryType::Ability(_)) => get_pie_chart(
				&data_points,
				&[
					("Nothing", None),
					("Attempted", Some(0.0)),
					("Succeeded", Some(1.0)),
				],
			),
			Some(MatchEntryType::Enum(enum_metric)) => {
				let count = enum_metric.options.len() as f32;
				let thing = enum_metric
					.options
					.iter()
					.enumerate()
					.map(|(i, option)| (option.as_str(), Some((i as f32) / count)))
					.collect::<Vec<_>>();
				get_pie_chart(&data_points, &thing)
			}
			Some(MatchEntryType::Bool(_)) => {
				get_pie_chart(&data_points, &[("No", Some(0.0)), ("Yes", Some(1.0))])
			}
			Some(MatchEntryType::Timer(_)) => {
				if data_points.is_empty() {
					TeamInfoEntry::Text(TeamInfoTextEntry {
						sort_value: -420.0,
						display_text: "".to_string(),
					})
				} else {
					let value = data_points
						.iter()
						.map(|dp| {
							if let MatchEntryValue::Timer(tm) = dp {
								tm.time_seconds
							} else {
								panic!("Invalid data type of {dp:?} for timer match entry");
							}
						})
						.sum::<f32>() / data_points.len() as f32;
					TeamInfoEntry::Numeric(TeamInfoNumericEntry {
						sort_value: value,
						number: value,
						min_max_avg: None,
						is_time: true,
					})
				}
			}
			Some(MatchEntryType::Counter(_)) => {
				if data_points.is_empty() {
					TeamInfoEntry::Text(TeamInfoTextEntry {
						sort_value: -420.0,
						display_text: "".to_string(),
					})
				} else {
					let average = data_points
						.iter()
						.map(|dp| {
							if let MatchEntryValue::Counter(cm) = dp {
								cm.count as f32
							} else {
								panic!("Invalid data type of {dp:?} for counter match entry");
							}
						})
						.sum::<f32>() / data_points.len() as f32;
					TeamInfoEntry::Numeric(TeamInfoNumericEntry {
						sort_value: average,
						number: average,
						min_max_avg: None,
						is_time: false,
					})
				}
			}
			Some(MatchEntryType::TextEntry(_)) => {
				let strings = data_points
					.iter()
					.map(|dp| {
						if let MatchEntryValue::TextEntry(te) = dp {
							te.text.clone()
						} else {
							panic!("Invalid data type of {dp:?} for text entry match entry");
						}
					})
					.collect::<Vec<_>>();
				let analyzer = vader_sentiment::SentimentIntensityAnalyzer::new();
				let sentiment = strings
					.iter()
					.map(|s| {
						analyzer
							.polarity_scores(s)
							.get("compound")
							.copied()
							.unwrap_or_default() as f32
					})
					.sum();
				TeamInfoEntry::MultiText(MultiTextEntry {
					sentiment,
					sort_value: if strings.is_empty() {
						-420.0
					} else {
						sentiment
					},
					strings,
				})
			}
			Some(MatchEntryType::Image(_)) => {
				let images = data_points
					.iter()
					.flat_map(|dp| {
						if let MatchEntryValue::Image(im) = dp {
							im.images.clone()
						} else {
							panic!("Invalid data type of {dp:?} for image match entry");
						}
					})
					.collect::<Vec<_>>();
				TeamInfoEntry::Images(ImagesEntry {
					sort_value: -(images.len() as f32),
					images,
				})
			}
			_ => TeamInfoEntry::Text(TeamInfoTextEntry {
				sort_value: 999999.0,
				display_text: format!("TODO: {}", metric),
			}),
		}
	}
}

fn table_labels(config: &GameConfigs) -> Vec<NameAndSource> {
	config
		.game_config
		.display
		.team_row
		.iter()
		.map(|column| match column {
			DisplayColumn::Single(metric) => get_metric_name(config, &metric.metric),
			DisplayColumn::TeamName(_) => NameAndSource {
				name: "Team Name".to_string(),
				page: "N/A".to_string(),
				source: DataSource::System,
			},
			DisplayColumn::CommonYearSpecific(_) => NameAndSource {
				name: "INVALID".to_string(),
				page: "Unknown".to_string(),
				source: DataSource::Unknown,
			},
		})
		.collect()
}

fn get_metric_name(config: &GameConfigs, metric: &str) -> NameAndSource {
	if metric.starts_with(SB_PREFIX) {
		NameAndSource {
			name: match metric.trim_start_matches(SB_PREFIX) {
				"wlt-ratio" => "W/L/T".to_string(),
				"rps-ratio" => "Ranking Points".to_string(),
				"points" => "Total Points".to_string(),
				"auto-points" => "Auto Points".to_string(),
				"teleop-points" => "Teleop Points".to_string(),
				"endgame-points" => "Endgame Points".to_string(),
				"wins" => "Wins".to_string(),
				"losses" => "Losses".to_string(),
				"ties" => "Ties".to_string(),
				"rps" => "RPs".to_string(),
				"games" => "Games".to_string(),
				"rp-1" => config
					.game_config
					.ranking_points
					.first()
					.cloned()
					.unwrap_or("RP 1".to_string()),
				"rp-2" => config
					.game_config
					.ranking_points
					.get(1)
					.cloned()
					.unwrap_or("RP 2".to_string()),
				_ => "Unknown Statbotics".to_string(),
			},
			page: "Data".to_string(),
			source: DataSource::Statbotics,
		}
	} else if let Some(match_entry) = config.match_entry_fields.entries.get(metric).as_ref() {
		NameAndSource {
			name: match_entry.title.clone(),
			page: match_entry.page.clone(),
			source: DataSource::Match,
		}
	} else if let Some(pit_entry) = config.pit_entry_fields.entries.get(metric).as_ref() {
		NameAndSource {
			name: pit_entry.title.clone(),
			page: pit_entry.page.clone(),
			source: DataSource::Pit,
		}
	} else if let Some(driver_entry) = config.driver_entry_fields.entries.get(metric).as_ref() {
		NameAndSource {
			name: driver_entry.title.clone(),
			page: driver_entry.page.clone(),
			source: DataSource::Driver,
		}
	} else {
		NameAndSource {
			name: metric.to_string(),
			page: "Unknown".to_string(),
			source: DataSource::Unknown,
		}
	}
}

fn default_display(config: &GameConfigs) -> Vec<usize> {
	config
		.game_config
		.display
		.team_row
		.iter()
		.enumerate()
		.filter(|(_id, column)| match column {
			DisplayColumn::Single(SingleMetric { display, .. })
			| DisplayColumn::TeamName(TeamNameMetric { display, .. }) => *display,
			_ => false,
		})
		.map(|(id, _col)| id)
		.collect()
}

pub async fn get_single_team_analysis(
	tba: &Tba,
	statbotics: &StatboticsCache,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
	team: u32,
) -> SingleTeamInfo {
	info!("Loading team analysis for {team}");

	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let driver_entries =
		database.get_all_driver_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba
		.get_event(team_config.current_year, &team_config.current_event)
		.await
		.unwrap();
	let statbotics_team = statbotics.get(team).await;
	SingleTeamInfo {
		team_number: team,
		team_name: tba_data.team_infos[&team].name.clone(),
		team_icon_uri: tba_data.team_infos[&team].get_icon_url(),
		data: config
			.all_metrics
			.iter()
			.map(|metric| InfoEntryWithSource {
				name: get_metric_name(config, metric),
				entry: get_single_metric(
					config,
					&match_entries,
					&driver_entries,
					database
						.get_pit_entry_data(
							team_config.current_year,
							&team_config.current_event,
							&team.to_string(),
						)
						.unwrap()
						.as_ref(),
					statbotics_team.as_deref(),
					team,
					metric,
				),
			})
			.collect(),
	}
}

pub async fn get_analysis_list(
	tba: &Tba,
	statbotics: &StatboticsCache,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
) -> TeamInfoList {
	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let driver_entries =
		database.get_all_driver_entries(team_config.current_year, &team_config.current_event);
	let pit_entries =
		database.get_all_pit_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba
		.get_event(team_config.current_year, &team_config.current_event)
		.await
		.unwrap();
	let tba_teams = future::join_all(
		tba_data
			.team_infos
			.keys()
			.map(|team| async move { (team, statbotics.get(*team).await) }),
	)
	.await;
	let mut til = TeamInfoList {
		heading: table_labels(config),
		list: tba_teams
			.into_iter()
			.map(|(team, sb)| TeamInfoDisplay {
				info: single_team_impl(
					config,
					&match_entries,
					&driver_entries,
					pit_entries.get(&team.to_string()),
					&tba_data,
					sb.as_deref(),
					*team,
				),
			})
			.collect(),
		default_display: default_display(config),
	};
	for row in 0..til.heading.len() {
		let (mut min, mut max, mut avg, mut cnt) = (f32::MAX, f32::MIN, 0.0, 0.0);
		for team in &til.list {
			if let TeamInfoEntry::Numeric(TeamInfoNumericEntry { number, .. }) = &team.info[row] {
				min = min.min(*number);
				max = max.max(*number);
				avg += *number;
				cnt += 1.0;
			}
		}
		avg /= cnt;
		for team in &mut til.list {
			if let TeamInfoEntry::Numeric(entry) = &mut team.info[row] {
				entry.min_max_avg = Some(MinMaxAvg { min, max, avg });
			}
		}
	}
	til
}

pub async fn get_match_analysis(
	tba: &Tba,
	statbotics: &StatboticsCache,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
	match_id: MatchId,
) -> MatchAnalysisInfo {
	info!("Loading match preview for {match_id:?}");

	let match_entries =
		database.get_all_match_entries(team_config.current_year, &team_config.current_event);
	let driver_entries =
		database.get_all_driver_entries(team_config.current_year, &team_config.current_event);
	let tba_data = tba
		.get_event(team_config.current_year, &team_config.current_event)
		.await
		.unwrap();

	let other_data_names = config
		.game_config
		.display
		.pre_match
		.metrics
		.iter()
		.map(|metric_name| get_metric_name(config, metric_name).name.clone())
		.collect::<Vec<_>>();

	let match_info = if let Some(match_info) = tba_data
		.match_infos
		.iter()
		.find(|match_info| match_info.id == match_id)
		.cloned()
	{
		match_info
	} else {
		return MatchAnalysisInfo {
			red_teams: Vec::new(),
			blue_teams: Vec::new(),
			other_data_names,
		};
	};

	let statbotics_teams = future::join_all(
		match_info
			.teams_red
			.iter()
			.chain(match_info.teams_blue.iter())
			.map(|team| async move {
				statbotics
					.get(*team)
					.await
					.map(|stats| (*team, stats.as_ref().clone()))
			}),
	)
	.await
	.into_iter()
	.flatten()
	.collect::<HashMap<_, _>>();

	let red_teams = match_info
		.teams_red
		.iter()
		.map(|team| {
			get_single_team_match_preview(
				statbotics_teams.get(team),
				database,
				team_config,
				config,
				&match_entries,
				&driver_entries,
				&tba_data,
				&config.game_config.display.pre_match,
				team,
			)
		})
		.collect();

	let blue_teams = match_info
		.teams_blue
		.iter()
		.map(|team| {
			get_single_team_match_preview(
				statbotics_teams.get(team),
				database,
				team_config,
				config,
				&match_entries,
				&driver_entries,
				&tba_data,
				&config.game_config.display.pre_match,
				team,
			)
		})
		.collect();

	MatchAnalysisInfo {
		red_teams,
		blue_teams,
		other_data_names,
	}
}

#[allow(clippy::too_many_arguments)]
fn get_single_team_match_preview(
	statbotics: Option<&StatboticsTeam>,
	database: &Database,
	team_config: &TeamConfig,
	config: &GameConfigs,
	match_entries: &[MatchEntryIdData],
	driver_entries: &[DriverEntryIdData],
	tba_data: &EventInfo,
	pre_match_display: &PreMatchDisplay,
	team: &u32,
) -> MatchAnalysisTeamInfo {
	let (team_number, team_name, team_icon_uri) = tba_data
		.team_infos
		.get(team)
		.map(|team| (team.num, team.name.clone(), team.get_icon_url()))
		.unwrap_or((*team, "".to_string(), None));

	let pit_entry = database
		.get_pit_entry_data(
			team_config.current_year,
			&team_config.current_event,
			&team.to_string(),
		)
		.unwrap();

	let other_data = pre_match_display
		.metrics
		.iter()
		.map(|metric| {
			get_single_metric(
				config,
				match_entries,
				driver_entries,
				pit_entry.as_ref(),
				statbotics,
				*team,
				metric,
			)
		})
		.collect();

	let expected_score_parts = pre_match_display
		.graph
		.iter()
		.map(|graph_element| MatchAnalysisScorePart {
			name: graph_element.name.clone(),
			score: match get_single_metric(
				config,
				match_entries,
				driver_entries,
				pit_entry.as_ref(),
				statbotics,
				*team,
				&graph_element.metric,
			) {
				TeamInfoEntry::Numeric(numeric_entry) => numeric_entry.number,
				_ => 0.0,
			},
		})
		.collect::<Vec<_>>();

	MatchAnalysisTeamInfo {
		team_number,
		team_name,
		team_icon_uri,
		expected_score: match get_single_metric(
			config,
			match_entries,
			driver_entries,
			pit_entry.as_ref(),
			statbotics,
			*team,
			&pre_match_display.score,
		) {
			TeamInfoEntry::Numeric(numeric_entry) => numeric_entry.number,
			_ => 0.0,
		},
		expected_score_parts,
		other_data,
	}
}
