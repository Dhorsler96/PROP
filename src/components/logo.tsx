/**
 * Tendril wordmark. Interim typeset version in Instrument Sans until the drawn logo
 * (Figma node 97:874) is exported; swap the <svg> body for those paths when it is.
 * Single colour, follows the current text colour.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 112 28" fill="none" role="img" aria-label="Tendril" className={className}>
      <text
        x="0"
        y="22"
        fill="currentColor"
        style={{ fontFamily: "var(--font-instrument), ui-sans-serif, system-ui", fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em" }}
      >
        Tendril
      </text>
    </svg>
  );
}
