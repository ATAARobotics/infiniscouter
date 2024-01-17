import Button from "@mui/joy/Button";
import * as React from "react";

import { MatchEntryIdData } from "../generated/MatchEntryIdData";

/**
 *	A button that when clicked syncs important data from/to localStorage to/from the server
 *	@returns the component
 */
export function SyncButton() {
  const [loadingState, setLoadingState] = React.useState<"saved" | "saving">(
    "saved",
  );
  /**
   * Sync data by loading event and game info from the server, sending local data, and fetching remote data.
   */
  async function doSync() {
    setLoadingState("saving");
    const matchesStr = await fetch("/api/event/matches");
    localStorage.setItem("matchList", await matchesStr.text());
    const matchFieldsStr = await fetch("/api/match_entry/fields");
    localStorage.setItem("matchFields", await matchFieldsStr.text());
    const pitFieldsStr = await fetch("/api/pit_entry/fields");
    localStorage.setItem("pitFields", await pitFieldsStr.text());
    const matchArray = [];
    for (let entry = 0; entry < localStorage.length; entry++) {
      const key: string | null = localStorage.key(entry);
      if (key !== null && key.startsWith("match-")) {
        matchArray.push(
          JSON.parse(localStorage.getItem(key) ?? "") as MatchEntryIdData,
        );
      }
    }
    await fetch("/api/match_entry/data/all", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchArray),
    });
    setLoadingState("saved");
  }

  return (
    <Button loading={loadingState === "saving"} onClick={doSync}>
      Save Data
    </Button>
  );
}
