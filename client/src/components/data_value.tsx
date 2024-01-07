import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { TeamInfoEntry } from "src/generated/TeamInfoEntry";

interface DataValueProps {
	value: TeamInfoEntry,
}

const colorSchemes = [
	["#e74c3c", "#f1c40f", "#3498db", "#e67e22", "#2ecc71", "#9b59b6"],
	["#5bcffa", "#ff8eb2", "#ffffff"],
	["#fff433", "#9b59d0", "#2d2d2d", "#ffffff"],
	["#ff218c", "#ffd800", "#0094ff"],
	["#d60270", "#9b4f97", "#0038a7"],
	["#000000", "#b9b9b9", "#b8f483", "#ffffff"],
	["#e28d00", "#eccd00", "#65ace2", "#223756", "#ffffff"],
	["#3da542", "#a7d379", "#a9a9a9", "#ffffff", "#000000"],
	["#800080", "#808080", "#ffffff", "#000000"],
	["#d62900", "#a50062", "#ff9b55", "#d462a6", "#ffffff"],
	["#089276", "#451d7e", "#2ad1ad", "#584fcf", "#9de9c3", "#81b0e4", "#f3f1ff"],
	["#b77fdd", "#4b821e", "#ffffff"],
	["#ff02bc", "#00d959", "#0092fd"],
	["#3437c1", "#cf00de", "#ff69a0", "#ffffff", "#000000"],
];

export function DataValue(props: DataValueProps) {
	useEffect(() => {
		ChartJS.register(ArcElement, Tooltip, Legend);
	}, []);
	switch (props.value.type) {
		case "text":
			return <td><p>{props.value.display_text}</p></td>;
		case "pie_chart": {
			return <td><Doughnut data={{
				labels: ["Red", "Orange", "Yellow", "Green", "Blue"],
				datasets: [
					{
						label: "Dataset 1",
						data: [1, 2, 3, 4, 5],
						backgroundColor: colorSchemes[Math.floor(Math.random() * colorSchemes.length)],
					},
				],
			}} /></td>;
		}
	}
}
