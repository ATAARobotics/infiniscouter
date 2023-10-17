/**
 *	Component for the home page.
 * @returns The component
 */
export function Home() {
  return (
    <div>
      <h1>Welcome to Infiniscouter!</h1>
      <p>
        Link to <a href={"/api/docs"}>API Documentation</a>.
      </p>
    </div>
  );
}
