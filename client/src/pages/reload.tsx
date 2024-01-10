import { useEffect } from "preact/hooks";

/**
 * Component that just reloads the page (for something that is not using React router).
 */
export function Reload() {
  useEffect(() => {
    location.reload();
  }, []);

  return <></>;
}
