import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth, roleHomePath } from "../../hooks/useAuth";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/authSlice";
import { RoleSwitcher } from "./RoleSwitcher";

export const Navbar = () => {
  const { isAuthenticated, user, activeRole } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <header
      className="product-nav"
      style={{ borderColor: "var(--fp-border)" }}
    >
      <Link
        to={isAuthenticated ? roleHomePath(activeRole ?? "athlete") : "/"}
        className="product-brand"
      >
        fitplatform<span>.</span>
      </Link>
      {isAuthenticated && (
        <nav aria-label="Workspace" className="workspace-nav">
          {(activeRole === "athlete"
            ? [
                ["/athlete", "My day"],
                ["/athlete/recovery", "Recovery"],
                ["/athlete/history", "Training"],
                ["/athlete/insights", "Progress"],
                ["/athlete/explorer", "Muscle explorer"],
                ["/exercises", "Exercises"],
              ]
            : activeRole === "coach"
              ? [
                  ["/coach", "Team overview"],
                  ["/coach/builder", "Workout builder"],
                ]
              : activeRole === "gym_owner"
                ? [["/gym", "Gym operations"]]
                : [["/admin", "Access management"]]
          ).map(([to, label]) => (
            <NavLink end key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      <div className="account-actions">
        {isAuthenticated ? (
          <>
            <RoleSwitcher />
            <Link to="/settings" className="text-sm">
              Settings
            </Link>
            <div className="account-name"><span className="account-avatar">{user?.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</span><span>{user?.name}<small>{activeRole?.replace('_',' ')} workspace</small></span></div>
            <button
              className="logout-control"
              style={{ borderColor: "var(--fp-border)" }}
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/sign-in" className="text-sm">
              Sign in
            </Link>
            <Link
              to="/auth/sign-up"
              className="logout-control"
              style={{ borderColor: "var(--fp-border)" }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
