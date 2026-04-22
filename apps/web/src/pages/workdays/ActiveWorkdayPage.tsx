import { Link, useParams } from "react-router-dom";
import "../../styles/AllCows.css";

function ActiveWorkdayPage() {
  const { id } = useParams();

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Active Workday</h1>
              <p className="pageSubtitle">
                The live workday grid is the next step. This setup handoff route
                is ready and linked for workday launch.
              </p>
            </div>
            <Link className="addCowButton" to={`/workdays/${id}`}>
              Back to Setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveWorkdayPage;
