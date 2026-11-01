import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import "./community.css";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="person-mark" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

type Author = { _id: string; name: string };

type AthleteCard = Author & {
  sports: string[];
  city: string;
  shared: string[];
};

type AthleteDirectory = { you: { sports: string[] }; athletes: AthleteCard[] };

type Post = {
  _id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  liked: boolean;
  author: Author;
};

type Reply = { _id: string; body: string; createdAt: string; author: Author };

type ThreadSummary = {
  _id: string;
  other: Author;
  lastMessageAt: string;
  preview: string;
};

type ChatMessage = { _id: string; body: string; createdAt: string; mine: boolean };

type PlanProfile = { plan: string };

const when = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

function failure(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) return error.response?.data?.message || fallback;
  return fallback;
}

function upgrade(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 402;
}

export default function CommunityPage() {
  const billing = useQuery({
    queryKey: ["billing-me"],
    queryFn: async () => (await api.get("/billing/me")).data.data as PlanProfile,
  });
  const [tab, setTab] = useState<"feed" | "messages">("feed");
  const premium = billing.data?.plan === "premium";

  return (
    <div className="product-page community-page">
      <h1>Community</h1>
      <p>A feed and direct messages for athletes. The feed is part of Premium.</p>
      {billing.isLoading && <p className="page-state">Loading your plan…</p>}
      {billing.isError && (
        <div className="page-state page-state-error">
          <h2>Your plan could not be loaded</h2>
          <button type="button" onClick={() => billing.refetch()}>
            Retry
          </button>
        </div>
      )}
      {billing.data && (
        <>
          <div className="community-tabs" role="tablist" aria-label="Community">
            <button type="button" role="tab" aria-selected={tab === "feed"} onClick={() => setTab("feed")}>
              Feed
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "messages"}
              onClick={() => setTab("messages")}
            >
              Messages
            </button>
          </div>
          {tab === "feed" ? (
            premium ? <Feed /> : <LockedFeed />
          ) : (
            <Messages premium={Boolean(premium)} />
          )}
        </>
      )}
    </div>
  );
}

function LockedFeed() {
  return (
    <div className="page-state">
      <h2>The feed is part of Premium</h2>
      <p>Premium athletes can post, reply, and like. You can still read a message if another athlete writes to you.</p>
      <Link to="/settings?section=plan">View plans</Link>
    </div>
  );
}

