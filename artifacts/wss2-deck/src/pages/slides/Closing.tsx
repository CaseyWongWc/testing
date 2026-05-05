const base = import.meta.env.BASE_URL;

export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body text-text">
      <img
        src={`${base}hero.png`}
        crossOrigin="anonymous"
        alt="Foggy abandoned street at night"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />

      <div className="absolute left-[6vw] top-[26vh] max-w-[80vw]">
        <div className="font-display text-[1.3vw] tracking-[0.4em] text-primary uppercase">Thank You</div>
        <h1 className="mt-[2vh] font-display font-bold text-[7.5vw] leading-[0.95] tracking-tight text-text [text-wrap:balance]">
          Questions?
        </h1>
        <p className="mt-[3vh] font-body text-[1.7vw] text-accent/90 max-w-[60vw] [text-wrap:balance]">
          A Forgotten Place — a zero-player survival-horror AI sim.
        </p>
      </div>

      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] flex items-end justify-between border-t border-line pt-[2.5vh]">
        <div className="font-display text-[1.3vw] text-text">Casey · CS 4800 · Spring 2026</div>
        <div className="font-display text-[1.3vw] text-muted">WSS2 · Phase 3</div>
      </div>
    </div>
  );
}
