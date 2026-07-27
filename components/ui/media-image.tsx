"use client";
import Image from "next/image";
import { type CSSProperties, type ReactElement, useMemo } from "react";

import type { Media } from "@/lib/types";
import { cn, imageLoader, unsplashLoader } from "@/lib/utils";

interface Props {
  media?: Partial<Media>;
  title?: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  disableGaussianBlur?: boolean;
  disableOverlayBackground?: boolean;
  disableCrop?: boolean;
  blurMultiplier?: number;
  objectFit?: "CONTAIN" | "COVER";
}

type MediaType =
  | "ASSET"
  | "UNSPLASH"
  | "BRANDFETCH"
  | "ICONS8"
  | "URL"
  | "COLOR";

const getObjectPosition = (
  media: Partial<Media> | undefined,
  disableCrop?: boolean
) => {
  if (!(media && ["ASSET", "UNSPLASH"].includes(media.type || ""))) {
    return "50% 50%";
  }

  const defaultFocalX = media.focalPointX ?? 0.5;
  const defaultFocalY = media.focalPointY ?? 0.5;

  if (disableCrop || !media.focalPointX || !media.focalPointY) {
    return `${(defaultFocalX || 0.5) * 100}% ${(defaultFocalY || 0.5) * 100}%`;
  }

  const sourceWidth = media.width || 500;
  const sourceHeight = media.height || 500;
  const cropX = media.cropX ? media.cropX : 0;
  const cropY = media.cropY ? media.cropY : 0;
  const cropW = media.cropW ? media.cropW : sourceWidth;
  const cropH = media.cropH ? media.cropH : sourceHeight;

  const focalPointX =
    (defaultFocalX - cropX / sourceWidth) / (cropW / sourceWidth);
  const focalPointY =
    (defaultFocalY - cropY / sourceHeight) / (cropH / sourceHeight);

  return `${focalPointX * 100}% ${focalPointY * 100}%`;
};

const getOverlayStyle = (
  media: Partial<Media> | undefined,
  disableGaussianBlur?: boolean,
  disableOverlayBackground?: boolean,
  blurMultiplier?: number
) => {
  const overlayStyle: CSSProperties = {
    background:
      !disableOverlayBackground && media?.overlayBackground
        ? media.overlayBackground
        : undefined,
  };

  if (
    !disableGaussianBlur &&
    media?.gaussianBlur &&
    !["COLOR", "UNSPLASH"].includes(media?.type || "") &&
    (media?.type !== "ASSET" ||
      (media?.type === "ASSET" && media?.assetFileName?.includes(".svg")))
  ) {
    overlayStyle.backdropFilter =
      !disableGaussianBlur && media?.gaussianBlur
        ? `blur(${media?.gaussianBlur * (blurMultiplier || 1)}px)`
        : undefined;

    overlayStyle.WebkitBackdropFilter =
      !disableGaussianBlur && media?.gaussianBlur
        ? `blur(${media?.gaussianBlur * (blurMultiplier || 1)}px)`
        : undefined;
  }

  return overlayStyle;
};

interface RenderMediaArgs {
  media: Partial<Media> | undefined;
  title: string | undefined;
  width: number;
  height: number;
  priority: boolean | undefined;
  className: string | undefined;
  style: CSSProperties | undefined;
  objectFit: "CONTAIN" | "COVER";
  objectPosition: string;
  overlay: ReactElement;
  disableGaussianBlur: boolean | undefined;
  disableCrop: boolean | undefined;
}

const getSharedClassName = (objectFit: "CONTAIN" | "COVER") =>
  cn("size-full", {
    "object-cover": objectFit === "COVER",
    "object-contain": objectFit === "CONTAIN",
  });

const renderAsset = ({
  media,
  title,
  width,
  height,
  priority,
  className,
  style,
  objectFit,
  objectPosition,
  overlay,
}: RenderMediaArgs) => (
  <div className={cn("relative size-full", className)} style={{ ...style }}>
    <Image
      alt={title || media?.altText || ""}
      blurDataURL={media?.blurDataUrl || ""}
      className={getSharedClassName(objectFit)}
      fetchPriority={priority ? "high" : "auto"}
      height={height}
      loader={(loader) =>
        imageLoader({
          ...loader,
        })
      }
      placeholder={media?.blurDataUrl ? "blur" : "empty"}
      priority={priority}
      src={`${media?.assetBucket}/${media?.assetSrc}`}
      style={{
        objectPosition,
      }}
      width={width}
    />

    {overlay}
  </div>
);

