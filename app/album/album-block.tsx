"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const AlbumBlock = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <button
      aria-pressed={isPlaying}
      className="relative aspect-square w-full max-w-[400px] overflow-hidden rounded-[40px] bg-gray-400 p-0 text-left shadow-2xl"
      onClick={() => setIsPlaying(!isPlaying)}
      type="button"
    >
      <div className="absolute bottom-8 flex w-full flex-col justify-center text-center text-foreground">
        <h2 className="font-bold text-base">Bridge Over Troubled Water</h2>
        <h3 className="text-sm">Simon & Garfunkel</h3>
      </div>

      <div
        className={cn(
          "relative z-[10] aspect-square w-full overflow-hidden object-cover shadow-xl transition-all duration-1000",
          {
            "translate-y-0 rounded-none": isPlaying,
            "animation-album-spin -translate-y-1/2 rounded-[999px]": !isPlaying,
          }
        )}
      >
        <Image
          alt="Album cover"
          className="object-cover"
          fill
          sizes="(max-width: 400px) 100vw, 400px"
          src="/album.png"
        />
        <div
          className={cn(
            "absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-opacity duration-1000",
            {
              "opacity-0": isPlaying,
            }
          )}
        >
          <div className="absolute z-[10] size-12 rounded-full bg-gray-400" />
          <div className="absolute z-[9] size-14 rounded-full bg-gray-100" />
          <div className="absolute z-[8] size-20 rounded-full bg-gray-400" />
          <div className="absolute z-[7] size-[94px] rounded-full bg-gray-500" />
          <div className="absolute z-[6] size-24 rounded-full bg-white" />
        </div>
      </div>
    </button>
  );
};
