export default function WhatsNext() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(52,211,153,0.10),_transparent_60%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">11 · What's Next</span>
      </div>

      <div className="absolute left-[6vw] top-[20vh] max-w-[60vw]">
        <h2 className="font-display font-bold text-[4.5vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          The roadmap, after the presentation.
        </h2>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[48vh] grid grid-cols-3 gap-[2.5vw]">
        <div className="border-t border-primary pt-[2vh]">
          <div className="font-display text-[1.1vw] tracking-[0.3em] text-primary uppercase">Soon</div>
          <div className="mt-[1.2vh] font-display text-[2vw] text-text leading-tight">Spotted indicator</div>
          <p className="mt-[1.2vh] font-body text-[1.2vw] text-muted leading-relaxed">A small visual cue on any survivor a zombie has line of sight on.</p>
        </div>
        <div className="border-t border-emerald pt-[2vh]">
          <div className="font-display text-[1.1vw] tracking-[0.3em] text-emerald uppercase">Next</div>
          <div className="mt-[1.2vh] font-display text-[2vw] text-text leading-tight">More perks</div>
          <p className="mt-[1.2vh] font-body text-[1.2vw] text-muted leading-relaxed">Push the meta loop past five perks, with synergies that change loadouts.</p>
        </div>
        <div className="border-t border-amber pt-[2vh]">
          <div className="font-display text-[1.1vw] tracking-[0.3em] text-amber uppercase">Later</div>
          <div className="mt-[1.2vh] font-display text-[2vw] text-text leading-tight">Balance pass</div>
          <p className="mt-[1.2vh] font-body text-[1.2vw] text-muted leading-relaxed">Tune zombie tier weights, scrap costs, and night intensity from real runs.</p>
        </div>
      </div>
    </div>
  );
}
