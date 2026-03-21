import { useEffect, useState } from "react";
import { getCows } from "../services/cowService";
import type { Cow } from "../types/cow";

function CowsPage() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCows() {
      try {
        const data = await getCows();
        setCows(data);
      } catch (err) {
        setError("Failed to load cows");
      } finally {
        setLoading(false);
      }
    }

    loadCows();
  }, []);

  if (loading) return <p>Loading cows...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>HerdFlow</h1>
      <h2>All Cows</h2>

      {cows.length === 0 ? (
        <p>No cows found.</p>
      ) : (
        <ul>
          {cows.map((cow) => (
            <li key={cow.id}>
              #{cow.id} — Tag: {cow.tagNumber} — Breed: {cow.breed}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CowsPage;
