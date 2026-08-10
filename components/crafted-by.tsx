/*
 * blode.co and blode.co/projects are this same origin behind a rewrite, so both
 * are internal links: same tab, and no rel="noopener noreferrer", which only
 * means something cross-origin. The projects link is the edge back to the hub,
 * without which this zone is a dead end for crawlers and readers. See
 * blode-co/apps/web/.claude/knowledge/zone-conventions.md.
 */
export const CraftedBy = () => {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 text-muted-foreground text-sm">
      <span>Crafted by</span>
      <a
        className="inline-flex items-center gap-2 rounded-lg transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 motion-reduce:transition-none"
        href="https://blode.co"
        rel="author"
      >
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
    </span>
  );
};
