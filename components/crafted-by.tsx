export const CraftedBy = () => {
  return (
    <a
      className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href="https://matthewblode.com"
      rel="author noopener"
      target="_blank"
    >
      <span>Crafted by</span>
      {/* biome-ignore lint/performance/noImgElement: external avatar, no optimisation needed */}
      <img
        alt="Matthew Blode"
        className="rounded-full"
        height={20}
        loading="lazy"
        src="https://matthewblode.com/avatar-sm.png"
        width={20}
      />
      <span>Matthew Blode</span>
    </a>
  );
};
