import { useAuth } from "../../hooks/useAuth";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useExerciseDetail } from "../../queries/useExercises";
export default function ExerciseDetailPage() {
  const { hasRole } = useAuth();
  const { slug } = useParams();
  const query = useExerciseDetail(slug);
  const exercise = query.data;
  return (
    <div className="product-page exercise-detail-page">
      <Link className="page-back" to="/exercises">
        <ArrowLeft size={16} />
        Exercise library
      </Link>
      {query.isLoading ? (
        <div className="page-state" role="status">
          Loading movement…
        </div>
      ) : query.isError ? (
        <div className="page-state page-state-error" role="alert">
          <h1>Movement unavailable</h1>
          <p>The exercise could not be loaded.</p>
          <button onClick={() => query.refetch()}>Retry</button>
        </div>
      ) : !exercise ? (
        <div className="page-state">
          <h1>Exercise not found</h1>
          <p>Choose another movement from the library.</p>
        </div>
      ) : (
        <>
          <div className="page-greeting">
            <div>
              <h1>{exercise.name}</h1>
              <p>
                {exercise.type} · {exercise.difficulty} ·{" "}
                {exercise.equipment.join(", ") || "No equipment"}
              </p>
            </div>
            {hasRole("athlete") && (
              <Link className="secondary-action" to="/athlete/explorer">
                Explore muscles
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
          <div className="two-column-page">
            <section className="page-section">
              <h2>How to perform it</h2>
              {exercise.instructions.length ? (
                <ol className="exercise-steps">
                  {exercise.instructions.map((step, i) => (
                    <li key={i}>
                      <span>{i + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="empty-copy">
                  Technique instructions haven’t been added yet. Ask your coach
                  for guidance.
                </p>
              )}
              {exercise.videoUrl && /^https?:/.test(exercise.videoUrl) && (
                <a
                  className="secondary-action mt-5"
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch demonstration
                  <ArrowUpRight size={16} />
                </a>
              )}
            </section>
            <section className="page-section">
              <h2>Muscles involved</h2>
              <div className="mt-5">
                <h3 className="font-semibold text-sm">Primary</h3>
                <p className="section-note">
                  {exercise.primaryMuscles
                    .map((m) => m.displayName)
                    .join(", ") || "Not specified"}
                </p>
              </div>
              {exercise.secondaryMuscles.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold text-sm">Supporting</h3>
                  <p className="section-note">
                    {exercise.secondaryMuscles
                      .map((m) => m.displayName)
                      .join(", ")}
                  </p>
                </div>
              )}
              <p className="section-note mt-6">
                Move with control. If a movement causes pain, stop and ask a
                qualified professional.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
