import { LoadIndicator } from "../components/load_indicator";

interface MatchInfoProps {
  type: string;
  num: number;
  set: number;
}

/**
 * Team Info Page Component
 */
export function MatchInfo(props: MatchInfoProps) {
  return <LoadIndicator></LoadIndicator>;
}
