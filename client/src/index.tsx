import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

/**
 *	Component for the "404 not found" page.
 * @returns The component
 */
function NotFound() {
	return (<p>:(</p>);
}

/**
 *	Component for the home page.
 * @returns The component
 */
function Home() {
	return (<p>Home</p>);
}

/**
 *	Main app component.
 * @returns The component
 */
function App() {
	return (
		<LocationProvider>
			<h1>Hello</h1>
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
