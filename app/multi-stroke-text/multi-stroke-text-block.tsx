"use client";

import { useEffect } from "react";

const DOODLE_RULES = `
  @grid: 1 / 600px 800px / #fff;
  --c: #382f32, #ffeaf2, #fcd9e5, #fbc5d8, #f1396d;
  background: @doodle(
    @grid: 40x1 / 100%;
    @content: '𖤛';
    position: absolute;
    inset: 0;
    font-size: 200px;
    z-index: @I(-@i);
    -webkit-text-stroke-color: @pn(--c);
    -webkit-text-stroke-width: @i(*30px);
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
