import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="navbar">
      <Link className="navbar-left" to="/">
        HerdFlow
      </Link>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/cows">Herd</Link>
        <Link to="/workdays">Workday</Link>
        <Link to="/finances">Finances</Link>
        <Link to="/removed">Removed Cows</Link>
      </div>
    </div>
  );
}
export default Navbar;
