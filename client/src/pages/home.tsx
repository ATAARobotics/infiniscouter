import { Navbar } from "../components/navbar";

/**
 * Component for the home page.
 */
export function Home() {
	return (
		<div>
			<Navbar title={"Home"} />
			<h1>Welcome to Infiniscouter!</h1>
			<p>
				Link to <a href={"/api/docs"}>API Documentation</a>.
			</p>
		</div>
	);
}
