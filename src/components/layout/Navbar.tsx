import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  Settings,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { useAuth, roleHomePath } from "../../hooks/useAuth";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/authSlice";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationCenter } from "./NotificationCenter";
import "../../header.css";
export const Navbar = () => {
  const { isAuthenticated, user, activeRole } = useAuth();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [tools, setTools] = useState(false);
  const [account, setAccount] = useState(false);
  const root = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const auth = pathname.startsWith("/auth/");
  const publicPage = pathname === "/";
  useEffect(() => {
    setMobile(false);
    setTools(false);
    setAccount(false);
  }, [pathname]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setTools(false);
        setAccount(false);
        setMobile(false);
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTools(false);
        setAccount(false);
        if (mobile) {
          setMobile(false);
          menu.current?.focus();
        }
      }
    };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [mobile]);
  const logout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };
  const links =
    activeRole === "coach"
      ? [
          ["/coach", "Team"],
          ["/coach/builder", "Builder"],
          ["/marketplace", "Marketplace"],
        ]
      : activeRole === "gym_owner"
        ? [
            ["/gym", "Gym overview"],
            ["/marketplace", "Marketplace"],
          ]
        : activeRole === "admin"
          ? [
              ["/admin", "Platform"],
              ["/marketplace", "Marketplace"],
            ]
          : [
              ["/athlete", "My day"],
              ["/athlete/history", "Training"],
              ["/athlete/companion", "AI coach"],
              ["/coaches", "Find a coach"],
              ["/marketplace", "Marketplace"],
            ];
  const extra =
    activeRole === "athlete"
      ? [
          ["/athlete/recovery", "Recovery"],
          ["/athlete/insights", "Progress"],
          ["/athlete/explorer", "Muscle explorer"],
          ["/exercises", "Exercise library"],
        ]
      : [
          ...(activeRole === "coach"
            ? [["/coach/profile", "Public coach profile"]]
            : []),
          ["/coaches", "Find a coach"],
          ["/exercises", "Exercise library"],
          ["/marketplace/manage", "Manage listings"],
          ["/marketplace/requests", "Marketplace requests"],
        ];
  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <header className={`app-header ${auth ? "auth-header" : ""}`} ref={root}>
      <div className="header-inner">
        <Link
          className="header-brand"
          to={
            isAuthenticated && !publicPage
              ? roleHomePath(activeRole || "athlete")
              : "/"
          }
        >
          fitplatform<span>.</span>
        </Link>
        {auth ? (
          <div className="header-auth-switch">
            <span>
              {pathname === "/auth/sign-up"
                ? "Already have an account?"
                : "New to FitPlatform?"}
            </span>
            <Link
              to={
                pathname === "/auth/sign-up" ? "/auth/sign-in" : "/auth/sign-up"
              }
            >
              {pathname === "/auth/sign-up" ? "Sign in" : "Create account"}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <nav
              className="header-desktop-nav"
              aria-label={
                isAuthenticated && !publicPage
                  ? "Workspace"
                  : "About FitPlatform"
              }
            >
              {isAuthenticated && !publicPage ? (
                <>
                  {links.map(([to, label]) => (
                    <NavLink end key={to} to={to}>
                      {label}
                    </NavLink>
                  ))}
                  <div className="header-disclosure">
                    <button
                      className={
                        extra.some(([to]) => pathname === to) ? "active" : ""
                      }
                      aria-expanded={tools}
                      aria-controls="training-tools"
                      onClick={() => {
                        setTools(!tools);
                        setAccount(false);
                      }}
                    >
                      {activeRole === "athlete" ? "Explore" : "Tools"}
                      <ChevronDown size={13} />
                    </button>
                    {tools && (
                      <nav
                        id="training-tools"
                        className="header-dropdown"
                        aria-label="More workspace tools"
                      >
                        {extra.map(([to, label]) => (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={() => setTools(false)}
                          >
                            {label}
                            <ArrowUpRight size={14} />
                          </NavLink>
                        ))}
                      </nav>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <a href="/#workflow">How it works</a>
                  <a href="/#features">The platform</a>
                  <NavLink to="/coaches">Find a coach</NavLink>
                  <NavLink to="/marketplace">Marketplace</NavLink>
                </>
              )}
            </nav>
            <div className="header-right">
              {isAuthenticated ? (
                <>
                  {publicPage && (
                    <Link
                      className="header-workspace-link"
                      to={roleHomePath(activeRole || "athlete")}
                    >
                      My workspace
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
                  <NotificationCenter />
                  <div className="header-account">
                    <button
                      className="account-menu-trigger"
                      aria-label={`Open account menu for ${user?.name}`}
                      aria-expanded={account}
                      aria-controls="account-menu"
                      onClick={() => {
                        setAccount(!account);
                        setTools(false);
                      }}
                    >
                      <span className="header-avatar">{initials}</span>
                      <ChevronDown size={13} />
                    </button>
                    {account && (
                      <section
                        className="header-dropdown account-dropdown"
                        id="account-menu"
                        aria-label="Your account"
                      >
                        <div className="account-menu-identity">
                          <strong>{user?.name}</strong>
                          <span>{user?.email}</span>
                          <small>
                            {activeRole?.replace("_", " ")} workspace
                          </small>
                        </div>
                        <RoleSwitcher />
                        <Link to="/settings" onClick={() => setAccount(false)}>
                          <Settings size={16} />
                          Account & settings
                        </Link>
                        <Link
                          to="/marketplace/requests"
                          onClick={() => setAccount(false)}
                        >
                          My marketplace requests
                        </Link>
                        <Link
                          to="/marketplace/payments"
                          onClick={() => setAccount(false)}
                        >
                          Payments & receipts
                        </Link>
                        <button onClick={logout}>
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </section>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link className="header-sign-in" to="/auth/sign-in">
                    Sign in
                  </Link>
                  <Link className="header-sign-up" to="/auth/sign-up">
                    Get started
                    <ArrowUpRight size={15} />
                  </Link>
                </>
              )}
              <button
                ref={menu}
                className="header-icon header-mobile-toggle"
                aria-label={mobile ? "Close navigation" : "Open navigation"}
                aria-expanded={mobile}
                aria-controls="mobile-navigation"
                onClick={() => setMobile(!mobile)}
              >
                {mobile ? <X size={21} /> : <Menu size={21} />}
              </button>
            </div>
          </>
        )}
      </div>
      {mobile && !auth && (
        <nav
          id="mobile-navigation"
          className="mobile-navigation"
          aria-label="Mobile navigation"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setMobile(false);
          }}
        >
          {isAuthenticated ? (
            <>
              <div className="mobile-account">
                <span className="header-avatar">{initials}</span>
                <div>
                  <strong>{user?.name}</strong>
                  <small>{activeRole?.replace("_", " ")} workspace</small>
                </div>
              </div>
              <RoleSwitcher />
              {links.map(([to, label]) => (
                <NavLink end key={to} to={to}>
                  {label}
                </NavLink>
              ))}
              {extra.map(([to, label]) => (
                <NavLink key={to} to={to}>
                  {label}
                </NavLink>
              ))}
              <Link to="/settings">
                <Settings size={17} />
                Account & settings
              </Link>
              <button onClick={logout}>
                <LogOut size={17} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <a href="/#workflow">How it works</a>
              <a href="/#features">The platform</a>
              <Link to="/coaches">Find a coach</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/auth/sign-in">Sign in</Link>
              <Link to="/auth/sign-up">Create account</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
};
