import { Box, Input } from "@mui/joy";
import { useAtom } from "jotai/react";

import { Navbar } from "../components/navbar";
import { scoutNameAtom } from "../data/atoms";

/**
 * Scouting configuration page
 */
export function Configuration() {
	const [scoutName, setScoutName] = useAtom(scoutNameAtom);
	return (
		<Box>
			<Navbar title={"Scouting Configuration"} />
			<Box>
				{
					// @ts-expect-error Input seems to want a component for some reason?
					<Input
						value={scoutName}
						placeholder={"Enter Your Name"}
						onChange={(ev: InputEvent) => {
							setScoutName((ev.target as HTMLInputElement).value);
						}}
					/>
				}
			</Box>
		</Box>
	);
}
