import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Search, Bookmark } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { categories, ListingCard } from "./marketplaceShared";
import type { Listing } from "./marketplaceShared";
import "../../marketplace.css";
export default function MarketplacePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cache = useQueryClient();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recent");
  const [onlySaved, setOnlySaved] = useState(false);
  const [saving, setSaving] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const catalogue = useQuery({
    queryKey: ["marketplace", category, q, page, sort],
    queryFn: async () =>
      (await api.get("/marketplace", { params: { category, q, page, sort } }))
        .data.data,
    enabled: !onlySaved,
  });
  const saved = useQuery({
    queryKey: ["marketplace-saved", user?._id],
    queryFn: async () => (await api.get("/marketplace/saved")).data.data,
    enabled: !!user,
  });
  const savedIds = new Set<string>(
    saved.data?.map((row: any) => row.listingId._id) || [],
  );
  const rows: Listing[] = onlySaved
    ? (saved.data || [])
        .map((row: any) => row.listingId)
        .filter(
          (listing: Listing) =>
            (category === "all" || listing.category === category) &&
            `${listing.title} ${listing.summary}`
              .toLowerCase()
              .includes(q.toLowerCase()),
        )
    : catalogue.data?.listings || [];
  const save = async (listing: Listing) => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in", { state: { from: location } });
      return;
    }
    if (saving) return;
    setSaving(listing._id);
    try {
      await api.post(`/marketplace/listings/${listing._id}/save`, {
        saved: !savedIds.has(listing._id),
      });
      await cache.invalidateQueries({
        queryKey: ["marketplace-saved", user?._id],
      });
    } catch {
      toast.error("Saved listing could not be updated");
    } finally {
      setSaving("");
    }
  };
  const loading = onlySaved ? saved.isLoading : catalogue.isLoading;
  const error = onlySaved ? saved.isError : catalogue.isError;
  const provider = user?.roles.some((role) =>
    ["coach", "gym_owner", "admin"].includes(role),
  );
  return (
    <div className="product-page marketplace-page">
      <div className="page-greeting">
        <div>
          <h1>Find your next step.</h1>
          <p>
            Coach-made plans, personal support and the essentials around your
            training.
          </p>
        </div>
        <div className="header-actions">
          {isAuthenticated && (
            <Link className="secondary-action" to="/marketplace/requests">
              My requests
            </Link>
          )}
          {provider && (
            <Link className="secondary-action" to="/marketplace/manage">
              {user?.roles.includes("admin")
                ? "Review listings"
                : "Provider workspace"}
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </div>
      <div className="marketplace-intro">
        <div>
          <h2>
            A plan is a starting point.
            <br />
            Find the support to follow it.
          </h2>
          <p>
            Explore the catalogue. Ask the provider about fit and availability
            before making a commitment.
          </p>
        </div>
        <Link
          to="/marketplace?focus=plans"
          onClick={(e) => {
            e.preventDefault();
            setCategory("plan");
            setPage(1);
            document.getElementById("marketplace-results")?.focus();
          }}
        >
          Explore training plans
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <nav
        className="marketplace-categories"
        aria-label="Marketplace categories"
      >
        {categories.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={category === key}
            onClick={() => {
              setCategory(key);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="marketplace-toolbar">
        <label>
          <Search size={17} />
          <input
            type="search"
            aria-label="Search marketplace"
            placeholder="Search plans, coaching and more"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div>
          {user && (
            <button
              className={onlySaved ? "selected" : ""}
              aria-pressed={onlySaved}
              onClick={() => setOnlySaved(!onlySaved)}
            >
              <Bookmark size={16} />
              Saved
            </button>
          )}
          <label className="sr-only" htmlFor="market-sort">
            Sort listings
          </label>
          <select
            id="market-sort"
            value={sort}
            disabled={onlySaved}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="recent">Recently added</option>
            <option value="price">Price: low to high</option>
          </select>
        </div>
      </div>
      <section
        id="marketplace-results"
        tabIndex={-1}
        aria-label="Marketplace results"
      >
        {loading ? (
          <div className="page-state" role="status">
            Loading the catalogue…
          </div>
        ) : error ? (
          <div className="page-state page-state-error">
            <h2>The catalogue couldn’t be loaded.</h2>
            <button
              onClick={() =>
                onlySaved ? saved.refetch() : catalogue.refetch()
              }
            >
              Retry
            </button>
          </div>
        ) : rows.length ? (
          <>
            <div className="marketplace-grid">
              {rows.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  saved={savedIds.has(listing._id)}
                  onSave={save}
                />
              ))}
            </div>
            {!onlySaved && catalogue.data && (
              <div className="list-pagination">
                <span>
                  {(page - 1) * 12 + 1}–
                  {Math.min(page * 12, catalogue.data.total)} of{" "}
                  {catalogue.data.total} listings
                </span>
                <div>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous
                  </button>
                  <button
                    disabled={page * 12 >= catalogue.data.total}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="page-state market-empty">
            <h2>
              {onlySaved
                ? "Your saved finds will be here."
                : category === "meal"
                  ? "Meal partners are being reviewed."
                  : category === "supplement"
                    ? "Seller review comes first."
                    : "Nothing matches just yet."}
            </h2>
            <p>
              {onlySaved
                ? "Save a listing to return to it later."
                : ["meal", "supplement"].includes(category)
                  ? "Food and supplement listings need an admin licence review before they appear here."
                  : "Try another category or search."}
            </p>
            <button
              onClick={() => {
                setCategory("all");
                setSearch("");
                setOnlySaved(false);
                setPage(1);
              }}
            >
              Explore the catalogue
            </button>
          </div>
        )}
      </section>
      <p className="marketplace-boundary">
        Demo listings are marked. The provider accepts your request first. You
        can then pay through secure checkout when payments are enabled. No
        automatic subscriptions are started.
      </p>
    </div>
  );
}
