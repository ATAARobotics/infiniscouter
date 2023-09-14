import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";
import {Navbar} from "./components/navbar";
import {Home} from "./pages/home";
import {NotFound} from "./pages/not_found";

/**
 *	Main app component.
 * @returns The component
 */
function App() {
	return (
		<LocationProvider>
			<Navbar />
			<main>
				<Router>
					<Route path="/" component={Home} />
					<Route default component={NotFound} />
				</Router>
			</main>
		</LocationProvider>
	);
}

render(<App />, document.getElementById("app")!);
