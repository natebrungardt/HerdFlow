import { BrowserRouter, Routes, Route } from "react-router-dom";
import AllCowPage from "./pages/cows/AllCowPage";
import CowDetailPage from "./pages/cows/CowDetailPage";
import Navbar from "./components/shared/Navbar";
import Dashboard from "./pages/Dashboard";
import AddCowButton from "./pages/cows/AddCow";
import RemovedCows from "./pages/cows/RemovedCows";
import AllWorkdayPage from "./pages/workdays/AllWorkdayPage";
import AddWorkdayPage from "./pages/workdays/AddWorkdayPage";
import WorkdayPage from "./pages/workdays/WorkdayPage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cows" element={<AllCowPage />} />
        <Route path="/cows/:id" element={<CowDetailPage />} />
        <Route path="/add-cow" element={<AddCowButton />} />
        <Route path="/removed" element={<RemovedCows />} />
        <Route path="/workdays" element={<AllWorkdayPage />} />
        <Route path="/workdays/new" element={<AddWorkdayPage />} />
        <Route path="/workdays/:id" element={<WorkdayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
