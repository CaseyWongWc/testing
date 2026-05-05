export default function ZombieVariants() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.08),_transparent_55%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">05 · Zombie Variants</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[60vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Three threats. Different math.
        </h2>
        <p className="mt-[2vh] font-body text-[1.4vw] text-muted leading-relaxed [text-wrap:pretty] max-w-[55vw]">
          Spawns are tier-weighted, so early runs are mostly walkers and late runs get nasty fast.
        </p>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[44vh] grid grid-cols-3 gap-[2vw]">
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2.5vh]">
          <div className="font-display text-[1.1vw] tracking-[0.3em] text-muted uppercase">Tier 1</div>
          <div className="mt-[1vh] font-display font-bold text-[2.6vw] text-text">Walker</div>
          <div className="mt-[2vh] font-body text-[1.25vw] text-muted leading-relaxed">
            <div>Slow. Weak. Numerous.</div>
            <div>Short LOS, low hearing.</div>
            <div>The standard threat.</div>
          </div>
        </div>
        <div className="bg-bg-2 border border-amber/40 rounded-[0.4vw] p-[2.5vh]">
          <div className="font-display text-[1.1vw] tracking-[0.3em] text-amber uppercase">Tier 2</div>
          <div className="mt-[1vh] font-display font-bold text-[2.6vw] text-text">Runner</div>
          <div className="mt-[2vh] font-body text-[1.25vw] text-muted leading-relaxed">
            <div>Fast. Fragile.</div>
            <div>Wide line of sight.</div>
            <div>Closes the gap before you can shoot.</div>
          </div>
        </div>
        <div className="bg-bg-2 border border-primary/40 rounded-[0.4vw] p-[2.5vh]">
          <div className="font-display text-[1.1vw] tracking-[0.3em] text-primary uppercase">Tier 3</div>
          <div className="mt-[1vh] font-display font-bold text-[2.6vw] text-text">Brute</div>
          <div className="mt-[2vh] font-body text-[1.25vw] text-muted leading-relaxed">
            <div>Slow. Huge HP pool.</div>
            <div>Big body, hard to miss.</div>
            <div>Eats whole magazines.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
