import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-400">
        That link may have moved. Head home to find your workspace.
      </p>
      <Link to="/" className="text-sm underline">
        Back home
      </Link>
    </div>
  );
}
