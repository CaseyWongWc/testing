const base = import.meta.env.BASE_URL;

export default function LiveSim() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(52,211,153,0.10),_transparent_55%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">03 · Live Simulator</span>
      </div>

      <div className="absolute left-[6vw] top-[15vh] w-[36vw]">
        <h2 className="font-display font-bold text-[3.6vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          The shop sets the run.
        </h2>
        <p className="mt-[2.5vh] font-body text-[1.5vw] text-muted leading-relaxed [text-wrap:pretty]">
          Between runs, the survivor market is the only place you have a voice. Pick your gear, level your perks, hit start.
        </p>
        <div className="mt-[3vh] flex flex-col gap-[1.4vh]">
          <div className="flex items-center gap-[1vw]">
            <span className="w-[0.6vw] h-[0.6vw] bg-primary rounded-full" />
            <span className="font-body text-[1.3vw] text-text">Gear is per-run, perks are permanent</span>
          </div>
          <div className="flex items-center gap-[1vw]">
            <span className="w-[0.6vw] h-[0.6vw] bg-emerald rounded-full" />
            <span className="font-body text-[1.3vw] text-text">Scrap carries over between runs</span>
          </div>
          <div className="flex items-center gap-[1vw]">
            <span className="w-[0.6vw] h-[0.6vw] bg-amber rounded-full" />
            <span className="font-body text-[1.3vw] text-text">Save state lives in the browser</span>
          </div>
        </div>
      </div>

      <div className="absolute right-[6vw] top-[15vh] w-[48vw] h-[60vh] rounded-[0.6vw] overflow-hidden border border-line bg-bg-2 flex items-center justify-center">
        <img
          src={`${base}sim-shot.jpg`}
          crossOrigin="anonymous"
          alt="A Forgotten Place — survivor market screenshot"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="absolute right-[6vw] bottom-[5vh] font-body text-[1vw] text-muted tracking-wide">
        Survivor Market — between-run loadout
      </div>
    </div>
  );
}
