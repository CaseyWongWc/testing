export default function Pitch() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(129,140,248,0.18),_transparent_60%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">01 · The Pitch</span>
      </div>

      <div className="absolute left-[6vw] top-[20vh] max-w-[58vw]">
        <h2 className="font-display font-bold text-[5.5vw] leading-[1.0] tracking-tight text-text [text-wrap:balance]">
          Survivors fight zombies.
          <span className="block text-primary mt-[1.5vh]">You don't.</span>
        </h2>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[10vh] grid grid-cols-3 gap-[2.5vw]">
        <div className="border-t border-primary/60 pt-[2vh]">
          <div className="font-display text-[1.3vw] text-primary uppercase tracking-[0.2em]">The Sim</div>
          <p className="mt-[1.5vh] font-body text-[1.6vw] text-text leading-snug">
            A small band of survivors holds a ruined map against waves of the dead.
          </p>
        </div>
        <div className="border-t border-emerald/60 pt-[2vh]">
          <div className="font-display text-[1.3vw] text-emerald uppercase tracking-[0.2em]">The Player</div>
          <p className="mt-[1.5vh] font-body text-[1.6vw] text-text leading-snug">
            You are the quartermaster, not the trigger finger. You buy gear and perks between runs.
          </p>
        </div>
        <div className="border-t border-amber/60 pt-[2vh]">
          <div className="font-display text-[1.3vw] text-amber uppercase tracking-[0.2em]">The Hook</div>
          <p className="mt-[1.5vh] font-body text-[1.6vw] text-text leading-snug">
            Watch your choices play out. Win, lose, or watch them fall — then try again.
          </p>
        </div>
      </div>
    </div>
  );
}
