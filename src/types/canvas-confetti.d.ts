declare module "canvas-confetti" {
  type Options = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    scalar?: number;
  };

  function confetti(options?: Options): Promise<null>;
  export default confetti;
}
