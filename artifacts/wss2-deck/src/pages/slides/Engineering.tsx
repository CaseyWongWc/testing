export default function Engineering() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(129,140,248,0.10),_transparent_55%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">10 · Engineering</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[55vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Spec-driven, self-testing.
        </h2>
        <p className="mt-[2.5vh] font-body text-[1.45vw] text-muted leading-relaxed max-w-[50vw] [text-wrap:pretty]">
          The night-bonus formula has one source of truth, and a dev-time self-test that throws if it ever drifts. The HUD label, the run-end breakdown, and the docs all read from the same constant.
        </p>
      </div>

      <div className="absolute right-[6vw] top-[20vh] w-[34vw]">
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2.5vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-emerald uppercase">If formula drifts</div>
          <div className="mt-[1.5vh] font-display text-[1.6vw] text-text leading-snug [text-wrap:balance]">
            The app refuses to load.
          </div>
          <div className="mt-[1vh] font-body text-[1.2vw] text-muted">No silent regressions. Bug caught at startup, not in a run.</div>
        </div>
        <div className="mt-[2vh] bg-bg-2 border border-line rounded-[0.4vw] p-[2.5vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-primary uppercase">One source of truth</div>
          <div className="mt-[1.5vh] font-display text-[1.6vw] text-text leading-snug [text-wrap:balance]">
            Formula → HUD → docs.
          </div>
          <div className="mt-[1vh] font-body text-[1.2vw] text-muted">Change the constant once. Every label updates with it.</div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] left-[6vw] right-[6vw] flex items-center justify-between border-t border-line pt-[1.8vh]">
        <span className="font-body text-[1.05vw] text-muted">Phase 2 stays frozen as a stable backup. Phase 3 is the live build.</span>
        <span className="font-display text-[1.05vw] text-accent tracking-wide">WSSPhase3.tsx</span>
      </div>
    </div>
  );
}
