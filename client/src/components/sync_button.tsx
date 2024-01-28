import { Button } from "@mui/joy";
import { useSetAtom } from "jotai/react";
import { useEffect, useState } from "preact/hooks";

import { matchFieldsAtom, matchListAtom, pitFieldsAtom } from "../data/atoms";
import { MatchEntryIdData } from "../generated/MatchEntryIdData";

/**
 *	A button that when clicked syncs important data from/to localStorage to/from the server
 *	@returns the component
 */
export function SyncButton() {
  const [loadingState, setLoadingState] = useState<"saved" | "saving">("saved");
  const setMatchList = useSetAtom(matchListAtom);
  const setMatchFields = useSetAtom(matchFieldsAtom);
  const setPitFields = useSetAtom(pitFieldsAtom);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/event/matches", { signal: controller.signal })
      .then((matchesResponse) => matchesResponse.json())
      .then((matchList) => {
        setMatchList(matchList);
      });
    fetch("/api/match_entry/fields", { signal: controller.signal })
      .then((matchesResponse) => matchesResponse.json())
      .then((matchFields) => {
        setMatchFields(matchFields);
      });
    fetch("/api/pit_entry/fields", { signal: controller.signal })
      .then((matchesResponse) => matchesResponse.json())
      .then((pitFields) => {
        setPitFields(pitFields);
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
