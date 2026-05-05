const base = import.meta.env.BASE_URL;

export default function Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <img
        src={`${base}hero.png`}
        crossOrigin="anonymous"
        alt="Foggy abandoned street at night"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

      <div className="absolute top-[6vh] left-[6vw] flex items-center gap-[1vw]">
        <div className="w-[0.5vw] h-[2.4vh] bg-primary" />
        <span className="font-display text-[1.3vw] tracking-[0.4em] text-primary uppercase">
          Survival Sim · Phase 3
        </span>
      </div>

      <div className="absolute left-[6vw] top-[34vh] max-w-[60vw]">
        <h1 className="font-display font-bold text-[8vw] leading-[0.9] tracking-tight text-text [text-wrap:balance]">
          A Forgotten<span className="block text-primary">Place</span>
        </h1>
        <p className="mt-[3vh] font-body text-[1.9vw] text-accent/90 [text-wrap:balance] max-w-[48vw]">
          A zero-player survival-horror AI simulation.
        </p>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between border-t border-line pt-[2.5vh]">
        <div>
          <div className="font-display text-[1.4vw] text-text">Casey</div>
          <div className="font-body text-[1.1vw] text-muted mt-[0.5vh]">CS 4800 · Spring 2026</div>
        </div>
        <div className="text-right">
          <div className="font-body text-[1.1vw] text-muted">Codename</div>
          <div className="font-display text-[1.4vw] text-text mt-[0.5vh]">WSS2</div>
        </div>
      </div>
    </div>
  );
}
