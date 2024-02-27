import { CircularProgress } from "@mui/joy";

import { Navbar } from "./navbar";

interface LoadIndicatorProps {
	title: string;
}

/**
 * A simple indicator to use when loading data for consistency.
 */
export function LoadIndicator(props: LoadIndicatorProps) {
	return (
		<>
			<Navbar title={props.title} />
			<div style={{ padding: "10px" }}>
				<CircularProgress
					color="neutral"
					determinate={false}
					size="lg"
					variant="solid"
					thickness={18}
				/>
			</div>
		</>
	);
}
