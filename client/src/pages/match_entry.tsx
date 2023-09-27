import {useState, useEffect} from "preact/hooks";
import {MatchEntryFields} from "../generated/MatchEntryFields";
import {MatchEntryPage} from "../generated/MatchEntryPage";
import {MatchEntry} from "../generated/MatchEntry";
import {AbilityMetric} from "../generated/AbilityMetric";
import {EnumMetric} from "../generated/EnumMetric";
import {BoolMetric} from "../generated/BoolMetric";
import {TimerMetric} from "../generated/TimerMetric";


// Match Entry Page Component
export function MatchEntry() {
    const [fields, setFields] = useState<MatchEntryFields>();
    useEffect(() => {
        fetch("/api/match_entry/fields")
        .then(response => response.json())
        .then(data => {
            console.log(data)
            setFields(data)
        })
    }, []);
    return (<div>
        <h1>Match Entry Page</h1>
        {
            fields ? fields.pages.map(page => <MatchPage page={page} entries = {fields.entries}></MatchPage>) : <p>Loading...</p>
        }
    </div>);
}

interface MatchPageProps{
    page: MatchEntryPage
    entries: Record<string, MatchEntry>
}
function MatchPage(props: MatchPageProps){
    return <>
        <h2>{props.page.title}</h2>
        {props.page.layout.map(entryName => <MatchDetail entry={props.entries[entryName]}></MatchDetail>)}
    </>;
}

interface MatchDetailProps{
    entry: MatchEntry
}
function MatchDetail(props: MatchDetailProps) {
    return <>
        <h3>{props.entry.title}</h3>
        {props.entry.entry.type==="ability" ? <AbilityEntry entry={props.entry.entry}></AbilityEntry>
        : props.entry.entry.type==="enum" ? <EnumEntry entry={props.entry.entry}></EnumEntry>
        : props.entry.entry.type==="bool" ? <BoolEntry entry={props.entry.entry}></BoolEntry>
        : props.entry.entry.type==="timer" ? <TimerEntry entry={props.entry.entry}></TimerEntry> : <p> Error </p>}
    </>;
}
function AbilityEntry(props: AbilityEntryProps){
    return <EnumEntry entry={{ options : ["nothing", "attempted", "succeeded"]}}></EnumEntry>
}
function EnumEntry(props: EnumEntryProps){
	const [choice, setChoice] = useState<number>();
	return (
		<div className="item-container">
			{/* <p className="label">{props.label}</p> */}
			<div className="buttons">
				{props.entry.options.map((label, index) => (
					<button
						key={index}
						className={`${
							index ===
							(choice)
								? "button-press"
								: "button-unpress"
						} ${
							index === 0
								? "border-left"
								: index === props.entry.options.length - 1
								? "border-right"
								: ""
						}`}
						onClick={() => {
						/*	if (props.setState !== undefined) {
								props.setState(index);
							} */
							setChoice(index); 
						}}
					>
						<p className="button-text">{label}</p>
					</button>
				))}
			</div>
		</div>
	);
}

function BoolEntry(props: BoolEntryProps){
    return <EnumEntry entry={{ options : ["no", "yes"]}}></EnumEntry>
}
function TimerEntry(props: TimerEntryProps){
    return <p>timer</p>
}

interface AbilityEntryProps{
    entry: AbilityMetric
}
interface EnumEntryProps{
    entry: EnumMetric
}
interface BoolEntryProps{
    entry: BoolMetric
}
interface TimerEntryProps{
    entry: TimerMetric
}