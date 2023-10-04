import { useState, useEffect } from "preact/hooks";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { MatchEntryPage } from "../generated/MatchEntryPage";
import { MatchEntry } from "../generated/MatchEntry";
import { AbilityMetric } from "../generated/AbilityMetric";
import { EnumMetric } from "../generated/EnumMetric";
import { BoolMetric } from "../generated/BoolMetric";
import { TimerMetric } from "../generated/TimerMetric";

// Match Entry Page Component
export function MatchEntry() {
  const [fields, setFields] = useState<MatchEntryFields>();
  useEffect(() => {
    fetch("/api/match_entry/fields")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setFields(data);
      });
  }, []);
  return (
    <div>
      <h1>Match Entry Page</h1>
      {fields ? (
        fields.pages.map((page) => (
          <MatchPage page={page} entries={fields.entries}></MatchPage>
        ))
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

interface MatchPageProps {
  page: MatchEntryPage;
  entries: Record<string, MatchEntry>;
}
function MatchPage(props: MatchPageProps) {
  return (
    <>
      <h2>{props.page.title}</h2>
      {props.page.layout.map((entryName) => (
        <MatchDetail entry={props.entries[entryName]}></MatchDetail>
      ))}
    </>
  );
}

interface MatchDetailProps {
  entry: MatchEntry;
}
function MatchDetail(props: MatchDetailProps) {
  return (
    <>
      <h3>{props.entry.title}</h3>
      {props.entry.entry.type === "ability" ? (
        <AbilityEntry entry={props.entry.entry}></AbilityEntry>
      ) : props.entry.entry.type === "enum" ? (
        <EnumEntry
          options={props.entry.entry.options.map((item) => ({
            id: item,
            display: item,
          }))}
        ></EnumEntry>
      ) : props.entry.entry.type === "bool" ? (
        <BoolEntry entry={props.entry.entry}></BoolEntry>
      ) : props.entry.entry.type === "timer" ? (
        <TimerEntry entry={props.entry.entry}></TimerEntry>
      ) : (
        <p> Error </p>
      )}
    </>
  );
}

interface AbilityEntryProps {
  entry: AbilityMetric;
}
interface EnumEntryProps {
  options: Array<{ id: string; display: string }>;
}
interface BoolEntryProps {
  entry: BoolMetric;
}
interface TimerEntryProps {
  entry: TimerMetric;
}

function AbilityEntry(props: AbilityEntryProps) {
  return (
    <EnumEntry
      options={[
        { id: "nothing", display: "Nothing" },
        { id: "attempted", display: "Attempted" },
        { id: "succeeded", display: "Succeeded" },
      ]}
    ></EnumEntry>
  );
}
function EnumEntry(props: EnumEntryProps) {
  const [choice, setChoice] = useState<string>();
  return (
    <div className="item-container">
      {/* <p className="label">{props.label}</p> */}
      <div className="buttons">
        {props.options.map((options, index) => (
          <button
            key={index}
            className={`${
              options.id === choice ? "button-press" : "button-unpress"
            } ${
              index === 0
                ? "border-left"
                : index === props.options.length - 1
                ? "border-right"
                : ""
            }`}
            onClick={() => {
              /*	if (props.setState !== undefined) {
                                    props.setState(index);
                                } */
              setChoice(options.id);
            }}
          >
            <p className="button-text">{options.display}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BoolEntry(props: BoolEntryProps) {
  return (
    <EnumEntry
      options={[
        { id: "no", display: "No" },
        { id: "yes", display: "Yes" },
      ]}
    ></EnumEntry>
  );
}

interface NullTimer {
  type: "null";
}
interface RunningTimer {
  type: "running";
  startTime: number;
  currentTime: number;
}
interface ValueTimer {
  type: "value";
  totalTime: number;
}
type TimerState = NullTimer | RunningTimer | ValueTimer;

function TimerEntry(props: TimerEntryProps) {
  const [state, setState] = useState<TimerState>({ type: "null" });
  useEffect(() => {
    if (state.type === "running") {
      const id = setTimeout(
        () => setState({ ...state, currentTime: Date.now() }),
        100,
      );

      return () => clearTimeout(id);
    }
  }, [state]);

  return state.type === "null" ? (
    <button
      onClick={() => {
        setState({
          type: "running",
          startTime: Date.now(),
          currentTime: Date.now(),
        });
      }}
    >
      Start
    </button>
  ) : state.type === "running" ? (
    <>
      <p>
        running, {(state.currentTime - state.startTime) / 1000} seconds elapsed
      </p>
      <button
        onClick={() => {
          setState({ type: "value", totalTime: Date.now() - state.startTime });
        }}
      >
        Stop
      </button>
    </>
  ) : (
    <>
      <p>stopped, {state.totalTime / 1000} seconds elapsed</p>
      <button
        onClick={() => {
          setState({ type: "null" });
        }}
      >
        Reset timer
      </button>
    </>
  );
}
