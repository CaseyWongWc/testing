export default function NightBonus() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,30,80,0.55),_transparent_60%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">09 · Night Bonus Economy</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[60vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Night kills pay more, on purpose.
        </h2>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[40vh]">
        <div className="bg-bg-2 border border-primary/40 rounded-[0.4vw] px-[3vw] py-[3.5vh]">
          <div className="font-display text-[1vw] tracking-[0.3em] text-primary uppercase">Formula</div>
          <div className="mt-[1.5vh] font-display text-[2.6vw] text-text leading-tight [text-wrap:balance]">
            round( (nightKills × 2 + nightEvacuations × 5) × scrapMultiplier )
          </div>
        </div>

        <div className="mt-[3vh] grid grid-cols-3 gap-[2vw]">
          <div>
            <div className="font-display font-bold text-[3.5vw] text-amber leading-none">+1</div>
            <div className="mt-[1vh] font-body text-[1.25vw] text-muted">Day kill — base scrap only.</div>
          </div>
          <div>
            <div className="font-display font-bold text-[3.5vw] text-primary leading-none">+3</div>
            <div className="mt-[1vh] font-body text-[1.25vw] text-muted">Night kill — base +1, night bonus +2.</div>
          </div>
          <div>
            <div className="font-display font-bold text-[3.5vw] text-emerald leading-none">+5</div>
            <div className="mt-[1vh] font-body text-[1.25vw] text-muted">Night evacuation — survivors home before dawn.</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] left-[6vw] right-[6vw] flex items-center justify-between border-t border-line pt-[1.8vh]">
        <span className="font-body text-[1.05vw] text-muted">Live HUD pill shows the running bonus during a run.</span>
        <span className="font-display text-[1.05vw] text-accent tracking-wide">computeNightBonus()</span>
      </div>
    </div>
  );
}
