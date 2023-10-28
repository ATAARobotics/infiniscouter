import * as React from "react";
import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import Button from "@mui/joy/Button";
import List from "@mui/joy/List";
import Divider from "@mui/joy/Divider";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";

export function Navbar() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (inOpen: boolean) => () => {
    setOpen(inOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Button variant="soft" color="neutral" onClick={toggleDrawer(true)}>
        Menu
      </Button>
      <Drawer open={open} onClose={toggleDrawer(false)}>
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            {[
              <a href={"/"}>Home</a>,
              <a href={"/match_entry"}>Match Entry</a>,
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
    </Box>
  );
}
/*
export function Navbar() {
  return (
    <nav className="header">
      <span>
        <div className="navbar">
          <a href={"/"}>Home</a> /{" "}
          <a href={"/match_entry"}>Match Entry</a> /{" "}
          <a href={"/api/docs"}>Documentation</a>
        </div>
      </span>
    </nav>
  );
}

*/
