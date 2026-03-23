import { BrowserRouter, Routes, Route } from "react-router-dom";
import AllCowPage from "./pages/AllCowPage";
import CowDetailPage from "./pages/CowDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AllCowPage />} />
        <Route path="/cows/:id" element={<CowDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
