import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useExercises } from "../../queries/useExercises";
import {
  useMyAthletes,
  useCreateTemplate,
  useAssignTemplate,
  useTemplates,
} from "../../queries/useCoach";
import type { WorkoutTemplate } from "../../types/domain";
type Item = {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetWeightKg: number;
  restSec: number;
};
export default function WorkoutBuilderPage() {
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [savedTemplate, setSavedTemplate] = useState<WorkoutTemplate | null>(
    null,
  );
  const [error, setError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assigned, setAssigned] = useState(false);
  const exercises = useExercises({ q: query || undefined, limit: 8 });
  const athletes = useMyAthletes();
  const templates = useTemplates();
  const save = useCreateTemplate();
  const assign = useAssignTemplate();
  const selectedTemplate =
    templates.data?.find((t) => t._id === templateId) ||
    (savedTemplate?._id === templateId ? savedTemplate : null);
  const update = (i: number, field: keyof Item, value: number) =>
    setItems((rows) =>
      rows.map((row, index) =>
        index === i ? { ...row, [field]: value } : row,
      ),
    );
  const saveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!title.trim() || !items.length) {
      setError("Give the template a title and add at least one exercise.");
      return;
    }
    try {
      const res = await save.mutateAsync({
        title: title.trim(),
        items: items.map(
          ({ exerciseId, sets, reps, targetWeightKg, restSec }) => ({
            exerciseId,
            sets,
            reps,
            targetWeightKg,
            restSec,
          }),
        ),
      });
      setSavedTemplate(res.data.data);
      setTemplateId(res.data.data._id);
      setAssigned(false);
      toast.success("Template saved. Choose athletes and a date to assign it.");
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          "Template could not be saved. Your draft is still here.",
      );
    }
  };
  const assignSession = async (event: FormEvent) => {
    event.preventDefault();
    setAssignError("");
    setAssigned(false);
    if (!templateId || !selectedAthletes.length || !date) {
      setAssignError(
        "Choose a saved template, at least one athlete and a session date.",
      );
      return;
    }
    try {
      await assign.mutateAsync({
        templateId,
        athleteIds: selectedAthletes,
        dates: [date],
      });
      setAssigned(true);
      toast.success("Session assigned");
    } catch (e: any) {
      setAssignError(
        e.response?.data?.message ||
          "The session could not be assigned. Try again.",
      );
    }
  };
  return (
    <div className="product-page builder-page">
      <div className="two-column-page">
        <form className="page-section" onSubmit={saveTemplate}>
          <h2>Create a template</h2>
          <label className="fp-label mt-5" htmlFor="template-title">
            Template title
          </label>
          <input
            id="template-title"
            className="fp-input"
            required
            maxLength={120}
            value={title}
            placeholder="e.g. Full-body foundations"
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="fp-label mt-5" htmlFor="builder-search">
            Add an exercise
          </label>
          <input
            id="builder-search"
            className="fp-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the exercise library"
          />
          {query && (
            <div className="search-options">
              {exercises.isLoading ? (
                <p className="empty-copy">Searching…</p>
              ) : exercises.isError ? (
                <p className="empty-copy">
                  Search could not load.{" "}
                  <button type="button" onClick={() => exercises.refetch()}>
                    Retry
                  </button>
                </p>
              ) : exercises.data?.exercises.length ? (
                exercises.data.exercises.map((ex) => (
                  <button
                    type="button"
                    key={ex._id}
                    onClick={() => {
                      setItems((rows) => [
                        ...rows,
                        {
                          exerciseId: ex._id,
                          exerciseName: ex.name,
                          sets: 3,
                          reps: 10,
                          targetWeightKg: 0,
                          restSec: 90,
                        },
                      ]);
                      setQuery("");
                    }}
                  >
                    {ex.name}
                  </button>
                ))
              ) : (
                <p className="empty-copy">No exercises match.</p>
              )}
            </div>
          )}
          <div className="mt-5">
            {items.map((item, i) => (
              <article
                key={`${item.exerciseId}-${i}`}
                className="builder-exercise"
              >
                <div className="section-row">
                  <h3>{item.exerciseName}</h3>
                  <button
                    type="button"
                    className="row-action"
                    aria-label={`Remove ${item.exerciseName}`}
                    onClick={() =>
                      setItems((rows) => rows.filter((_, index) => index !== i))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="field-row">
                  {[
                    ["sets", "Sets", 1, 20],
                    ["reps", "Reps", 1, 1000],
                    ["targetWeightKg", "Weight (kg)", 0, 1500],
                    ["restSec", "Rest (sec)", 0, 600],
                  ].map(([field, label, min, max]) => (
                    <label className="numeric-field" key={field}>
                      {label}
                      <input
                        className="fp-input"
                        type="number"
                        min={Number(min)}
                        max={Number(max)}
                        step={field === "targetWeightKg" ? "any" : 1}
                        required
                        value={item[field as keyof Item]}
                        onChange={(e) =>
                          update(i, field as keyof Item, Number(e.target.value))
                        }
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
            {!items.length && (
              <p className="logger-empty">
                Add movements to define sets, reps, load and rest.
              </p>
            )}
          </div>
          {error && (
            <div className="form-feedback" role="alert">
              {error}
            </div>
          )}
          <button
            className="primary-action mt-5"
            disabled={save.isPending}
            type="submit"
          >
            <Plus size={17} />
            {save.isPending ? "Saving template…" : "Save new template"}
          </button>
        </form>
        <div className="page-stack">
          <form className="page-section" onSubmit={assignSession}>
            <h2>Assign a saved session</h2>
            <p>
              AI weeks approved in your review queue are available as templates
              here.
            </p>
            {templates.isError ? (
              <div className="form-feedback">
                Templates could not load.{" "}
                <button type="button" onClick={() => templates.refetch()}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <label className="fp-label mt-5" htmlFor="saved-template">
                  Saved template
                </label>
                <select
                  id="saved-template"
                  className="fp-input"
                  value={templateId}
                  required
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    setAssigned(false);
                  }}
                >
                  <option value="">
                    {templates.isLoading
                      ? "Loading templates…"
                      : "Choose a session"}
                  </option>
                  {templates.data?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="template-preview">
                    <strong>{selectedTemplate.title}</strong>
                    <ul>
                      {selectedTemplate.items.map((item, i) => (
                        <li key={i}>
                          <span>
                            {typeof item.exerciseId === "string"
                              ? items.find(
                                  (x) => x.exerciseId === item.exerciseId,
                                )?.exerciseName || "Exercise"
                              : item.exerciseId.name}
                          </span>
                          <span>
                            {item.sets} × {item.reps}
                            {item.targetWeightKg != null
                              ? ` · ${item.targetWeightKg} kg`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            <fieldset className="mt-5">
              <legend className="fp-label">Assign to athletes</legend>
              {athletes.isLoading ? (
                <p role="status">Loading athletes…</p>
              ) : athletes.isError ? (
                <p className="field-error">
                  Athletes could not load.{" "}
                  <button type="button" onClick={() => athletes.refetch()}>
                    Retry
                  </button>
                </p>
              ) : athletes.data?.athletes.length ? (
                athletes.data.athletes.map(({ athlete }) => (
                  <label key={athlete._id} className="athlete-choice">
                    <input
                      type="checkbox"
                      checked={selectedAthletes.includes(athlete._id)}
                      onChange={() => {
                        setSelectedAthletes((rows) =>
                          rows.includes(athlete._id)
                            ? rows.filter((id) => id !== athlete._id)
                            : [...rows, athlete._id],
                        );
                        setAssigned(false);
                      }}
                    />
                    {athlete.name}
                  </label>
                ))
              ) : (
                <p className="section-note">
                  No active athletes yet. Invite an athlete from Team overview.
                </p>
              )}
            </fieldset>
            <label className="fp-label mt-5" htmlFor="assign-date">
              Session date
            </label>
            <input
              id="assign-date"
              className="fp-input"
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setAssigned(false);
              }}
            />
            {assignError && (
              <div className="form-feedback" role="alert">
                {assignError}
              </div>
            )}
            {assigned && (
              <p className="assignment-success" role="status">
                <Check size={17} />
                {selectedTemplate?.title} assigned to {selectedAthletes.length}{" "}
                {selectedAthletes.length === 1 ? "athlete" : "athletes"} on{" "}
                {new Date(date + "T12:00:00").toLocaleDateString()}.
              </p>
            )}
            <button
              className="primary-action mt-5"
              type="submit"
              disabled={assign.isPending || assigned}
            >
              {assign.isPending
                ? "Assigning…"
                : assigned
                  ? "Assigned"
                  : "Assign session"}
            </button>
          </form>
          <section className="page-section">
            <h2>Your template library</h2>
            <p>{templates.data?.length || 0} reusable sessions</p>
            <ul className="data-list mt-3">
              {templates.data?.map((t) => (
                <li key={t._id}>
                  <div className="section-row">
                    <div>
                      <strong>{t.title}</strong>
                      <p>
                        {t.items.length} exercises ·{" "}
                        {t.items.reduce((n, i) => n + i.sets, 0)} sets
                      </p>
                    </div>
                    <button
                      className="row-action"
                      onClick={() => {
                        setTemplateId(t._id);
                        setAssigned(false);
                        document.getElementById("saved-template")?.focus();
                      }}
                    >
                      Select
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {!templates.isLoading && !templates.data?.length && (
              <p className="empty-copy">
                Save your first session on the left, or approve an athlete’s AI
                draft.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
