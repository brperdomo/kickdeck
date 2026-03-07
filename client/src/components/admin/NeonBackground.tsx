/**
 * NeonBackground — Retro arcade / Miami Vice / Nightstalker ambient animation
 *
 * Renders behind all dashboard content at z-index:1.
 * All content panels (nav, sidebar, main) sit at z-index:2+.
 * Uses pure CSS keyframes for performance (composited on GPU via transform/opacity).
 */

export function NeonBackground() {
  return (
    <div
      className="neon-bg-container"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* ── Gradient mesh: slowly drifting color blobs ── */}
      <div className="neon-bg-blob neon-bg-blob--violet" />
      <div className="neon-bg-blob neon-bg-blob--cyan" />
      <div className="neon-bg-blob neon-bg-blob--pink" />
      <div className="neon-bg-blob neon-bg-blob--orange" />

      {/* ── Horizontal light streaks (arcade scanner lines) ── */}
      <div className="neon-bg-streak neon-bg-streak--1" />
      <div className="neon-bg-streak neon-bg-streak--2" />
      <div className="neon-bg-streak neon-bg-streak--3" />

      {/* ── Vertical accent beam ── */}
      <div className="neon-bg-beam" />

      {/* ── Horizon glow (Miami sunset line) ── */}
      <div className="neon-bg-horizon" />
    </div>
  );
}
