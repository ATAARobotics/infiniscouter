import CssBaseline from "@mui/joy/CssBaseline";
import { CssVarsProvider } from "@mui/joy/styles";
import { render } from "preact";
import { LocationProvider, Route, Router } from "preact-iso";

import { Analysis } from "./pages/analysis";
import { Configuration } from "./pages/configuration";
import { DriverEntry } from "./pages/driver_entry";
import { FullImage } from "./pages/full_image";
import { Home } from "./pages/home";
import { Leaderboard } from "./pages/leaderboard";
import { MatchEntry } from "./pages/match_entry";
import { MatchInfo } from "./pages/match_info";
import { MatchList } from "./pages/match_list";
import { NotFound } from "./pages/not_found";
import { PitEntry } from "./pages/pit_entry";
import { Reload } from "./pages/reload";
import { TeamInfo } from "./pages/team_info";
import { TeamList } from "./pages/team_list";

/**
 * Main app component.
 */
function App() {
	return (
		<CssVarsProvider defaultMode="dark">
			<CssBaseline />
			<LocationProvider>
				<main>
					<Router>
						<Route path="/" component={Home} />
						<Route path="/api/docs" component={Reload} />
						<Route path="/config" component={Configuration} />
						<Route path="/driver_entry" component={DriverEntry} />
						<Route path="/image/full/:id" component={FullImage} />
						<Route path="/match_entry" component={MatchEntry} />
						<Route path="/match_list" component={MatchList} />
						<Route path="/match/:type/:num/:set" component={MatchInfo} />
						<Route path="/pit_entry" component={PitEntry} />
						<Route path="/pit_entry/:team" component={PitEntry} />
						<Route path="/analysis" component={Analysis} />
						<Route path="/team_list" component={TeamList} />
						<Route path="/team/:team" component={TeamInfo} />
						<Route path="/leaderboard" component={Leaderboard} />
						<Route default component={NotFound} />
					</Router>
				</main>
			</LocationProvider>
		</CssVarsProvider>
	);
}

render(<App />, document.getElementById("app")!);
