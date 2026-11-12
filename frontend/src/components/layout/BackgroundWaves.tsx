/**
 * Solid organic wave band across the bottom of the app.
 *
 * Two solid teal layers anchored to the bottom edge: a darker back crest and
 * the main accent color in front — tall on the left, tapering organically to
 * the right. The SVG stretches to fill its container
 * (preserveAspectRatio="none"), so the composition always spans the full
 * window width, from the very left edge to the very right edge.
 *
 * No animation, no gradients, no transparency washes.
 * pointer-events: none + aria-hidden.
 */
export function BackgroundWaves() {
  return (
    <div className="background-waves" aria-hidden="true">
      <svg viewBox="0 0 1440 180" preserveAspectRatio="none">
        {/* Back crest — darker teal, solid */}
        <path
          className="wave-back"
          d="M0 58 C220 72 460 94 760 114 C1010 130 1250 142 1440 148 L1440 180 L0 180 Z"
        />
        {/* Front crest — main accent teal, solid */}
        <path
          className="wave-front"
          d="M0 104 C240 114 500 132 820 146 C1060 155 1280 162 1440 168 L1440 180 L0 180 Z"
        />
      </svg>
    </div>
  );
}
