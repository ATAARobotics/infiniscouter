export function Navbar() {
  return (
    <nav className="header">
      <span>
        <div className="navbar">
          <a href={"/"}>Home</a> / <a href={"/match_entry"}>Match Entry</a> /{" "}
          <a href={"/api/docs"}>Documentation</a>
        </div>
      </span>
    </nav>
  );
}
