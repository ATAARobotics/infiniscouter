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
			<Navbar title={""} />
			<a href={`/image/full/${props.id}`} target="_blank">
				<img src={`/image/full/${props.id}`} />
			</a>
		</div>
	);
}
