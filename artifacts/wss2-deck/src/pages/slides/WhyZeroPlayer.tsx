export default function WhyZeroPlayer() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(129,140,248,0.10)_0%,_transparent_50%)]" />
      <div className="absolute right-0 top-0 h-full w-[42vw] bg-bg-2/60" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">02 · Why Zero-Player</span>
      </div>

      <div className="absolute left-[6vw] top-[22vh] max-w-[44vw]">
        <h2 className="font-display font-bold text-[4.5vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          The player is the meta-strategist, not the pilot.
        </h2>
        <p className="mt-[3vh] font-body text-[1.6vw] text-muted leading-relaxed [text-wrap:pretty] max-w-[40vw]">
          You don't aim, dodge, or click. You decide what your survivors carry into the dark — then you watch.
        </p>
      </div>

      <div className="absolute right-[6vw] top-[22vh] w-[34vw] flex flex-col gap-[2.2vh]">
        <div className="flex items-baseline gap-[1.5vw] border-b border-line pb-[1.8vh]">
          <span className="font-display font-bold text-[3vw] text-primary leading-none w-[3.5vw]">01</span>
          <div>
            <div className="font-display text-[1.5vw] text-text">Buy gear and perks</div>
            <div className="font-body text-[1.2vw] text-muted mt-[0.4vh]">Spend scrap between runs.</div>
          </div>
        </div>
        <div className="flex items-baseline gap-[1.5vw] border-b border-line pb-[1.8vh]">
          <span className="font-display font-bold text-[3vw] text-primary leading-none w-[3.5vw]">02</span>
          <div>
            <div className="font-display text-[1.5vw] text-text">Press start</div>
            <div className="font-body text-[1.2vw] text-muted mt-[0.4vh]">The AI takes the wheel.</div>
          </div>
        </div>
        <div className="flex items-baseline gap-[1.5vw] pb-[1.8vh]">
          <span className="font-display font-bold text-[3vw] text-primary leading-none w-[3.5vw]">03</span>
          <div>
            <div className="font-display text-[1.5vw] text-text">Watch and learn</div>
            <div className="font-body text-[1.2vw] text-muted mt-[0.4vh]">Bad loadouts get people killed.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
