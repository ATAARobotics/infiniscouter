import { Box, Checkbox, Input, Typography } from "@mui/joy";
import { useAtom } from "jotai/react";

import { Navbar } from "../components/navbar";
import { scoutNameAtom, textModeAtom } from "../data/atoms";

/**
 * Scouting configuration page
 */
export function Configuration() {
	const [scoutName, setScoutName] = useAtom(scoutNameAtom);
	const [textMode, setTextMode] = useAtom(textModeAtom);

	return (
		<Box>
			<Navbar title={"Scouting Configuration"} />
			<Box>
				<Typography level="h3">Your Name</Typography>
				{
					// @ts-expect-error Input seems to want a component for some reason?
					<Input
						value={scoutName}
						placeholder={"Enter Your Name"}
						size="lg"
						onChange={(ev: InputEvent) => {
							setScoutName((ev.target as HTMLInputElement).value);
						}}
					/>
				}
				<Typography level="h3">Display Options</Typography>
				{
					<Checkbox
						checked={textMode}
						label="Text Only"
						size="lg"
						variant="solid"
						onChange={(ev) => {
							setTextMode(!!(ev.target as HTMLInputElement).checked);
						}}
					/>
				}
			</Box>
		</Box>
	);
}
