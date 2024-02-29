import {
	Box,
	Button,
	CircularProgress,
	Input,
	Stack,
	Textarea,
	ToggleButtonGroup,
	Typography,
} from "@mui/joy";
import { useEffect, useState } from "preact/hooks";

import { AbilityMetric } from "../generated/AbilityMetric";
import { BoolMetric } from "../generated/BoolMetric";
import { CounterMetric } from "../generated/CounterMetric";
import { ImageMetric } from "../generated/ImageMetric";
import { MatchEntry } from "../generated/MatchEntry";
import { MatchEntryPage } from "../generated/MatchEntryPage";
import { MatchEntryValue } from "../generated/MatchEntryValue";
import { TextEntryMetric } from "../generated/TextEntryMetric";
import { TimerMetric } from "../generated/TimerMetric";
import { getImage, saveImage } from "../images";

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
			<Typography
				level="h2"
				textAlign={{ xs: "center", md: "start" }}
				margin={1}
				marginTop={2}
			>
				{props.page.title}
			</Typography>
			{props.page.layout.map((entryName) => (
				<MatchDetail
					entry={props.entries[entryName]}
					setValue={(value) => {
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
		<Box margin={{ xs: "0 2rem 1.5rem 2rem", md: "1rem 1rem 1rem 2rem" }}>
			<Typography level="h3">{props.entry.title}</Typography>
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
			) : props.entry.entry.type === "counter" ? (
				<CounterEntry
					entry={props.entry.entry}
					value={props.value}
					setValue={props.setValue}
				/>
			) : props.entry.entry.type === "text_entry" ? (
				<TextFieldEntry
					entry={props.entry.entry}
					value={props.value}
					setValue={props.setValue}
				/>
			) : props.entry.entry.type === "image" ? (
				<ImageEntry
					entry={props.entry.entry}
					value={props.value}
					setValue={props.setValue}
				/>
			) : (
				<Typography>Error</Typography>
			)}
		</Box>
	);
}

interface EnumEntryProps {
	value: MatchEntryValue | undefined;
	setValue: (value: MatchEntryValue | undefined) => void;
	options: Array<{ id: string | boolean; display: string }>;
	entryType: "ability" | "bool" | "enum";
}

/**
 *	An entry for enum thingies
 */
function EnumEntry(props: EnumEntryProps) {
	return (
		<ToggleButtonGroup
			value={
				props.value &&
					(props.value.type === "enum" ||
						props.value.type === "ability" ||
						props.value.type === "bool")
					? props.value.value.toString()
					: ""
			}
			onChange={(_, newValue) => {
				if (newValue === undefined || newValue === null) {
					props.setValue(undefined);
				} else {
					if (props.entryType === "bool") {
						props.setValue({
							value: newValue === "true",
							type: props.entryType,
						} as MatchEntryValue);
					} else {
						props.setValue({
							value: newValue,
							type: props.entryType,
						} as MatchEntryValue);
					}
				}
			}}
		>
			{props.options.map((option) => (
				<Box
					width={{ xs: `${100 / props.options.length}%`, md: "auto" }}
					height={{ xs: "6rem", md: "auto" }}
				>
					<Button
						fullWidth
						sx={{ height: "100%" }}
						value={option.id.toString()}
					>
						<p className="button-text">{option.display}</p>
					</Button>
				</Box>
			))}
		</ToggleButtonGroup>
	);
}

interface AbilityEntryProps {
	value: MatchEntryValue | undefined;
	setValue: (value: MatchEntryValue | undefined) => void;
	entry: AbilityMetric;
}

/**
 *	An entry for ability thingies
 */
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

/**
 *	An entry for bool thingies
 */
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

interface CounterEntryProps {
	value: MatchEntryValue | undefined;
	setValue: (value: MatchEntryValue | undefined) => void;
	entry: CounterMetric;
}

/**
 *	An entry for counter / number up down thingies
 */
function CounterEntry(props: CounterEntryProps) {
	const buttonStyle = {
		height: "100%",
		borderRadius: "1rem 0 0 1rem",
		fontSize: "2rem",
		fontWeight: "bold",
	};
	const rangeStart = props.entry?.limit_range?.start;
	const rangeEnd = props.entry?.limit_range?.end_inclusive;
	return (
		<Stack direction="row" height={{ xs: "6rem", md: "4rem" }}>
			<Box width={{ xs: "6rem", md: "4rem" }}>
				<Button
					color="danger"
					sx={buttonStyle}
					fullWidth
					onClick={() => {
						if (props.value?.type !== "counter") {
							props.setValue({
								count: props.entry.limit_range?.start ?? 0,
								type: "counter",
							});
						} else if (
							props.entry?.limit_range === null ||
							props.entry?.limit_range === undefined ||
							props.value.count > props.entry.limit_range.start
						) {
							props.setValue({
								count: props.value.count - 1,
								type: "counter",
							});
						}
					}}
				>
					-
				</Button>
			</Box>
			{
				// @ts-expect-error Input seems to want a component for some reason?
				<Input
					type="number"
					sx={{
						borderRadius: "0",
						fontSize: { xs: "2rem", md: "1.5rem" },
					}}
					placeholder={
						rangeStart && rangeEnd
							? `Enter a number from ${rangeStart} to ${rangeEnd}`
							: "Enter a number"
					}
					onChange={(ev: InputEvent) => {
						const value = parseInt((ev.target as HTMLInputElement).value);
						if (
							!isNaN(value) &&
							(!props.entry?.limit_range ||
								(value >= props.entry.limit_range.start &&
									value <= props.entry.limit_range.end_inclusive))
						) {
							props.setValue({ type: "counter", count: value });
						} else {
							props.setValue(undefined);
						}
					}}
					value={
						props.value && props.value.type === "counter"
							? props.value.count
							: ""
					}
				/>
			}
			<Box width={{ xs: "6rem", md: "4rem" }}>
				<Button
					color="primary"
					sx={{ ...buttonStyle, borderRadius: "0 1rem 1rem 0" }}
					fullWidth
					onClick={() => {
						if (props.value?.type !== "counter") {
							props.setValue({
								count: props.entry.limit_range?.start ?? 0,
								type: "counter",
							});
						} else if (
							props.entry?.limit_range === null ||
							props.entry?.limit_range === undefined ||
							props.value.count < props.entry.limit_range.end_inclusive
						) {
							props.setValue({
								count: props.value.count + 1,
								type: "counter",
							});
						}
					}}
				>
					+
				</Button>
			</Box>
		</Stack>
	);
}

interface TextFieldEntryProps {
	value: MatchEntryValue | undefined;
	setValue: (value: MatchEntryValue | undefined) => void;
	entry: TextEntryMetric;
}

/**
 *	An entry for TEXTTT thingies
 */
function TextFieldEntry(props: TextFieldEntryProps) {
	const cl = (ev: InputEvent) => {
		let value = (ev.target as HTMLInputElement).value;
		if (!props.entry.multiline) {
			value = value.replaceAll("\n", "");
		}
		props.setValue({ type: "text_entry", text: value });
	};
	return (
		// @ts-expect-error Input seems to want a component for some reason?
		<Textarea
			minRows={props.entry.multiline ? 4 : 1}
			maxRows={props.entry.multiline ? 8 : 1}
			placeholder="Enter useful notes, if any"
			onKeyDown={cl}
			onKeyUp={cl}
			onChange={cl}
			value={
				props.value && props.value.type === "text_entry"
					? props.value.text
					: ""
			}
		/>
	);
}

interface LocalImageProps {
	imageId: string;
	mimeType: string;
}


/**
 * Display an image from the indexed db
 */
function LocalImage(props: LocalImageProps) {
	const [imageData, setImageData] = useState<{ id: string; data: ArrayBuffer }>();

	useEffect(() => {
		if (!imageData || imageData.id !== props.imageId) {
			let cancel = false;
			getImage(props.imageId)
				.then(data => {
					if (data && !cancel) {
						setImageData({ id: props.imageId, data });
					}
				});

			return () => {
				cancel = true;
			};
		}

		return () => { };
	}, [imageData, props]);

	return (imageData && imageData.id === props.imageId)
		? <img height="150" src=
			{URL.createObjectURL(new Blob([imageData.data], { type: props.mimeType }))}
		></img>
		: <CircularProgress
			color="neutral"
			determinate={false}
			size="lg"
			variant="solid"
			thickness={18}
		/>;
}

interface ImageEntryProps {
	value: MatchEntryValue | undefined;
	setValue: (value: MatchEntryValue | undefined) => void;
	entry: ImageMetric;
}

/**
 * Convert an image filename to a mime type.
 */
function toMime(filename: string): string {
	if (filename.endsWith(".png")) {
		return "image/png";
	} else if (
		filename.endsWith(".jpg") ||
		filename.endsWith(".jpeg") ||
		filename.endsWith(".jfif")
	) {
		return "image/jpeg";
	} else if (filename.endsWith(".heic") || filename.endsWith(".heif")) {
		return "image/heic";
	} else if (filename.endsWith(".webp")) {
		return "image/webp";
	} else if (filename.endsWith(".gif")) {
		return "image/gif";
	} else if (filename.endsWith(".bmp")) {
		return "image/bmp";
	} else {
		return "image/jpeg";
	}
}

/**
 *	An entry for image thingies
 */
function ImageEntry(props: ImageEntryProps) {
	return (
		<Box>
			<input
				type="file"
				capture="environment"
				accept="image/*"
				onChange={(ev) => {
					const files = (ev.target as HTMLInputElement).files;
					for (let f = 0; f < (files?.length ?? 0); f++) {
						const file = (files ?? [])[f];
						if (file !== null) {
							saveImage(file).then((imageUuid) => {
								props.setValue({
									type: "image",
									images: [
										...((props.value?.type === "image"
											? props.value?.images
											: undefined) ?? []),
										{
											image_mime: toMime(file.name),
											image_id: imageUuid,
											// @ts-expect-error: Hack
											local: true,
										},
									],
								});
							});
						}
					}
				}}
			/>
			<Stack direction="row">
				{
					props.value?.type === "image" ? props.value.images.map(img =>
						<Box id={img.image_id}>
							<Button
								color="danger"
								sx={{
									position: "absolute",
									boxSizing: "border-box",
									width: "32px",
									height: "32px",
									padding: 0,
									borderRadius: "25%",
								}}
								onClick={() => {
									props.setValue({
										type: "image",
										images: ((props.value?.type === "image"
											? props.value?.images
											: undefined) ?? [])
											.filter(img2 => img2.image_id !== img.image_id),
									});
								}}
							>⊗</Button>
							{((img as unknown as { local: true | undefined }).local ?
								<LocalImage imageId={img.image_id} mimeType={img.image_mime} /> :
								<img height="150" src={`/image/small/${img.image_id}`}></img>
							)}
						</Box>,
					) : "Invalid image data"
				}
			</Stack >
		</Box >
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

/**
 *	An entry for timer thingies
 */
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
			<p>
				Running! {(currentTime - state.startTime) / 1000} seconds elapsed.
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
