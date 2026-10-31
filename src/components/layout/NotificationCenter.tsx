import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X, Circle, Check } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
type Notice = {
  _id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};
export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const queries = useQueryClient();
  const navigate = useNavigate();
  const query = useInfiniteQuery({
    queryKey: ["notifications", user?._id, unread],
    initialPageParam: null as string | null,
    enabled: !!user,
    queryFn: async ({ pageParam }) =>
      (
        await api.get("/notifications", {
          params: { unread, before: pageParam || undefined },
        })
      ).data.data,
    getNextPageParam: (page: any) => page.nextCursor || undefined,
    refetchInterval: 30000,
  });
  const count = query.data?.pages[0]?.unreadCount || 0;
  const items: Notice[] =
    query.data?.pages.flatMap((page: any) => page.items) || [];
  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        bell.current?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const mark = async (item: Notice, read = true) => {
    queries.setQueriesData(
      { queryKey: ["notifications", user?._id] },
      (old: any) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                unreadCount: Math.max(
                  0,
                  page.unreadCount +
                    (item.readAt ? (read ? 0 : 1) : read ? -1 : 0),
                ),
                items: page.items.map((row: Notice) =>
                  row._id === item._id
                    ? { ...row, readAt: read ? new Date().toISOString() : null }
                    : row,
                ),
              })),
            }
          : old,
    );
    try {
      await api.patch(`/notifications/${item._id}`, { read });
    } catch {
      toast.error("Notification status could not be saved");
    } finally {
      queries.invalidateQueries({ queryKey: ["notifications", user?._id] });
    }
  };
  const all = async () => {
    setBusy(true);
    try {
      await api.post("/notifications/read-all");
      await queries.invalidateQueries({
        queryKey: ["notifications", user?._id],
      });
    } catch {
      toast.error("Notifications could not be updated");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="notification-center" ref={root}>
      <button
        type="button"
        ref={bell}
        className="header-icon notification-bell"
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen(!open)}
      >
        <Bell size={20} />
        {count > 0 && (
          <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
        )}
      </button>
      {open && (
        <section
          id="notification-panel"
          className="notification-panel"
          aria-label="Your notifications"
        >
          <header>
            <div>
              <h2 ref={heading} tabIndex={-1}>
                Notifications
              </h2>
              <p>{count ? `${count} unread updates` : "You’re up to date"}</p>
            </div>
            <button
              className="header-icon"
              aria-label="Close notifications"
              onClick={() => {
                setOpen(false);
                bell.current?.focus();
              }}
            >
              <X size={18} />
            </button>
          </header>
          <div className="notification-toolbar">
            <div>
              <button aria-pressed={!unread} onClick={() => setUnread(false)}>
                All
              </button>
              <button aria-pressed={unread} onClick={() => setUnread(true)}>
                Unread
              </button>
            </div>
            <button disabled={busy || !count} onClick={all}>
              <CheckCheck size={16} />
              {busy ? "Updating…" : "Mark all read"}
            </button>
          </div>
          <div className="notification-list">
            {query.isLoading ? (
              <p className="notification-empty" role="status">
                Loading your updates…
              </p>
            ) : query.isError ? (
              <div className="notification-empty">
                <p>Updates couldn’t be loaded.</p>
                <button onClick={() => query.refetch()}>Retry</button>
              </div>
            ) : items.length ? (
              <ul>
                {items.map((item) => (
                  <li key={item._id} className={item.readAt ? "" : "unread"}>
                    <button
                      className="notification-open"
                      onClick={() => {
                        if (!item.readAt) mark(item);
                        setOpen(false);
                        navigate(
                          item.href.startsWith("/") &&
                            !item.href.startsWith("//")
                            ? item.href
                            : "/",
                        );
                      }}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </button>
                    <button
                      className="notification-read-toggle"
                      aria-label={
                        item.readAt
                          ? `Mark ${item.title} as unread`
                          : `Mark ${item.title} as read`
                      }
                      onClick={() => mark(item, !item.readAt)}
                    >
                      {item.readAt ? <Check size={15} /> : <Circle size={12} />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="notification-empty">
                <Bell size={25} />
                <h3>
                  {unread ? "All caught up." : "Your updates will be here."}
                </h3>
                <p>
                  Assigned sessions, coach invitations and training reviews
                  appear automatically.
                </p>
              </div>
            )}
            {query.hasNextPage && (
              <button
                className="notification-more"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? "Loading…" : "Load earlier updates"}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
