import { useEffect, useState } from "react";

import { api } from "../../services/api";

import toast from "react-hot-toast";

export default function LibraryEditor() {
  const [kind, setKind] = useState("exercises");
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSelected(null);
    api
      .get(kind === "exercises" ? "/exercises?limit=100" : "/muscles")
      .then((r) =>
        setRows(kind === "exercises" ? r.data.data.exercises : r.data.data),
      )
      .catch(() => toast.error("Could not load library"));
  }, [kind]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body =
        kind === "exercises"
          ? {
              name: selected.name,
              difficulty: selected.difficulty,
              instructions: selected.instructions,
            }
          : {
              displayName: selected.displayName,
              description: selected.description,
              meshNames: selected.meshNames,
            };
      await api.patch(`/admin/${kind}/${selected._id}`, body);
      setRows(rows.map((r) => (r._id === selected._id ? selected : r)));
      toast.success("Library updated");
    } catch {
      toast.error("Could not save changes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="text-xl font-semibold">Training library</h2>
      <div className="my-4 flex gap-3">
        <button
          onClick={() => setKind("exercises")}
          className="rounded-lg border px-4 py-2"
        >
          Exercises
        </button>
        <button
          onClick={() => setKind("muscles")}
          className="rounded-lg border px-4 py-2"
        >
          Muscles
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="library-search" className="fp-label">
            Search {kind}
          </label>
          <input
            id="library-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="fp-input"
          />
          <div className="mt-3 max-h-80 overflow-auto">
            {rows
              .filter((r) =>
                (r.name || r.displayName)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((r) => (
                <button
                  key={r._id}
                  className="block w-full border-b px-3 py-3 text-left text-sm"
                  onClick={() => setSelected({ ...r })}
                >
                  {r.name || r.displayName}
                </button>
              ))}
          </div>
        </div>
        {selected ? (
          <form onSubmit={save} className="fp-surface space-y-4 rounded-xl p-5">
            <h3 className="font-semibold">
              Edit {kind === "exercises" ? "exercise" : "muscle"}
            </h3>
            <label className="fp-label" htmlFor="library-name">
              Name
            </label>
            <input
              id="library-name"
              required
              className="fp-input"
              value={selected.name || selected.displayName}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  [kind === "exercises" ? "name" : "displayName"]:
                    e.target.value,
                })
              }
            />
            {kind === "exercises" ? (
              <>
                <label className="fp-label" htmlFor="difficulty">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  className="fp-input"
                  value={selected.difficulty}
                  onChange={(e) =>
                    setSelected({ ...selected, difficulty: e.target.value })
                  }
                >
                  {["beginner", "intermediate", "advanced"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <label htmlFor="instructions" className="fp-label">
                  Instructions (one step per line)
                </label>
                <textarea
                  id="instructions"
                  rows={5}
                  className="fp-input"
                  value={selected.instructions.join("\n")}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      instructions: e.target.value.split("\n"),
                    })
                  }
                />
              </>
            ) : (
              <>
                <label htmlFor="description" className="fp-label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="fp-input"
                  value={selected.description}
                  onChange={(e) =>
                    setSelected({ ...selected, description: e.target.value })
                  }
                />
                <label htmlFor="meshes" className="fp-label">
                  Mesh names (comma separated)
                </label>
                <input
                  id="meshes"
                  className="fp-input"
                  value={selected.meshNames.join(",")}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      meshNames: e.target.value.split(",").map((x) => x.trim()),
                    })
                  }
                />
              </>
            )}
            <button disabled={busy} className="rounded-lg px-4 py-2">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </form>
        ) : (
          <p className="py-10 text-sm text-slate-400">
            Select a library entry to edit it.
          </p>
        )}
      </div>
    </section>
  );
}
