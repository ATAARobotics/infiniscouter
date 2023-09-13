import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

function NotFound() {
	return (<p>:(</p>);
}

function Home() {
	return (<p>Home</p>);
}

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

render(<App />, document.getElementById('app'));

