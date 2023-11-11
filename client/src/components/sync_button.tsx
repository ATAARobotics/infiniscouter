import * as React from "react";
import Box from "@mui/joy/Box";
import Drawer from "@mui/joy/Drawer";
import Button from "@mui/joy/Button";
import List from "@mui/joy/List";
import Divider from "@mui/joy/Divider";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";

export function SyncButton() {
    const [loadingState, setLoadingState] = React.useState<"saved" | "saving">("saved");
    async function doSync(){
        setLoadingState("saving");
        const response = await fetch("/api/event/matches");
        localStorage.setItem("matchList", await response.text());
        setLoadingState("saved");
    }
    
  return (
    <Button loading={loadingState === "saving"} onClick={doSync}>Save Data</Button>
  );
}