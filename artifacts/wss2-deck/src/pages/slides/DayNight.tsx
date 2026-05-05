export default function DayNight() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(135deg,_rgba(251,191,36,0.10),_transparent_70%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(225deg,_rgba(20,30,80,0.55),_transparent_75%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">06 · Day / Night Cycle</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[60vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Daylight is mercy. Night is the test.
        </h2>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[42vh] grid grid-cols-2 gap-[3vw]">
        <div className="border-l-[0.4vw] border-amber pl-[2vw]">
          <div className="font-display text-[1.2vw] tracking-[0.3em] text-amber uppercase">Day</div>
          <div className="mt-[1vh] font-display font-bold text-[3vw] text-text leading-none">600 ticks</div>
          <p className="mt-[2vh] font-body text-[1.4vw] text-muted leading-relaxed [text-wrap:pretty]">
            Long sightlines. Zombies are lazy. Survivors travel light and pick fights they can win.
          </p>
        </div>
        <div className="border-l-[0.4vw] border-primary pl-[2vw]">
          <div className="font-display text-[1.2vw] tracking-[0.3em] text-primary uppercase">Night</div>
          <div className="mt-[1vh] font-display font-bold text-[3vw] text-text leading-none">400 ticks</div>
          <p className="mt-[2vh] font-body text-[1.4vw] text-muted leading-relaxed [text-wrap:pretty]">
            Indigo overlay. Zombies up to 1.6× more alert. A survivor's flashlight is the only safe ground.
          </p>
        </div>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-center justify-between border-t border-line pt-[2vh]">
        <span className="font-body text-[1.1vw] text-muted">Cycle is fixed-tick — same on every run, deterministic to debug.</span>
        <span className="font-display text-[1.1vw] text-accent tracking-wide">DAY_LENGTH · NIGHT_LENGTH</span>
      </div>
    </div>
  );
}