const renderUnsplash = ({
  media,
  title,
  width,
  height,
  priority,
  className,
  style,
  objectFit,
  objectPosition,
  overlay,
  disableGaussianBlur,
  disableCrop,
}: RenderMediaArgs) => (
  <div className={cn("relative size-full", className)} style={{ ...style }}>
    <Image
      alt={title || media?.altText || ""}
      blurDataURL={media?.blurDataUrl || ""}
      className={getSharedClassName(objectFit)}
      fetchPriority={priority ? "high" : "auto"}
      height={height}
      loader={(loader) =>
        unsplashLoader({
          ...loader,
          blur:
            !disableGaussianBlur && media?.gaussianBlur
              ? media.gaussianBlur * 4
              : undefined,
          cropX: !disableCrop && media?.cropX ? media?.cropX : undefined,
          cropY: !disableCrop && media?.cropY ? media?.cropY : undefined,
          cropW: !disableCrop && media?.cropW ? media?.cropW : undefined,
          cropH: !disableCrop && media?.cropH ? media?.cropH : undefined,
        })
      }
      placeholder={media?.blurDataUrl ? "blur" : "empty"}
      priority={priority}
      src={media?.unsplashUrl || ""}
      style={{
        objectPosition,
      }}
      width={width}
    />

    {overlay}
  </div>
);

const renderBrandfetch = ({
  media,
  title,
  width,
  height,
  priority,
  className,
  style,
  objectPosition,
  overlay,
}: RenderMediaArgs) => (
  <div
    className={cn(
      "relative flex size-full items-center justify-center",
      className
    )}
    style={{ ...style, background: media?.color }}
  >
    <Image
      alt={title || media?.altText || ""}
      className="size-full object-contain! p-1"
      height={height}
      priority={priority}
      src={media?.customUrl || ""}
      style={{
        objectPosition,
      }}
      width={width}
    />

    {overlay}
  </div>
);

const renderIcons8 = ({
  media,
  title,
  width,
  height,
  priority,
  className,
  style,
  objectPosition,
  overlay,
}: RenderMediaArgs) => (
  <div
    className={cn(
      "relative flex size-full items-center justify-center",
      className
    )}
    style={{ ...style, background: media?.color }}
  >
    <Image
      alt={title || media?.altText || ""}
      className="w-full object-contain! p-1"
      height={height}
      priority={priority}
      src={media?.customUrl || ""}
      style={{
        objectPosition,
      }}
      width={width}
    />

    {overlay}
  </div>
);

const renderUrl = ({
  media,
  title,
  width,
  height,
  className,
  style,
  objectFit,
  objectPosition,
  overlay,
}: RenderMediaArgs) => (
  <div className={cn("relative size-full", className)} style={{ ...style }}>
    <Image
      alt={title || media?.altText || ""}
      className={getSharedClassName(objectFit)}
      height={height}
      src={media?.customUrl || ""}
      style={{
        objectPosition,
      }}
      unoptimized
      width={width}
    />

    {overlay}
  </div>
);

const renderColor = ({ media, className, style, overlay }: RenderMediaArgs) => (
  <div
    className={cn("size-full", className)}
    style={{
      ...style,
    }}
  >
    <div
      className="size-full"
      style={{
        background: media?.backgroundColor2 || media?.color,
      }}
    />

    {overlay}
  </div>
);

const MEDIA_RENDERERS: Record<
  MediaType,
  (args: RenderMediaArgs) => ReactElement
> = {
  ASSET: renderAsset,
  UNSPLASH: renderUnsplash,
  BRANDFETCH: renderBrandfetch,
  ICONS8: renderIcons8,
  URL: renderUrl,
  COLOR: renderColor,
};

const renderMedia = (args: RenderMediaArgs) => {
  const type = args.media?.type as MediaType | undefined;
  if (!(type && type in MEDIA_RENDERERS)) {
    return null;
  }
  return MEDIA_RENDERERS[type](args);
};

export const MediaImage = ({
  media,
  width,
  height,
  title,
  priority,
  className,
  style,
  disableGaussianBlur,
  disableOverlayBackground,
  disableCrop,
  blurMultiplier = 1,
  objectFit = "COVER",
}: Props) => {
  const objectPosition = useMemo(
    () => getObjectPosition(media, disableCrop),
    [media, disableCrop]
  );

  const overlayStyle = useMemo(
    () =>
      getOverlayStyle(
        media,
        disableGaussianBlur,
        disableOverlayBackground,
        blurMultiplier
      ),
    [media, disableGaussianBlur, disableOverlayBackground, blurMultiplier]
  );

  const overlay = (
    <div
      className="pointer-events-none absolute inset-0 size-full"
      style={overlayStyle}
    />
  );

  return renderMedia({
    media,
    title,
    width,
    height,
    priority,
    className,
    style,
    objectFit,
    objectPosition,
    overlay,
    disableGaussianBlur,
    disableCrop,
  });
};
