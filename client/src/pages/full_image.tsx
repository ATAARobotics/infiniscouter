import { Navbar } from "../components/navbar";

interface FullImageProps {
	id: string;
}

/**
 * Team Info Page Component
 */
export function FullImage(props: FullImageProps) {
	return (
		<div>
			<Navbar title={"Image"} />
			<a href={`/image/full/${props.id}`} target="_blank">
				<img
					src={`/image/full/${props.id}`}
					style={{ transform: "rotate(90deg)", width: "90vw" }}
				/>
			</a>
		</div>
	);
}
