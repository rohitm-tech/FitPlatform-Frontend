import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

type AthleteCard = {
  _id: string;
  name: string;
  linkStatus: "none" | "invited" | "active" | "ended";
  offer: string;
  paid: boolean;
  profile: {
    goal: string;
    experienceLevel: string;
    trainingDaysPerWeek: number | null;
    sports: string[];
    city: string;
    area: string;
    about: string;
    trainingSetting: string;
    languages: string[];
    availability: string;
    budgetMonthlyInr: number | null;
  };
};

const GOAL: Record<string, string> = {
  muscle_gain: "Muscle gain",
  fat_loss: "Fat loss",
  strength: "Strength",
  general_fitness: "General fitness",
  race: "Race",
};

const SETTING: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  either: "In person or online",
};

export default function CoachExplorePage() {
  const queries = useQueryClient();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState("");
  const [text, setText] = useState("I can train you.");
  const list = useQuery({
    queryKey: ["coach-explore"],
    queryFn: async () =>
      (await api.get("/coach/explore")).data.data.athletes as AthleteCard[],
  });
  const offer = useMutation({
    mutationFn: async (athleteId: string) =>
      (await api.post(`/coach/explore/${athleteId}/offer`, { text: text.trim() }))
        .data.data,
    onSuccess: () => {
      toast.success("Offer sent. They can accept it in account settings.");
      setOpenId("");
      setText("I can train you.");
      queries.invalidateQueries({ queryKey: ["coach-explore"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "The offer could not be sent."),
  });
  const needle = search.trim().toLowerCase();
  const rows = (list.data || []).filter((athlete) => {
    if (!needle) return true;
    const profile = athlete.profile;
    return [athlete.name, profile.city, profile.area, profile.about, ...(profile.sports || [])]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="product-page">
      <div className="page-greeting">
        <div>
          <h1>Athletes</h1>
          <p>See interests, then offer to train someone who is not on your team yet.</p>
        </div>
      </div>
      <label className="athlete-search explore-search">
        <Search size={16} />
        <input
          aria-label="Search athletes"
          value={search}
          placeholder="Search by name, sport or city"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      {list.isLoading && <p className="panel-body">Loading athletes…</p>}
      {list.isError && (
        <div className="product-alert">
          Athletes could not be loaded.{" "}
          <button type="button" onClick={() => list.refetch()}>
            Retry
          </button>
        </div>
      )}
      {!list.isLoading && !rows.length && (
        <p className="panel-body">No athletes match that search.</p>
      )}
      <ul className="explore-list">
        {rows.map((athlete) => {
          const place = [athlete.profile.area, athlete.profile.city]
            .filter(Boolean)
            .join(", ");
          return (
            <li key={athlete._id} className="explore-card">
              <div>
                <h2>{athlete.name}</h2>
                <p>
                  {[
                    place,
                    GOAL[athlete.profile.goal],
                    athlete.profile.experienceLevel,
                    athlete.profile.trainingDaysPerWeek
                      ? `${athlete.profile.trainingDaysPerWeek} days / week`
                      : "",
                    SETTING[athlete.profile.trainingSetting],
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Interests not added yet"}
                </p>
                {!!athlete.profile.sports.length && (
                  <p>{athlete.profile.sports.join(", ")}</p>
                )}
                {athlete.profile.about && <p>{athlete.profile.about}</p>}
                {(athlete.profile.languages.length > 0 ||
                  athlete.profile.availability ||
                  athlete.profile.budgetMonthlyInr != null) && (
                  <p>
                    {[
                      athlete.profile.languages.join(", "),
                      athlete.profile.availability,
                      athlete.profile.budgetMonthlyInr != null
                        ? `Budget ₹${athlete.profile.budgetMonthlyInr}/month`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <div className="explore-actions">
                {athlete.linkStatus === "active" ? (
                  <Link to={`/coach/athletes/${athlete._id}`}>
                    {athlete.paid ? "Open paid dashboard" : "Open dashboard"}
                    <ArrowUpRight size={15} />
                  </Link>
                ) : athlete.linkStatus === "invited" && openId !== athlete._id ? (
                  <p>Offer sent{athlete.offer ? `: ${athlete.offer}` : ""}</p>
                ) : openId === athlete._id ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (text.trim()) offer.mutate(athlete._id);
                    }}
                  >
                    <label>
                      Message
                      <textarea
                        className="fp-input"
                        value={text}
                        maxLength={500}
                        required
                        onChange={(event) => setText(event.target.value)}
                      />
                    </label>
                    <div>
                      <button className="primary-action" disabled={offer.isPending}>
                        {offer.isPending ? "Sending…" : "Send offer"}
                      </button>
                      <button type="button" onClick={() => setOpenId("")}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => {
                      setOpenId(athlete._id);
                      setText(athlete.offer || "I can train you.");
                    }}
                  >
                    Offer to train
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
