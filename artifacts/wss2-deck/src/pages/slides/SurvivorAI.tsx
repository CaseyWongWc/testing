export default function SurvivorAI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(129,140,248,0.10),_transparent_55%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">04 · Survivor AI</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[80vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Six states. One priority list.
        </h2>
        <p className="mt-[2vh] font-body text-[1.4vw] text-muted leading-relaxed max-w-[60vw]">
          Every tick, each survivor re-picks a state from the top down. Self-preservation comes first; chores come last.
        </p>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[44vh] grid grid-cols-3 gap-[1.6vw] gap-y-[2vh]">
        <div className="bg-bg-2 border border-amber/40 rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-amber uppercase">Priority 1</div>
          <div className="mt-[0.8vh] font-display text-[1.7vw] text-text">Fleeing</div>
          <p className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">Low HP and a zombie nearby. Sprint away.</p>
        </div>
        <div className="bg-bg-2 border border-primary/40 rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-primary uppercase">Priority 2</div>
          <div className="mt-[0.8vh] font-display text-[1.7vw] text-text">Evacuating</div>
          <p className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">Objective done. Head for the rift portal.</p>
        </div>
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-text uppercase">Priority 3</div>
          <div className="mt-[0.8vh] font-display text-[1.7vw] text-text">Fighting</div>
          <p className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">Zombie in range and HP says yes. Hold and shoot.</p>
        </div>
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-text uppercase">Priority 4</div>
          <div className="mt-[0.8vh] font-display text-[1.7vw] text-text">Rescuing</div>
          <p className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">Teammate is down. Move to revive.</p>
        </div>
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-text uppercase">Priority 5</div>
          <div className="mt-[0.8vh] font-display text-[1.7vw] text-text">Activating</div>
          <p className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">Path is clear. Push the run's objective.</p>
        </div>
        <div className="bg-bg-2 border border-emerald/40 rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-emerald uppercase">Priority 6</div>
          <div className="mt-[0.8vh] font-display text-[1.7vw] text-text">Scavenging</div>
          <p className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">Nothing urgent. Grab loot and weapons.</p>
        </div>
      </div>

      <div className="absolute bottom-[3vh] left-[6vw] right-[6vw] flex items-center justify-between border-t border-line pt-[1.4vh]">
        <span className="font-body text-[1vw] text-muted">Re-evaluated every tick — survivors switch states the moment conditions change.</span>
        <span className="font-display text-[1vw] text-accent tracking-wide">chooseSurvivorAI()</span>
      </div>
    </div>
  );
}
