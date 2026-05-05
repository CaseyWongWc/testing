export default function Perks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(52,211,153,0.08),_transparent_60%)]" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <span className="font-display text-[1.1vw] tracking-[0.4em] text-muted uppercase">08 · The Five Perks</span>
      </div>

      <div className="absolute left-[6vw] top-[18vh] max-w-[60vw]">
        <h2 className="font-display font-bold text-[4vw] leading-[1.05] tracking-tight text-text [text-wrap:balance]">
          Five perks. Every one of them stacks.
        </h2>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[42vh] grid grid-cols-5 gap-[1.5vw]">
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1.5vw] text-text">Iron Will</div>
          <div className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">+10% max HP per level</div>
          <div className="mt-[2vh] font-display text-[1.05vw] text-amber tracking-wider">3 LEVELS</div>
        </div>
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1.5vw] text-text">Scrap Magnet</div>
          <div className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">+10% scrap per level, multiplier</div>
          <div className="mt-[2vh] font-display text-[1.05vw] text-amber tracking-wider">3 LEVELS</div>
        </div>
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1.5vw] text-text">Quick Hands</div>
          <div className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">−8% attack cooldown per level</div>
          <div className="mt-[2vh] font-display text-[1.05vw] text-amber tracking-wider">3 LEVELS</div>
        </div>
        <div className="bg-bg-2 border border-line rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1.5vw] text-text">Sharp Senses</div>
          <div className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">+5% move speed, smarter retargets</div>
          <div className="mt-[2vh] font-display text-[1.05vw] text-amber tracking-wider">2 LEVELS</div>
        </div>
        <div className="bg-bg-2 border border-emerald/50 rounded-[0.4vw] p-[2vh]">
          <div className="font-display text-[1.5vw] text-emerald">Starter Cache</div>
          <div className="mt-[1vh] font-body text-[1.15vw] text-muted leading-snug">+5 flat scrap per level, every run</div>
          <div className="mt-[2vh] font-display text-[1.05vw] text-emerald tracking-wider">3 LEVELS · NEW</div>
        </div>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-center justify-between border-t border-line pt-[2vh]">
        <span className="font-body text-[1.1vw] text-muted">Bought between runs with scrap. State persists in the browser.</span>
        <span className="font-display text-[1.1vw] text-accent tracking-wide">localStorage · wss2_meta_v1</span>
      </div>
    </div>
  );
}
