import { useState, useEffect } from "preact/hooks";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { MatchEntryPage } from "../generated/MatchEntryPage";
import { MatchEntry } from "../generated/MatchEntry";
import { AbilityMetric } from "../generated/AbilityMetric";
import { BoolMetric } from "../generated/BoolMetric";
import { TimerMetric } from "../generated/TimerMetric";
import Button from "@mui/joy/Button";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Box from "@mui/joy/Box";
import { MatchEntryData } from "src/generated/MatchEntryData";
import { MatchEntryValue } from "src/generated/MatchEntryValue";
import {
  Input,
  Option,
  CircularProgress,
  Select,
  Slider,
  RadioGroup,
  Radio,
  Stack,
} from "@mui/joy";

// Match Entry Page Component
export function MatchEntry() {
  const [matchId, setMatchId] = useState<string>();
  const [teamId, setTeamId] = useState<string>();

  if (matchId === undefined || teamId === undefined) {
    return (
      <Box>
        <h1>Match Entry Page</h1>
        <RadioGroup>
          <Stack direction="row">
            <Stack direction="column">
              <Text>RED</Text>
              <Radio value="4421" label="FORGE" />
              <Radio value="254" label="CHEESE" />
              <Radio value="4627" label="MANNING" />
            </Stack>
            <Stack direction="column">
              <Text>BLUE</Text>
              <Radio value="4334" label="SERIAL ATA" />
              <Radio value="5015" label="SWATTY" />
              <Radio value="1678" label="LEMON" />
            </Stack>
          </Stack>
        </RadioGroup>
      </Box>
    );
  }

  const [fields, setFields] = useState<MatchEntryFields>();
  useEffect(() => {
    fetch("/api/match_entry/fields")
      .then((response) => response.json())
      .then((data2) => {
        setFields(data2);
      });
  }, []);

  const [data, setData] = useState<MatchEntryData>({ entries: {} });

  return (
    <Box>
      <h1>Match Entry Page</h1>
      {fields ? (
        fields.pages.map((page) => (
          <MatchPage
            page={page}
            entries={fields.entries}
            setEntry={(id, value) => {
              console.log(id, value);

              if (value === undefined) {
                const tmp = { entries: { ...data.entries } };
                delete tmp.entries[id];
                setData(tmp);
              } else {
                setData({ entries: { ...data.entries, [id]: value } });
              }
            }}
            allEntries={data.entries}
          ></MatchPage>
        ))
      ) : (
        <div>
          <CircularProgress
            color="danger"
            determinate={false}
            size="sm"
            value={25}
            variant="solid"
            thickness={7}
          />
          {"  "}Loading...
        </div>
      )}
    </Box>
  );
}

interface MatchPageProps {
  page: MatchEntryPage;
  entries: Record<string, MatchEntry>;
  allEntries: Record<string, MatchEntryValue>;
  setEntry: (id: string, value: MatchEntryValue | undefined) => void;
}
function MatchPage(props: MatchPageProps) {
  return (
    <>
      <h2>{props.page.title}</h2>
      {props.page.layout.map((entryName) => (
        <MatchDetail
          entry={props.entries[entryName]}
          setValue={(value) => props.setEntry(entryName, value)}
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

interface AbilityEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  entry: AbilityMetric;
}
interface EnumEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  options: Array<{ id: string | boolean; display: string }>;
  entryType: "ability" | "bool" | "enum";
}
interface BoolEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue | undefined) => void;
  entry: BoolMetric;
}
interface TimerEntryProps {
  value: MatchEntryValue | undefined;
  setValue: (value: MatchEntryValue) => void;
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
      value={props.value}
      setValue={props.setValue}
      entryType="ability"
    ></EnumEntry>
  );
}
function EnumEntry(props: EnumEntryProps) {
  //const [value, setValue] = useState<string | null>();
  return (
    <ToggleButtonGroup
      value={(props.value as any)?.value as string}
      onChange={(event, newValue) => {
        if (newValue === null) {
          props.setValue(undefined);
        } else {
          props.setValue({
            value: newValue,
            type: props.entryType,
          } as MatchEntryValue);
        }
      }}
    >
      {props.options.map((options, index) => (
        <Button value={options.id}>
          <p className="button-text">{options.display}</p>
        </Button>
      ))}
    </ToggleButtonGroup>
  );
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
    <Button
      onClick={() => {
        setState({
          type: "running",
          startTime: Date.now(),
          currentTime: Date.now(),
        });
      }}
    >
      Start
    </Button>
  ) : state.type === "running" ? (
    <>
      <p>
        Running! {(state.currentTime - state.startTime) / 1000} seconds elapsed.
      </p>
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
            currentTime: Date.now(),
          });
        }}
      >
        Continue timer?
      </Button>
      <Button
        onClick={() => {
          setState({ type: "null" });
        }}
      >
        Reset timer?
      </Button>
    </>
  );
}
