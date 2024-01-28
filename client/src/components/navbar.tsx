import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from "@mui/joy";
import * as React from "react";

import { SyncButton } from "./sync_button";

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
            {[<a href={"/"}>Home</a>].map((text) => (
              <ListItem key={text}>
                <ListItemButton>{text}</ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[
              <a href={"/match_entry"}>Match Entry</a>,
              <a href={"/pit_entry"}>Pit Entry</a>,
              <a href={"/analysis"}>Analysis</a>,
              <a href={"/match_list"}>Match List</a>,
            ].map((text) => (
              <ListItem key={text}>
                <ListItemButton>{text}</ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[<a href={"/api/docs"}>Documentation</a>].map((text) => (
              <ListItem key={text}>
                <ListItemButton>{text}</ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <SyncButton></SyncButton>
    </Box>
  );
}
