import { Button, ToggleButtonGroup } from "@mui/joy";
import { useState, useEffect } from "preact/hooks";

import { MatchEntryPage } from "../generated/MatchEntryPage";
import { MatchEntry } from "../generated/MatchEntry";
import { AbilityMetric } from "../generated/AbilityMetric";
import { BoolMetric } from "../generated/BoolMetric";
import { TimerMetric } from "../generated/TimerMetric";
import { MatchEntryValue } from "../generated/MatchEntryValue";

interface MatchPageProps {
  page: MatchEntryPage;
  entries: Record<string, MatchEntry>;
  allEntries: Record<string, MatchEntryValue>;
  setEntry: (id: string, value: MatchEntryValue | undefined) => void;
}

/**
 * Data entry for anything that is a "match page" (also used for pit scouting)
 */
export function MatchPage(props: MatchPageProps) {
  return (
    <>
      <h2>{props.page.title}</h2>
      {props.page.layout.map((entryName) => (
        <MatchDetail
          entry={props.entries[entryName]}
          setValue={(value) => {
            console.log(`Setting ${entryName} to ${value}`);
            props.setEntry(entryName, value);
          }}
          value={props.allEntries[entryName]}
        ></MatchDetail>
      ))}
    </>
  );
}

interface MatchDetailProps {
  entry: MatchEntry;
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
}

/**
 * A single data entry field, e.g. an enum timer, etc
 */
function MatchDetail(props: MatchDetailProps) {
  return (
    <>
      <h3>{props.entry.title}</h3>
      {props.entry.entry.type === "ability" ? (
        <AbilityEntry
          entry={props.entry.entry}
          value={props.value}
          setValue={props.setValue}
        ></AbilityEntry>
      ) : props.entry.entry.type === "enum" ? (
        <EnumEntry
          options={props.entry.entry.options.map((item) => ({
            id: item,
            display: item,
          }))}
          value={props.value}
          setValue={props.setValue}
          entryType="enum"
        ></EnumEntry>
      ) : props.entry.entry.type === "bool" ? (
        <BoolEntry
          entry={props.entry.entry}
          value={props.value}
          setValue={props.setValue}
        ></BoolEntry>
      ) : props.entry.entry.type === "timer" ? (
        <TimerEntry
          entry={props.entry.entry}
          value={props.value}
          setValue={props.setValue}
        ></TimerEntry>
      ) : (
        <p> Error </p>
      )}
    </>
  );
}

interface EnumEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  options: Array<{ id: string | boolean; display: string }>;
  entryType: "ability" | "bool" | "enum";
}

function EnumEntry(props: EnumEntryProps) {
  return (
    <ToggleButtonGroup
      value={
        props.value && props.value.type !== "timer"
          ? props.value.value.toString()
          : ""
      }
      onChange={(_, newValue) => {
        if (!newValue) {
          props.setValue(undefined);
        } else {
          props.setValue({
            value: newValue,
            type: props.entryType,
          } as MatchEntryValue);
        }
      }}
    >
      {props.options.map((options) => (
        <Button value={options.id}>
          <p className="button-text">{options.display}</p>
        </Button>
      ))}
    </ToggleButtonGroup>
  );
}

interface AbilityEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  entry: AbilityMetric;
}

function AbilityEntry(props: AbilityEntryProps) {
  return (
    <EnumEntry
      options={[
        { id: "nothing", display: "Nothing" },
        { id: "attempted", display: "Attempted" },
        { id: "succeeded", display: "Succeeded" },
      ]}
      value={props.value}
      setValue={props.setValue}
      entryType="ability"
    ></EnumEntry>
  );
}

interface BoolEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  entry: BoolMetric;
}

function BoolEntry(props: BoolEntryProps) {
  return (
    <EnumEntry
      options={[
        { id: false, display: "No" },
        { id: true, display: "Yes" },
      ]}
      value={props.value}
      setValue={props.setValue}
      entryType="bool"
    ></EnumEntry>
  );
}

interface TimerEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  entry: TimerMetric;
}

interface NullTimer {
  type: "null";
}
interface RunningTimer {
  type: "running";
  startTime: number;
}
interface ValueTimer {
  type: "value";
  totalTime: number;
}

type TimerState = NullTimer | RunningTimer | ValueTimer;

function TimerEntry(props: TimerEntryProps) {
  const [state, setState] = useState<TimerState>({ type: "null" });
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const value = props.value;
  useEffect(() => {
    if (!value || value.type !== "timer") {
      setState({ type: "null" });
    } else {
      setState({ type: "value", totalTime: value.time_seconds * 1000 });
    }
  }, [value]);

  useEffect(() => {
    if (state.type === "running") {
      const id = setTimeout(() => setCurrentTime(Date.now()), 100);

      return () => clearTimeout(id);
    }
  }, [currentTime, setCurrentTime, state]);

  return state.type === "null" ? (
    <Button
      onClick={() => {
        setState({
          type: "running",
          startTime: Date.now(),
        });
        setCurrentTime(Date.now());
      }}
    >
      Start
    </Button>
  ) : state.type === "running" ? (
    <>
      <p>Running! {(currentTime - state.startTime) / 1000} seconds elapsed.</p>
      <Button
        onClick={() => {
          const time = Date.now() - state.startTime;
          setState({ type: "value", totalTime: time });
          props.setValue({ type: "timer", time_seconds: time / 1000 });
        }}
      >
        Stop
      </Button>
    </>
  ) : (
    <>
      <p>Stopped. {state.totalTime / 1000} seconds elapsed.</p>
      <Button
        onClick={() => {
          setState({
            type: "running",
            startTime: Date.now() - state.totalTime,
          });
          setCurrentTime(Date.now());
        }}
      >
        Continue timer?
      </Button>
      <Button
        onClick={() => {
          setState({ type: "null" });
          props.setValue(undefined);
        }}
      >
        Reset timer?
      </Button>
    </>
  );
}