function Feed() {
  const cache = useQueryClient();
  const [body, setBody] = useState("");
  const posts = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => (await api.get("/community/posts")).data.data.posts as Post[],
  });
  const publish = useMutation({
    mutationFn: async (text: string) => (await api.post("/community/posts", { body: text })).data.data as Post,
    onSuccess: async () => {
      setBody("");
      await cache.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim() || publish.isPending) return;
    publish.mutate(body.trim());
  };

  return (
    <section className="community-column" aria-label="Feed">
      <form className="composer" onSubmit={submit}>
        <label htmlFor="community-post">Share something with the community</label>
        <textarea
          id="community-post"
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="A session, a route, or a question for other athletes"
        />
        <button className="primary-action" type="submit" disabled={!body.trim() || publish.isPending}>
          {publish.isPending ? "Posting…" : "Post"}
        </button>
        {publish.isError && (
          <p className="field-error" role="alert">
            {failure(publish.error, "That post could not be published.")}
            {upgrade(publish.error) && (
              <>
                {" "}
                <Link to="/settings?section=plan">View plans</Link>
              </>
            )}
          </p>
        )}
      </form>
      {posts.isLoading && <p className="page-state">Loading the feed…</p>}
      {posts.isError && (
        <div className="page-state page-state-error">
          <h2>The feed could not be loaded</h2>
          <p>{failure(posts.error, "Try again.")}</p>
          {upgrade(posts.error) && <Link to="/settings?section=plan">View plans</Link>}
          <button type="button" onClick={() => posts.refetch()}>
            Retry
          </button>
        </div>
      )}
      {posts.data && posts.data.length === 0 && (
        <div className="page-state">
          <h2>No posts yet</h2>
          <p>Be the first to write to other premium athletes.</p>
        </div>
      )}
      <div className="feed-list">
        {posts.data?.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}

function PostCard({ post }: { post: Post }) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [replyCount, setReplyCount] = useState(post.replyCount);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setLiked(post.liked);
    setLikeCount(post.likeCount);
    setReplyCount(post.replyCount);
  }, [post.liked, post.likeCount, post.replyCount]);

  const replies = useQuery({
    queryKey: ["community-replies", post._id],
    queryFn: async () =>
      (await api.get(`/community/posts/${post._id}/replies`)).data.data.replies as Reply[],
    enabled: open,
  });
  const like = useMutation({
    mutationFn: async () =>
      (await api.post(`/community/posts/${post._id}/like`)).data.data as { liked: boolean; likeCount: number },
    onSuccess: (result) => {
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    },
    onError: (error) => toast.error(failure(error, "Could not update the like")),
  });
  const reply = useMutation({
    mutationFn: async (text: string) =>
      (await api.post(`/community/posts/${post._id}/replies`, { body: text })).data.data as Reply,
    onSuccess: async () => {
      setDraft("");
      setReplyCount((count) => count + 1);
      setOpen(true);
      await cache.invalidateQueries({ queryKey: ["community-replies", post._id] });
    },
  });

  return (
    <article className="feed-card">
      <header className="feed-person">
        <Avatar name={post.author.name} />
        <div>
          <strong>{post.author.name}</strong>
          <time dateTime={post.createdAt}>{when(post.createdAt)}</time>
        </div>
      </header>
      <p>{post.body}</p>
      <div className="feed-actions">
        <button
          type="button"
          aria-pressed={liked}
          disabled={like.isPending}
          onClick={() => like.mutate()}
        >
          {liked ? "Liked" : "Like"}
          <span>{likeCount}</span>
        </button>
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {replyCount === 1 ? "1 reply" : `${replyCount} replies`}
        </button>
      </div>
      {open && (
        <div className="reply-list">
          {replies.isLoading && <p>Loading replies…</p>}
          {replies.isError && (
            <button type="button" onClick={() => replies.refetch()}>
              Retry replies
            </button>
          )}
          {replies.data?.map((item) => (
            <div className="reply" key={item._id}>
              <Avatar name={item.author.name} />
              <div>
                <strong>{item.author.name}</strong>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
          <form
            className="reply-box"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim() || reply.isPending) return;
              reply.mutate(draft.trim());
            }}
          >
            <label className="sr-only" htmlFor={`reply-${post._id}`}>
              Reply to {post.author.name}
            </label>
            <textarea
              id={`reply-${post._id}`}
              maxLength={2000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a reply"
            />
            <button className="secondary-action" type="submit" disabled={!draft.trim() || reply.isPending}>
              {reply.isPending ? "Replying…" : "Reply"}
            </button>
            {reply.isError && (
              <p className="field-error" role="alert">
                {failure(reply.error, "That reply could not be posted.")}
              </p>
            )}
          </form>
        </div>
      )}
    </article>
  );
}

