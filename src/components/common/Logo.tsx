// The brand mark: a pulse/heartbeat line, echoing the Activity icon already
// used throughout recovery/readiness UI. Kept as one inline component so the
// mark and wordmark always travel together and stay in sync if either changes.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="112" fill="#77518b" />
      <path
        d="M80 256H170L200 170L230 340L260 256H432"
        fill="none"
        stroke="#ffffff"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`brand-logo ${className}`}>
      <LogoMark size={size} />
      rhythm<span>.</span>
    </span>
  );
}
