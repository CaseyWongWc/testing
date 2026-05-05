export default function MetaShop() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(129,140,248,0.08),_transparent_60%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">07 · Meta Shop · Scrap</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[60vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Scrap is the only currency that matters.
        </h2>
        <p className="mt-[2vh] font-body text-[1.4vw] text-muted leading-relaxed max-w-[55vw]">
          Earned from kills, evacuations, and the final grade. Spent on gear that lasts one run, or perks that last forever.
        </p>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[44vh] grid grid-cols-2 gap-[3vw]">
        <div>
          <div className="font-display text-[1.2vw] tracking-[0.3em] text-amber uppercase border-b border-amber/30 pb-[1vh]">Gear · per run</div>
          <div className="mt-[2vh] flex flex-col gap-[1.4vh]">
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Pistol Cache</span><span className="text-muted">drops at spawn</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Shotgun Cache</span><span className="text-muted">heavy hitter</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Medkit</span><span className="text-muted">+50 HP pickup</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Extra Survivor</span><span className="text-muted">+1 body in the field</span></div>
          </div>
        </div>
        <div>
          <div className="font-display text-[1.2vw] tracking-[0.3em] text-emerald uppercase border-b border-emerald/30 pb-[1vh]">Perks · permanent</div>
          <div className="mt-[2vh] flex flex-col gap-[1.4vh]">
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Iron Will</span><span className="text-muted">+HP per level</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Scrap Magnet</span><span className="text-muted">multiplier on rewards</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Quick Hands</span><span className="text-muted">faster attacks</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Sharp Senses</span><span className="text-muted">faster move + retarget</span></div>
            <div className="flex items-baseline justify-between font-body text-[1.5vw]"><span className="text-text">Starter Cache</span><span className="text-muted">flat scrap every run</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
