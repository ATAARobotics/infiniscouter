import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";
import { Navbar } from "./components/navbar";
import { Home } from "./pages/home";
import { MatchEntry } from "./pages/match_entry";
import { PitEntry } from "./pages/pit_entry";
import { NotFound } from "./pages/not_found";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { Analysis } from "./pages/analysis";
import { TeamInfo } from "./pages/team_info";

/**
 *	Main app component.
 * @returns The component
 */
function App() {
  return (
    <CssVarsProvider defaultMode="dark">
      <CssBaseline />
      <LocationProvider>
        <Navbar />
        <main>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/match_entry" component={MatchEntry} />
            <Route path="/pit_entry" component={PitEntry} />
            <Route path="/analysis" component={Analysis} />
            <Route path="/team/:team" component={TeamInfo} />
            <Route default component={NotFound} />
          </Router>
        </main>
      </LocationProvider>
    </CssVarsProvider>
  );
}

render(<App />, document.getElementById("app")!);
