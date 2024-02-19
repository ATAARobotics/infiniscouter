import { MatchId } from "../generated/MatchId";

export interface TbaLinkProps {
	event: string;
	matchId: MatchId;
}

/**
 *
 */
export function TbaLink(props: TbaLinkProps) {
	const matchPart =
		props.matchId.match_type === "practice"
			? `pm${props.matchId.num}`
			: props.matchId.match_type === "qualification"
			? `qm${props.matchId.num}`
			: props.matchId.match_type === "quarterfinal"
			? `qf${props.matchId.num}m${props.matchId.set}`
			: props.matchId.match_type === "semifinal"
			? `sf${props.matchId.num}m${props.matchId.set}`
			: props.matchId.match_type === "final"
			? `f${props.matchId.num}m${props.matchId.set}`
			: "";
	const linkUrl = `https://www.thebluealliance.com/match/${props.event}_${matchPart}`;

	return (
		<a
			href={linkUrl}
			title="The Blue Alliance"
			style={{ position: "relative", bottom: "-4px" }}
		>
			<svg
				width="18px"
				height="18px"
				viewBox="0 0 62.088886 62.08889"
				version="1.1"
				id="svg1"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs id="defs1" />
				<g id="layer1" transform="translate(-74.083333,-117.475)">
					<path
						fill-rule="nonzero"
						fill="#3f51b5"
						fill-opacity="1"
						d="m 136.17222,148.51945 c 0,17.14555 -13.89889,31.04444 -31.04444,31.04444 -17.145554,0 -31.044447,-13.89889 -31.044447,-31.04444 0,-17.14555 13.898893,-31.04445 31.044447,-31.04445 17.14555,0 31.04444,13.8989 31.04444,31.04445"
						id="path48"
						style="stroke-width:0.352778"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="m 96.308333,135.81945 v 22.57778"
						id="path59"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="m 113.94722,135.81945 v 22.57778"
						id="path60"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="m 96.308333,158.39722 c 0,4.87412 3.945327,8.81944 8.819447,8.81944"
						id="path61"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="m 113.94722,158.39722 c 0,4.87412 -3.94532,8.81944 -8.81944,8.81944"
						id="path62"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="m 105.12778,135.81945 v 31.39722"
						id="path63"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="M 96.308333,157.33889 H 113.94722"
						id="path64"
					/>
					<path
						fill="none"
						stroke-width="2.11667"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						stroke="#ffffff"
						stroke-opacity="1"
						stroke-miterlimit="10"
						d="M 96.308333,147.46111 H 113.94722"
						id="path65"
					/>
					<path
						fill-rule="nonzero"
						fill="#ffffff"
						fill-opacity="1"
						d="m 117.82778,137.23056 c 0,0.77583 -0.63528,1.41111 -1.41111,1.41111 H 93.838888 c -0.775835,0 -1.411111,-0.63528 -1.411111,-1.41111 V 130.175 c 0,-0.77583 0.635276,-1.41111 1.411111,-1.41111 h 22.577782 c 0.77583,0 1.41111,0.63528 1.41111,1.41111 z m 0,0"
						id="path66"
						style="stroke-width:0.352778"
					/>
				</g>
			</svg>
		</a>
	);
}
