"use client";

import { useEffect } from "react";

const DOODLE_RULES = `
  @grid: 1 / 600px 600px / #f4e1e8;
  --c: #cc0d55;
  background: @doodle(
    @grid: 36x1 / 100%;
    @content: '✱';
    position: absolute;
    inset: 0;
    font: 240px/0 sans-serif;
    color: var(--c);
    z-index: @I(-@i);
    -webkit-text-stroke-color: @pn(--c, #f4e1e8);
    -webkit-text-stroke-width: @calc(@i * 0.08em + 0.02em * (1 - (-1) ** @i));
  );
`;

export const MultiStrokeTextBlock = () => {
  useEffect(() => {
    import("css-doodle");
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <p className="max-w-prose text-center text-muted-foreground">
        Stacked layers of <code>-webkit-text-stroke-width</code> at incremental
        sizes draw the same glyph as concentric outlines, producing a retro
        onion-ring effect.
      </p>
      <css-doodle>
        <style>{DOODLE_RULES}</style>
      </css-doodle>
    </div>
  );
};
