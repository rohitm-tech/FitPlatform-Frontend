import PricingDesk from "./PricingDesk";

import { useEffect, useState } from "react";

import toast from "react-hot-toast";

import { api } from "../../services/api";

type Person = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  plan?: "free" | "premium";
};

const ROLE_FILTERS = [
  { id: "all", label: "All" },
  { id: "athlete", label: "Athletes" },
  { id: "coach", label: "Coaches" },
  { id: "gym_owner", label: "Gyms" },
  { id: "admin", label: "Admins" },
] as const;

const roleLabel = (role: string) =>
  ({ athlete: "Athlete", coach: "Coach", gym_owner: "Gym owner", admin: "Admin" })[role] || role;

export default function AdminHome() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [users, setUsers] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]["id"]>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setError("");
    try {
      const [accounts, gymsResult] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/gyms"),
      ]);
      setUsers(accounts.data.data);
      setGyms(gymsResult.data.data);
    } catch {
      setError("Accounts could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = users.filter((person) => {
    const matchesRole = roleFilter === "all" || person.roles.includes(roleFilter);
    const matchesSearch = `${person.name} ${person.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesRole && matchesSearch;
  });

  const grant = async (user: Person, role: string) => {
    setBusy(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/roles`, {
        roles: user.roles.includes(role)
          ? user.roles.filter((r) => r !== role).length
            ? user.roles.filter((r) => r !== role)
            : ["athlete"]
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
    <div className="product-page admin-page">
      <h1 className="font-display text-3xl font-semibold">
        Platform management
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        Set what each plan costs and what the platform keeps. Earnings are split by athletes,
        coaches, gyms, and the marketplace. Amounts are in rupees.
      </p>
      <PricingDesk />
      <div className="account-toolbar">
        <div>
          <h2>Accounts</h2>
          <div className="platform-tabs" role="tablist" aria-label="Filter accounts by role">
            {ROLE_FILTERS.map((filter) => {
              const count =
                filter.id === "all"
                  ? users.length
                  : users.filter((person) => person.roles.includes(filter.id)).length;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={roleFilter === filter.id}
                  onClick={() => setRoleFilter(filter.id)}
                >
                  {filter.label}
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <label className="fp-label" htmlFor="account-search">
          Find an account
          <input
            id="account-search"
            className="fp-input"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {error && (
        <div className="form-feedback" role="alert">
          {error}
          <button className="row-action" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {loading && (
        <p className="page-state mt-6" role="status">
          Loading accounts…
        </p>
      )}
      {!loading && visible.length === 0 && (
        <p className="empty-copy">No accounts match this filter.</p>
      )}
      <div className="mt-6 space-y-3">
        {visible.map((u) => (
            <article
              key={u._id}
              className="fp-surface flex flex-wrap items-center justify-between gap-4 rounded-xl p-5"
            >
              <div>
                <h2 className="font-semibold">{u.name}</h2>
                <p className="text-sm text-slate-400">{u.email}</p>
                <p className="account-meta">
                  <span>{u.roles.map(roleLabel).join(" · ")}</span>
                  {u.roles.includes("athlete") && (
                    <span className={`account-plan ${u.plan === "premium" ? "is-premium" : ""}`}>
                      {u.plan === "premium" ? "Premium" : "Free"}
                    </span>
                  )}
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
        {!loading && !gyms.length && (
          <p className="empty-copy">
            No gyms have been provisioned yet. Grant gym-owner access to create
            one.
          </p>
        )}
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
    </div>
  );
}
