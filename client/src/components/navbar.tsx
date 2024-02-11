import {
	Box,
	Button,
	Divider,
	Drawer,
	List,
	ListItem,
	ListItemButton,
} from "@mui/joy";
import { useLocation } from "preact-iso";
import * as React from "react";

import { SyncButton } from "./sync_button";

interface NavbarItemProps {
	name: string;
	path: string;
}

/**
 * A single navbar item. Must be placed within a `List`.
 */
function NavbarItem(props: NavbarItemProps) {
	const { path } = useLocation();

	return (
		<ListItem key={props.name}>
			<ListItemButton>
				<a href={props.path}>
					{path === props.path ? <b>{props.name}</b> : props.name}
				</a>
			</ListItemButton>
		</ListItem>
	);
}

/**
 * Displays a colapsable nav bar.
 */
export function Navbar() {
	const [navbarOpen, setNavbarOpen] = React.useState(false);

	const toggleDrawer = (inOpen: boolean) => () => {
		setNavbarOpen(inOpen);
	};

	return (
		<Box sx={{ display: "flex" }}>
			<Button variant="soft" color="neutral" onClick={toggleDrawer(true)}>
				Menu
			</Button>
			<Drawer open={navbarOpen} onClose={toggleDrawer(false)}>
				<Box
					role="presentation"
					onClick={toggleDrawer(false)}
					onKeyDown={toggleDrawer(false)}
				>
					<List>
						<NavbarItem name="Home" path="/"></NavbarItem>
					</List>
					<Divider />
					<List>
						{[
							{
								path: "/match_entry",
								name: "Match Entry",
							},
							{
								path: "/pit_entry",
								name: "Pit Entry",
							},
							{
								path: "/driver_entry",
								name: "Driver Entry",
							},
							{
								path: "/analysis",
								name: "Analysis",
							},
							{
								path: "/match_list",
								name: "Match List",
							},
							{
								path: "/config",
								name: "Configuration",
							},
						].map((item) => (
							<NavbarItem {...item}></NavbarItem>
						))}
					</List>
					<Divider />
					<List>
						<NavbarItem
							name="Documentation"
							path="/api/docs"
						></NavbarItem>
					</List>
				</Box>
			</Drawer>
			<SyncButton></SyncButton>
		</Box>
	);
}
