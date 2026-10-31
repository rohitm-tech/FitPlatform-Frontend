import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Crosshair, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearSelectedMuscle } from "../../store/slices/explorerSlice";
import { useMuscleDetail } from "../../queries/useMuscles";
import "../../muscle-panel.css";

export function MusclePanel({
  onBrowseExercises,
}: {
  onBrowseExercises?: (muscleId?: string) => void;
} = {}) {
  const dispatch = useAppDispatch();
  const selectedMuscleKey = useAppSelector(
    (state) => state.explorer.selectedMuscleKey,
  );
  const { data, isLoading, isError, refetch } =
    useMuscleDetail(selectedMuscleKey);
  const [focus, setFocus] = useState<"primary" | "supporting">("primary");
  useEffect(() => setFocus("primary"), [selectedMuscleKey]);
  if (!selectedMuscleKey)
    return (
      <div className="muscle-panel-empty">
        <span className="muscle-empty-symbol">
          <Crosshair size={25} strokeWidth={1.5} />
        </span>
        <h2>Start with a muscle.</h2>
        <p>
          Select a muscle on the model or choose one from the menu. Find
          movements that train it and learn the technique.
        </p>
        {onBrowseExercises ? (
          <button type="button" onClick={() => onBrowseExercises()}>
            Browse all exercises <ArrowUpRight size={16} />
          </button>
        ) : (
          <Link to="/exercises">
            Browse all exercises <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    );
  if (isError)
    return (
      <div role="alert" className="muscle-panel-empty">
        <h2>This muscle couldn’t be loaded.</h2>
        <p>Your selection is saved. Try loading its exercises again.</p>
        <button className="secondary-action" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  if (isLoading || !data)
    return (
      <div className="muscle-panel-empty" role="status">
        Loading muscle details…
      </div>
    );
  const { muscle, primaryExercises, secondaryExercises } = data;
  const exercises = focus === "primary" ? primaryExercises : secondaryExercises;
  return (
    <section
      className="muscle-detail"
      aria-label={`${muscle.displayName} details`}
    >
      <header className="muscle-detail-header">
        <div className="muscle-heading-row">
          <h2 aria-live="polite">{muscle.displayName}</h2>
          <button
            className="muscle-close"
            aria-label="Clear selected muscle"
            onClick={() => dispatch(clearSelectedMuscle())}
          >
            <X size={18} />
          </button>
        </div>
        <span className="muscle-group-label">{muscle.group}</span>
        <p>{muscle.description}</p>
      </header>
      <div className="muscle-exercise-browser">
        <div className="muscle-section-heading">
          <h3>Train this muscle</h3>
          <span>
            {primaryExercises.length + secondaryExercises.length} exercises
          </span>
        </div>
        <div
          className="muscle-focus-switch"
          role="group"
          aria-label="Exercise muscle involvement"
        >
          <button
            aria-pressed={focus === "primary"}
            onClick={() => setFocus("primary")}
          >
            Primary <span>{primaryExercises.length}</span>
          </button>
          <button
            aria-pressed={focus === "supporting"}
            onClick={() => setFocus("supporting")}
          >
            Supporting <span>{secondaryExercises.length}</span>
          </button>
        </div>
        <p className="muscle-focus-description">
          {focus === "primary"
            ? "Movements that target this muscle directly."
            : "Movements where this muscle helps the main movers."}
        </p>
        {exercises.length ? (
          <ul className="muscle-exercise-list">
            {exercises.map((exercise) => (
              <li key={exercise._id}>
                <Link to={`/exercises/${exercise.slug}`}>
                  <span className="muscle-exercise-copy">
                    <strong>{exercise.name}</strong>
                    <span>
                      {exercise.equipment?.length
                        ? exercise.equipment.join(" · ").replace(/_/g, " ")
                        : "No equipment"}
                      {exercise.difficulty ? ` · ${exercise.difficulty}` : ""}
                    </span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muscle-no-exercises">
            No {focus} exercises are listed yet. Try the other group or explore
            the library.
          </p>
        )}
      </div>
      <footer className="muscle-detail-footer">
        {onBrowseExercises ? (
          <button type="button" onClick={() => onBrowseExercises(muscle._id)}>
            See all exercises <ArrowUpRight size={16} />
          </button>
        ) : (
          <Link to={`/exercises?muscle=${muscle._id}`}>
            Open in exercise library <ArrowUpRight size={16} />
          </Link>
        )}
        <p>Open a movement for instructions and technique.</p>
      </footer>
    </section>
  );
}
