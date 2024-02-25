import { Navbar } from "../components/navbar";

/**
 *	Component for the "404 not found" page.
 * @returns The component
 */
export function NotFound() {
	return (
		<>
			<Navbar title="Page Not Found" />
			<h1>Match List</h1>
			<h1>404 :(</h1>
			<p>
				Not found. You can go <a href={"/"}>home</a>, if you'd like.
			</p>
		</>
	);
}
