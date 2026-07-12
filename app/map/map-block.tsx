"use client";
import NextImage from "next/image";

import { AbsoluteMapLabel } from "./absolute-map-label";
import { CustomMapDot } from "./custom-map-dot";
import { GetDirectionsButton } from "./get-directions-button";

export const MapBlock = () => {
  const lat = -37.894_456_515_024_59;
  const lng = 145.030_400_046_927_2;
  const zoom = 8;

  const WIDTH = 400;
  const HEIGHT = 400;

  return (
    <a
      className="relative block w-full max-w-[400px] overflow-hidden rounded-3xl bg-white"
      href="https://www.google.com/maps/place/Melbourne+VIC/data=!4m2!3m1!1s0x6ad646b5d2ba4df7:0x4045675218ccd90?sa=X&ved=1t:242&ictx=111"
      rel="noopener noreferrer"
      style={{
        height: HEIGHT,
      }}
      target="_blank"
    >
      {/* Map Image */}
      <NextImage
        alt="Melbourne"
        className="size-full object-cover"
        height={HEIGHT}
        src={`https://api.mapbox.com/styles/v1/matthewblode/clix8w21k00ux01qi5r472wau/static/${lng},${lat},${zoom},0/${WIDTH}x${HEIGHT}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&logo=false&attribution=false`}
        width={WIDTH}
      />

      {/* Title, Address Labels */}
      <AbsoluteMapLabel title="Melbourne" />

      {/* Fixed Map Pin Icon */}
      <div className="absolute top-1/2 left-1/2 flex size-full -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <CustomMapDot pulsating={true} size={28} />
      </div>

      {/* Get Directions Button */}
      <div className="absolute top-0 right-0 flex p-4">
        <GetDirectionsButton lat={lat} lng={lng} size="large" />
      </div>
    </a>
  );
};
