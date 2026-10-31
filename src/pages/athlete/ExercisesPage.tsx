import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import { useExercises } from "../../queries/useExercises";
import { useMuscles } from "../../queries/useMuscles";
export default function ExercisesPage() {
  const { hasRole } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const muscle = params.get("muscle") || "";
  const equipment = params.get("equipment") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = 20;
  useEffect(() => {
    setSearch(params.get("q") || "");
  }, [params.get("q")]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get("q") || "")) {
        const next = new URLSearchParams(params);
        search.trim() ? next.set("q", search.trim()) : next.delete("q");
        next.delete("page");
        setParams(next, { replace: true });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search, params, setParams]);
  const muscles = useMuscles();
  const results = useExercises({
    muscle: muscle || undefined,
    equipment: equipment || undefined,
    q: params.get("q") || undefined,
    page,
    limit,
  });
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete("page");
    setParams(next);
  };
  const changePage = (value: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setParams(next);
    document.getElementById("library-results")?.focus();
  };
  return (
    <div className="product-page">
      {hasRole("athlete") && (
        <div className="page-top-actions">
          <Link className="secondary-action" to="/athlete/explorer">
            Muscle explorer
            <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      <div className="library-filters">
        <label>
          Search exercises
          <input
            className="fp-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
          />
        </label>
        <label>
          Muscle
          <select
            className="fp-input"
            value={muscle}
            onChange={(e) => filter("muscle", e.target.value)}
          >
            <option value="">All muscles</option>
            {muscles.data?.map((m) => (
              <option key={m._id} value={m._id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select
            className="fp-input"
            value={equipment}
            onChange={(e) => filter("equipment", e.target.value)}
          >
            <option value="">All equipment</option>
            {[
              "barbell",
              "dumbbell",
              "cable",
              "machine",
              "bodyweight",
              "plate",
            ].map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section
        className="page-section"
        id="library-results"
        tabIndex={-1}
        aria-label="Exercise results"
      >
        <div className="section-row">
          <h2>
            {results.data
              ? `${results.data.total} exercises`
              : "Movements for your training"}
          </h2>
          {(search || muscle || equipment) && (
            <button
              className="row-action"
              onClick={() => {
                setSearch("");
                setParams({});
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        {results.isLoading ? (
          <p className="empty-copy" role="status">
            Loading exercise library…
          </p>
        ) : results.isError ? (
          <div className="page-state page-state-error" role="alert">
            <h2>The library couldn’t be loaded.</h2>
            <p>Check your connection and try again.</p>
            <button onClick={() => results.refetch()}>Retry</button>
          </div>
        ) : results.data?.exercises.length ? (
          <>
            <ul className="library-list">
              {results.data.exercises.map((ex) => (
                <li key={ex._id} className="exercise-row">
                  <Link to={`/exercises/${ex.slug}`}>
                    <span>{ex.name}</span>
                    <ArrowUpRight size={17} />
                  </Link>
                  <p>
                    {ex.primaryMuscles.map((m) => m.displayName).join(", ")}
                    <br />
                    {ex.equipment.join(", ")} · {ex.difficulty}
                  </p>
                </li>
              ))}
            </ul>
            <div className="list-pagination">
              <span>
                {(page - 1) * limit + 1}–
                {Math.min(page * limit, results.data.total)} of{" "}
                {results.data.total}
              </span>
              <div>
                <button
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= results.data.total}
                  onClick={() => changePage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-state">
            <Search size={24} />
            <h3>No movements match.</h3>
            <p>Try a different search, muscle or equipment filter.</p>
            <button
              onClick={() => {
                setSearch("");
                setParams({});
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
