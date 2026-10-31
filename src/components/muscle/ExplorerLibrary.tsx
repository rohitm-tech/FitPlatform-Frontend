import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useExercises } from "../../queries/useExercises";
import { useMuscles } from "../../queries/useMuscles";

const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "plate",
];

export function ExplorerLibrary({
  muscleId,
  onClose,
}: {
  muscleId?: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(muscleId || "");
  const [equipment, setEquipment] = useState("");
  const [page, setPage] = useState(1);
  const muscles = useMuscles();
  const results = useExercises({
    muscle: muscle || undefined,
    equipment: equipment || undefined,
    q: query || undefined,
    page,
    limit: 12,
  });

  useEffect(() => {
    setMuscle(muscleId || "");
    setPage(1);
  }, [muscleId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const total = results.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 12));

  return (
    <section className="explorer-library" aria-label="All exercises">
      <header className="explorer-library-head">
        <h2>All exercises</h2>
        <button type="button" onClick={onClose} aria-label="Close exercises">
          <X size={16} />
        </button>
      </header>
      <div className="explorer-library-filters">
        <label>
          Search
          <input
            className="fp-input"
            type="search"
            value={search}
            placeholder="Search by name"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Muscle
          <select
            className="fp-input"
            value={muscle}
            onChange={(event) => {
              setMuscle(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All muscles</option>
            {muscles.data?.map((item) => (
              <option key={item._id} value={item._id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select
            className="fp-input"
            value={equipment}
            onChange={(event) => {
              setEquipment(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All equipment</option>
            {EQUIPMENT.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {results.isLoading ? (
        <p className="explorer-library-status" role="status">
          Loading exercises…
        </p>
      ) : results.isError ? (
        <div className="explorer-library-status" role="alert">
          <p>The exercise list couldn’t be loaded.</p>
          <button type="button" onClick={() => results.refetch()}>
            Try again
          </button>
        </div>
      ) : results.data?.exercises.length ? (
        <>
          <p className="explorer-library-count">{total} exercises</p>
          <ul className="explorer-library-list">
            {results.data.exercises.map((exercise) => (
              <li key={exercise._id}>
                <Link to={`/exercises/${exercise.slug}`}>
                  <span>
                    <strong>{exercise.name}</strong>
                    <small>
                      {exercise.primaryMuscles
                        .map((item) => item.displayName)
                        .join(", ") || "Muscle not listed"}
                      {" · "}
                      {exercise.equipment.join(", ") || "No equipment"}
                    </small>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="explorer-library-pages">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span>
              {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="explorer-library-status">
          <Search size={20} aria-hidden="true" />
          <p>No movements match.</p>
        </div>
      )}
    </section>
  );
}
