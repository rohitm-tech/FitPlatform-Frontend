import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-2xl font-semibold">Page not found</p>
      <Link to="/" className="text-sm underline">
        Back home
      </Link>
    </div>
  );
}
