import Button from "@mui/joy/Button";

import { MatchEntryIdData } from "../generated/MatchEntryIdData";
import { useEffect, useState } from "preact/hooks";

/**
 *	A button that when clicked syncs important data from/to localStorage to/from the server
 *	@returns the component
 */
export function SyncButton() {
  const [loadingState, setLoadingState] = useState<"saved" | "saving">("saved");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/event/matches", { signal: controller.signal })
      .then((matchesResponse) => matchesResponse.text())
      .then((matchesStr) => {
        localStorage.setItem("matchList", matchesStr);
      });
    fetch("/api/match_entry/fields", { signal: controller.signal })
      .then((matchesResponse) => matchesResponse.text())
      .then((matchesStr) => {
        localStorage.setItem("matchFields", matchesStr);
      });
    fetch("/api/pit_entry/fields", { signal: controller.signal })
      .then((matchesResponse) => matchesResponse.text())
      .then((matchesStr) => {
        localStorage.setItem("pitFields", matchesStr);
      });

    return () => controller.abort();
  }, []);

  /**
   * Sync data by loading event and game info from the server, sending local data, and fetching remote data.
   */
  async function doSync() {
    setLoadingState("saving");
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
