#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
struct TeamInfoDisplay {
	info: Vec<TeamInfoEntry>,
	pin_right_count: usize,
	pin_left_count: usize,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Union, TS)]
#[ts(export, export_to = "../client/src/generated/")]
enum TeamInfoEntry {
	Text(TeamInfoTextEntry),
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, Object, TS)]
#[ts(export, export_to = "../client/src/generated/")]
struct TeamInfoTextEntry {
    sort_text: String,
    display_text: String,
}