function Messages({ premium }: { premium: boolean }) {
  const cache = useQueryClient();
  const [active, setActive] = useState("");
  const [compose, setCompose] = useState<AthleteCard | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const threads = useQuery({
    queryKey: ["community-threads"],
    queryFn: async () => (await api.get("/community/threads")).data.data.threads as ThreadSummary[],
  });
  const directory = useQuery({
    queryKey: ["community-athletes", q],
    queryFn: async () =>
      (await api.get("/community/athletes", { params: q ? { q } : {} })).data.data as AthleteDirectory,
    enabled: premium,
  });

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (premium) return;
    if (!active && threads.data?.[0]) setActive(threads.data[0]._id);
  }, [premium, active, threads.data]);

  const threadFor = new Map(threads.data?.map((thread) => [thread.other._id, thread._id]) ?? []);
  const yours = directory.data?.you.sports ?? [];
  const athletes = (directory.data?.athletes ?? []).filter((athlete) => !sport || athlete.sports.includes(sport));
  const same = athletes.filter((athlete) => athlete.shared.length > 0);
  const others = athletes.filter((athlete) => athlete.shared.length === 0);
  const browsing = premium && !active && !compose;

  function openAthlete(athlete: AthleteCard) {
    const threadId = threadFor.get(athlete._id);
    if (threadId) {
      setCompose(null);
      setActive(threadId);
      return;
    }
    setActive("");
    setCompose(athlete);
  }

  return (
    <div className="messages-shell">
      {premium && (
        <div className="event-tools">
          <label className="explore-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search athletes"
              value={search}
              placeholder="Search by name, sport or city"
              onChange={(event) => {
                setSearch(event.target.value);
                if (event.target.value.trim()) {
                  setSport("");
                  setActive("");
                  setCompose(null);
                }
              }}
            />
          </label>
          {yours.length > 0 && (
            <div className="choice-row" role="group" aria-label="Filter by sport">
              <button type="button" aria-pressed={sport === ""} onClick={() => setSport("")}>
                All
              </button>
              {yours.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={sport === name}
                  onClick={() => {
                    setSport(name);
                    setActive("");
                    setCompose(null);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="messages-layout">
        <aside>
          <h2>Conversations</h2>
          {threads.isLoading && <p className="page-state">Loading messages…</p>}
          {threads.isError && (
            <div className="page-state page-state-error">
              <h2>Messages could not be loaded</h2>
              <button type="button" onClick={() => threads.refetch()}>
                Retry
              </button>
            </div>
          )}
          {threads.data && threads.data.length === 0 && (
            <p className="empty-copy">
              {premium
                ? "Your conversations show up here."
                : "When a premium athlete messages you, the conversation shows up here."}
            </p>
          )}
          <ul className="thread-list">
            {threads.data?.map((thread) => (
              <li key={thread._id}>
                <button
                  type="button"
                  className={thread._id === active ? "is-active" : ""}
                  aria-current={thread._id === active ? "true" : undefined}
                  onClick={() => {
                    setCompose(null);
                    setActive(thread._id);
                  }}
                >
                  <Avatar name={thread.other.name} />
                  <span className="thread-copy">
                    <strong>{thread.other.name}</strong>
                    <span>{thread.preview}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        {active ? (
          <Conversation
            threadId={active}
            onSent={() => cache.invalidateQueries({ queryKey: ["community-threads"] })}
          />
        ) : compose ? (
          <FirstMessage
            athlete={compose}
            onCancel={() => setCompose(null)}
            onStarted={(threadId) => {
              setCompose(null);
              setActive(threadId);
            }}
          />
        ) : browsing ? (
          <AthleteDirectory
            loading={directory.isLoading}
            error={directory.isError}
            onRetry={() => directory.refetch()}
            sport={sport}
            same={same}
            others={sport ? [] : others}
            listed={athletes}
            threadFor={threadFor}
            onOpen={openAthlete}
          />
        ) : (
          threads.data && threads.data.length > 0 && <p className="page-state">Choose a conversation.</p>
        )}
      </div>
    </div>
  );
}

function AthleteDirectory({
  loading,
  error,
  onRetry,
  sport,
  same,
  others,
  listed,
  threadFor,
  onOpen,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  sport: string;
  same: AthleteCard[];
  others: AthleteCard[];
  listed: AthleteCard[];
  threadFor: Map<string, string>;
  onOpen: (athlete: AthleteCard) => void;
}) {
  if (loading) return <p className="page-state">Loading athletes…</p>;
  if (error) {
    return (
      <div className="page-state page-state-error">
        <h2>Athletes could not be loaded</h2>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  if (listed.length === 0) {
    return (
      <div className="page-state">
        <h2>No athletes match</h2>
        <p>Try another name, sport, or city.</p>
      </div>
    );
  }
  return (
    <div className="athlete-board">
      {sport || same.length === 0 ? (
        <DirectorySection
          title={sport || "Athletes"}
          athletes={listed}
          threadFor={threadFor}
          onOpen={onOpen}
        />
      ) : (
        <>
          <DirectorySection title="Same sports" athletes={same} threadFor={threadFor} onOpen={onOpen} />
          {others.length > 0 && (
            <DirectorySection title="Other athletes" athletes={others} threadFor={threadFor} onOpen={onOpen} />
          )}
        </>
      )}
    </div>
  );
}

function DirectorySection({
  title,
  athletes,
  threadFor,
  onOpen,
}: {
  title: string;
  athletes: AthleteCard[];
  threadFor: Map<string, string>;
  onOpen: (athlete: AthleteCard) => void;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <ul className="directory-list">
        {athletes.map((athlete) => (
          <li key={athlete._id} className="directory-row">
            <Avatar name={athlete.name} />
            <div className="thread-copy">
              <strong>{athlete.name}</strong>
              <span>{athlete.sports.length ? athlete.sports.join(", ") : "Athlete"}</span>
              {athlete.city && <span>{athlete.city}</span>}
            </div>
            <button type="button" onClick={() => onOpen(athlete)}>
              {threadFor.has(athlete._id) ? "Open" : "Message"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FirstMessage({
  athlete,
  onCancel,
  onStarted,
}: {
  athlete: AthleteCard;
  onCancel: () => void;
  onStarted: (threadId: string) => void;
}) {
  const cache = useQueryClient();
  const [body, setBody] = useState("");
  const start = useMutation({
    mutationFn: async () =>
      (
        await api.post("/community/threads", { athleteId: athlete._id, body: body.trim() })
      ).data.data as { thread: ThreadSummary },
    onSuccess: async (result) => {
      setBody("");
      await cache.invalidateQueries({ queryKey: ["community-threads"] });
      onStarted(result.thread._id);
    },
  });

  return (
    <form
      className="composer-panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim() || start.isPending) return;
        start.mutate();
      }}
    >
      <header className="feed-person">
        <Avatar name={athlete.name} />
        <div>
          <h2>{athlete.name}</h2>
          <p>{athlete.sports.length ? athlete.sports.join(", ") : "Athlete"}</p>
        </div>
      </header>
      <label className="sr-only" htmlFor="first-message">
        First message to {athlete.name}
      </label>
      <textarea
        id="first-message"
        maxLength={2000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write the first message"
      />
      <div className="event-form-actions">
        <button className="primary-action" type="submit" disabled={!body.trim() || start.isPending}>
          {start.isPending ? "Sending…" : "Send"}
        </button>
        <button className="secondary-action" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {start.isError && (
        <p className="field-error" role="alert">
          {failure(start.error, "That message could not be sent.")}
          {upgrade(start.error) && (
            <>
              {" "}
              <Link to="/settings?section=plan">View plans</Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}

function Conversation({ threadId, onSent }: { threadId: string; onSent: () => void }) {
  const cache = useQueryClient();
  const [body, setBody] = useState("");
  const thread = useQuery({
    queryKey: ["community-thread", threadId],
    queryFn: async () =>
      (await api.get(`/community/threads/${threadId}`)).data.data as {
        other: Author;
        messages: ChatMessage[];
      },
  });
  const send = useMutation({
    mutationFn: async (text: string) =>
      (await api.post(`/community/threads/${threadId}/messages`, { body: text })).data.data,
    onSuccess: async () => {
      setBody("");
      await cache.invalidateQueries({ queryKey: ["community-thread", threadId] });
      onSent();
    },
  });

  if (thread.isLoading) return <p className="page-state">Loading the conversation…</p>;
  if (thread.isError) {
    return (
      <div className="page-state page-state-error">
        <h2>This conversation could not be loaded</h2>
        <button type="button" onClick={() => thread.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="conversation" aria-label={`Messages with ${thread.data?.other.name}`}>
      <header className="feed-person">
        <Avatar name={thread.data?.other.name || "Athlete"} />
        <h2>{thread.data?.other.name}</h2>
      </header>
      <ol>
        {thread.data?.messages.map((message) => (
          <li key={message._id} className={message.mine ? "mine" : ""}>
            <p>{message.body}</p>
            <time dateTime={message.createdAt}>{when(message.createdAt)}</time>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!body.trim() || send.isPending) return;
          send.mutate(body.trim());
        }}
      >
        <label className="sr-only" htmlFor="thread-reply">
          Message {thread.data?.other.name}
        </label>
        <textarea
          id="thread-reply"
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message"
        />
        <button className="primary-action" type="submit" disabled={!body.trim() || send.isPending}>
          {send.isPending ? "Sending…" : "Send"}
        </button>
      </form>
      {send.isError && (
        <p className="field-error" role="alert">
          {failure(send.error, "That message could not be sent.")}
        </p>
      )}
    </section>
  );
}
