import LibraryEditor from "../../components/common/LibraryEditor";

import { useEffect, useState } from "react";

import toast from "react-hot-toast";

import { api } from "../../services/api";

type Person = { _id: string; name: string; email: string; roles: string[] };

export default function AdminHome() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [users, setUsers] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = () =>
    api
      .get("/admin/users")
      .then((r) => setUsers(r.data.data))
      .catch(() => setError("Could not load accounts. Try again."));

  useEffect(() => {
    load();
    api
      .get("/admin/gyms")
      .then((r) => setGyms(r.data.data))
      .catch(() => setError("Could not load gyms"));
  }, []);

  const grant = async (user: Person, role: string) => {
    setBusy(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/roles`, {
        roles: user.roles.includes(role)
          ? (user.roles.filter((r) => r !== role).length?user.roles.filter((r) => r !== role):["athlete"])
          : [...user.roles, role],
      });
      toast.success("Account access updated");
      await load();
    } catch {
      toast.error("Could not update access");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">
        Platform management
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        Manage trusted access. Every new account begins as an athlete; approve
        coaches and gym owners here.
      </p>
      <label className="fp-label mt-8" htmlFor="account-search">
        Find an account
      </label>
      <input
        id="account-search"
        className="fp-input max-w-md"
        placeholder="Search name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <div className="mt-6 space-y-3">
        {users
          .filter((u) =>
            `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
          )
          .map((u) => (
            <article
              key={u._id}
              className="fp-surface flex flex-wrap items-center justify-between gap-4 rounded-xl p-5"
            >
              <div>
                <h2 className="font-semibold">{u.name}</h2>
                <p className="text-sm text-slate-400">{u.email}</p>
                <p className="mt-2 text-xs text-emerald-400">
                  {u.roles.join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["coach", "gym_owner"].map((role) => (
                  <button
                    disabled={busy === u._id}
                    key={role}
                    onClick={() => grant(u, role)}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    {u.roles.includes(role) ? "Remove" : "Grant"}{" "}
                    {role.replace("_", " ")} access
                  </button>
                ))}
              </div>
            </article>
          ))}
      </div>
      <section className="mt-10 border-t pt-8">
        <h2 className="text-xl font-semibold">Gyms</h2>
        {gyms.map((g) => (
          <div
            className="mt-4 flex flex-wrap justify-between gap-2 border-b py-3"
            key={g._id}
          >
            <span>{g.name}</span>
            <span className="text-sm text-slate-400">
              {g.ownerId?.name} · {g.address || "No address added"}
            </span>
          </div>
        ))}
      </section>
      <LibraryEditor />
    </div>
  );
}
