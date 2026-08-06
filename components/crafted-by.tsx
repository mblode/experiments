export const CraftedBy = () => {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-lg text-muted-foreground text-sm transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 motion-reduce:transition-none"
      href="https://blode.co"
      rel="author noopener noreferrer"
      target="_blank"
    >
      <span>Crafted by</span>
      {/* biome-ignore lint/performance/noImgElement: self-hosted 20px avatar, plain img avoids next/image overhead */}
      <img
        alt=""
        className="size-5 rounded-full"
        height={20}
        loading="lazy"
        src="/experiments/avatar-sm.png"
        width={20}
      />
      <span>Matthew Blode</span>
    </a>
  );
};
