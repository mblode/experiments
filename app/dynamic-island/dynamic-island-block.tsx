"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type React from "react";
import { createContext, memo, useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DynamicIslandContextType {
  state: string;
  setState: (state: string) => void;
}

const DynamicIslandContext = createContext<DynamicIslandContextType>({
  state: "idle",
  setState: () => undefined,
});

const springTransition = {
  type: "spring" as const,
  bounce: 0.35,
};

/** Ring the whole island in the same visible focus treatment. */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 focus-visible:outline";

const useDynamicIsland = () => useContext(DynamicIslandContext);

/** The bar is drawn at its tallest and squashed, so 1px of waveform is 1/24. */
const BAR_HEIGHT = 24;

interface AudioBarProps {
  baseLength?: number;
  paused: boolean;
}

const AudioBar = memo(function AudioBar({
  baseLength = 50,
  paused,
}: AudioBarProps) {
  const reduceMotion = useReducedMotion();
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    if (paused) {
      setAnimating(false);
      return;
    }
    const timer = setTimeout(() => {
      setAnimating(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [paused]);

  const generateHeights = (base: number) => {
    const heights: number[] = [];
    for (let i = 0; i < 5; i++) {
      heights.push(
        (Math.floor(Math.random() * 24) - 24) / 2 + (base / 100) * 24
      );
    }
    heights.push(heights[0]);
    return heights;
  };

  let height: number | number[] = baseLength / 5;
  if (paused) {
    height = 1;
  } else if (animating && !reduceMotion) {
    height = generateHeights(baseLength);
  }

  const scaleY = Array.isArray(height)
    ? height.map((value) => value / BAR_HEIGHT)
    : height / BAR_HEIGHT;

  const looping = !(paused || reduceMotion) && animating;
  const transitionConfig = looping
    ? {
        duration: 1.1,
        ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
        times: [0.2, 0.3, 0.5, 0.7, 1.1, 1.3, 1.7],
        repeat: Number.POSITIVE_INFINITY,
      }
    : { duration: reduceMotion ? 0 : 0.3 };

  return (
    <motion.div
      animate={{ scaleY }}
      className="col-span-1 mx-auto my-auto h-[30px] w-[1.5625px] rounded-full bg-gradient-to-t from-[#675470] to-[#395978]"
      transition={transitionConfig}
    />
  );
});

interface TimerProps {
  className?: string;
  paused: boolean;
}

function Timer({ className, paused }: TimerProps) {
  const reduceMotion = useReducedMotion();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (paused) {
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => (prev === 59 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [paused]);

  const digits = seconds.toString().padStart(2, "0").split("");
  const digitSlots = [
    { slot: "tens", value: digits[0] ?? "0" },
    { slot: "ones", value: digits[1] ?? "0" },
  ];

  return (
    <div
      className={cn("relative overflow-hidden whitespace-nowrap", className)}
    >
      <span className="sr-only">{`0 minutes ${seconds} seconds elapsed`}</span>
      <span aria-hidden="true">0:</span>
      <AnimatePresence initial={false} mode="popLayout">
        {digitSlots.map(({ slot, value }) => (
          <motion.div
            animate={{
              y: "0",
              filter: "blur(0px)",
              opacity: 1,
            }}
            aria-hidden="true"
            className="inline-block tabular-nums"
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { y: "-12px", filter: "blur(2px)", opacity: 0 }
            }
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { y: "12px", filter: "blur(2px)", opacity: 0 }
            }
            key={`${slot}-${value}`}
            transition={reduceMotion ? { duration: 0.15 } : springTransition}
          >
            {value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface PlayPauseButtonProps {
  initial: React.ReactNode;
  active: React.ReactNode;
  isActive: boolean;
}

function PlayPauseButton({ initial, active, isActive }: PlayPauseButtonProps) {
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion
    ? { opacity: 0, scale: 1 }
    : { opacity: 0, scale: 0.5 };

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        exit={hidden}
        initial={hidden}
        key={isActive ? "play" : "pause"}
        transition={{ duration: 0.1 }}
      >
        {isActive ? active : initial}
      </motion.div>
    </AnimatePresence>
  );
}

function TimerView() {
  const { setState } = useDynamicIsland();
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex w-full items-center gap-2 p-4 py-3">
      <button
        aria-label={paused ? "Resume timer" : "Pause timer"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-[#5A3C07] transition-colors duration-200 ease-out hover:bg-[#694608] active:bg-[#7A5309]",
          FOCUS_RING
        )}
        onClick={() => setPaused((prev) => !prev)}
        type="button"
      >
        <PlayPauseButton
          active={
            <svg
              aria-hidden="true"
              className="h-4 w-4 fill-current text-[#FDB000]"
              fill="none"
              viewBox="0 0 12 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0.9375 13.2422C1.25 13.2422 1.51562 13.1172 1.82812 12.9375L10.9375 7.67188C11.5859 7.28906 11.8125 7.03906 11.8125 6.625C11.8125 6.21094 11.5859 5.96094 10.9375 5.58594L1.82812 0.3125C1.51562 0.132812 1.25 0.015625 0.9375 0.015625C0.359375 0.015625 0 0.453125 0 1.13281V12.1172C0 12.7969 0.359375 13.2422 0.9375 13.2422Z" />
            </svg>
          }
          initial={
            <svg
              aria-hidden="true"
              className="h-4 w-4 fill-current text-[#FDB000]"
              fill="none"
              viewBox="0 0 10 13"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1.03906 12.7266H2.82031C3.5 12.7266 3.85938 12.3672 3.85938 11.6797V1.03906C3.85938 0.328125 3.5 0 2.82031 0H1.03906C0.359375 0 0 0.359375 0 1.03906V11.6797C0 12.3672 0.359375 12.7266 1.03906 12.7266ZM6.71875 12.7266H8.49219C9.17969 12.7266 9.53125 12.3672 9.53125 11.6797V1.03906C9.53125 0.328125 9.17969 0 8.49219 0H6.71875C6.03125 0 5.67188 0.359375 5.67188 1.03906V11.6797C5.67188 12.3672 6.03125 12.7266 6.71875 12.7266Z" />
            </svg>
          }
          isActive={paused}
        />
      </button>
      <button
        aria-label="Dismiss timer"
        className={cn(
          "mr-12 flex h-10 w-10 items-center justify-center rounded-full bg-[#3C3D3C] text-white transition-colors duration-200 ease-out hover:bg-[#4A4B4A] active:bg-[#585958]",
          FOCUS_RING
        )}
        onClick={() => setState("idle")}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="flex items-baseline gap-1.5 text-[#FDB000]">
        <span className="font-semibold text-sm leading-none">Timer</span>
        <Timer className="w-[64px] font-light text-3xl" paused={paused} />
      </div>
    </div>
  );
}

function IdleView() {
  return <div className="h-[28px]" />;
}

function RingModeView() {
  const reduceMotion = useReducedMotion();
  const [isSilent, setIsSilent] = useState(false);
  const [isInitial, setIsInitial] = useState(true);

  // The view demonstrates itself by toggling on a loop. Under reduced motion it
  // stays put and waits to be tapped instead.
  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const timer = setTimeout(
      () => {
        setIsInitial(false);
        setIsSilent((prev) => !prev);
      },
      isInitial ? 1000 : 2000
    );
    return () => clearTimeout(timer);
  }, [isInitial, reduceMotion]);

  const shake = reduceMotion
    ? 0
    : isSilent
      ? [0, -15, 5, -2, 0]
      : [0, 20, -15, 12.5, -10, 10, -7.5, 7.5, -5, 5, 0];

  return (
    <motion.div
      animate={{ width: isSilent ? 148 : 128 }}
      className="relative flex h-[28px] items-center justify-between px-2.5"
      initial={{ width: 128 }}
      transition={
        reduceMotion ? { duration: 0.2 } : { type: "spring", bounce: 0.5 }
      }
    >
      <motion.div
        animate={{
          width: isSilent ? 40 : 0,
          opacity: isSilent ? 1 : 0,
          filter: isSilent ? "blur(0px)" : "blur(4px)",
        }}
        aria-hidden="true"
        className="absolute left-[5px] h-[18px] w-12 rounded-full bg-[#FD4F30]"
        initial={{ width: 0, opacity: 0, filter: "blur(4px)" }}
        transition={reduceMotion ? { duration: 0.2 } : springTransition}
      />
      <button
        aria-label="Ring mode"
        aria-pressed={isSilent}
        className={cn(
          "relative h-[12.75px] w-[11.25px] rounded-sm",
          FOCUS_RING
        )}
        onClick={() => setIsSilent((prev) => !prev)}
        type="button"
      >
        <span className="sr-only">{isSilent ? "Silent" : "Ring"}</span>
        <motion.svg
          animate={{
            rotate: shake,
            x: isSilent ? 8.5 : 0,
          }}
          aria-hidden="true"
          className="absolute inset-0"
          fill="none"
          height="12.75"
          initial={false}
          viewBox="0 0 15 17"
          width="11.25"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.17969 13.3125H13.5625C14.2969 13.3125 14.7422 12.9375 14.7422 12.3672C14.7422 11.5859 13.9453 10.8828 13.2734 10.1875C12.7578 9.64844 12.6172 8.53906 12.5547 7.64062C12.5 4.64062 11.7031 2.57812 9.625 1.82812C9.32812 0.804688 8.52344 0 7.36719 0C6.21875 0 5.40625 0.804688 5.11719 1.82812C3.03906 2.57812 2.24219 4.64062 2.1875 7.64062C2.125 8.53906 1.98438 9.64844 1.46875 10.1875C0.789062 10.8828 0 11.5859 0 12.3672C0 12.9375 0.4375 13.3125 1.17969 13.3125ZM7.36719 16.4453C8.69531 16.4453 9.66406 15.4766 9.76562 14.3828H4.97656C5.07812 15.4766 6.04688 16.4453 7.36719 16.4453Z"
            fill="white"
          />
        </motion.svg>
        <motion.div
          animate={{
            rotate: shake,
            x: isSilent ? 8.5 : 0,
          }}
          aria-hidden="true"
          className="absolute inset-0"
        >
          <motion.div className="h-5 translate-x-[5.25px] -translate-y-[5px] rotate-[-40deg] overflow-hidden">
            <motion.div
              animate={{ height: isSilent ? 16 : 0 }}
              className="w-fit rounded-full"
              transition={{
                ease: [0.645, 0.045, 0.355, 1] as [
                  number,
                  number,
                  number,
                  number,
                ],
                duration: isSilent ? 0.125 : 0.05,
                delay: isSilent ? 0.15 : 0,
              }}
            >
              <div className="flex h-full w-[3px] items-center justify-center rounded-full bg-[#FD4F30]">
                <div className="h-full w-[0.75px] rounded-full bg-white" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </button>
      <div aria-hidden="true" className="relative flex w-[32px] items-center">
        <motion.span
          animate={
            isSilent
              ? {
                  opacity: 0,
                  scale: reduceMotion ? 1 : 0.25,
                  filter: "blur(4px)",
                }
              : { opacity: 1, scale: 1, filter: "blur(0px)" }
          }
          className="ml-auto font-medium text-white text-xs"
        >
          Ring
        </motion.span>
        <motion.span
          animate={
            isSilent
              ? { opacity: 1, scale: 1, filter: "blur(0px)" }
              : {
                  opacity: 0,
                  scale: reduceMotion ? 1 : 0.25,
                  filter: "blur(4px)",
                }
          }
          className="absolute font-medium text-[#FD4F30] text-xs"
        >
          Silent
        </motion.span>
      </div>
    </motion.div>
  );
}

const TRACK_LENGTH = 214;

function ListeningView() {
  const reduceMotion = useReducedMotion();
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => (prev === TRACK_LENGTH ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [paused]);

  const formatTime = () => {
    const secs = `0${seconds % 60}`.slice(-2);
    const mins = `${Math.floor(seconds / 60)}`;
    const formattedMins = `0${Number(mins) % 60}`.slice(-2);
    return `${formattedMins}:${secs}`;
  };

  return (
    <div className="w-[316px] p-[18px]">
      <div className="flex items-center gap-3">
        <Image
          alt="Anniversary's album cover"
          className="rounded-lg"
          height={52}
          src="/experiments/album.png"
          width={52}
        />
        <div className="flex flex-col gap-1 pr-12">
          <span className="whitespace-nowrap font-medium text-sm text-white leading-none">
            Timeless Interlude
          </span>
          <span className="text-gray-400 text-sm leading-none">
            Bryson Tiller
          </span>
        </div>
        <div
          aria-hidden="true"
          className="grid h-full grid-cols-11 justify-center gap-[2px] bg-transparent"
        >
          <AudioBar baseLength={50} paused={paused} />
          <AudioBar baseLength={60} paused={paused} />
          <AudioBar baseLength={70} paused={paused} />
          <AudioBar baseLength={90} paused={paused} />
          <AudioBar baseLength={80} paused={paused} />
          <AudioBar baseLength={90} paused={paused} />
          <AudioBar baseLength={70} paused={paused} />
          <AudioBar baseLength={60} paused={paused} />
          <AudioBar baseLength={50} paused={paused} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        <span className="text-gray-400 text-xs tabular-nums">
          {formatTime()}
        </span>
        <div
          aria-label="Track progress"
          aria-valuemax={TRACK_LENGTH}
          aria-valuemin={0}
          aria-valuenow={seconds}
          className="relative h-[3px] flex-grow overflow-hidden rounded-full bg-[#2C2C29]"
          role="progressbar"
        >
          <motion.div
            animate={{ x: `${(seconds / TRACK_LENGTH) * 100 - 99}%` }}
            className="absolute top-0 bottom-0 left-0 w-full bg-gray-400"
            initial={{ x: "-100%" }}
            transition={{ duration: reduceMotion ? 0 : 1, ease: "linear" }}
          />
        </div>
        <span className="text-gray-400 text-xs tabular-nums">3:34</span>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 pb-1">
        <button
          aria-label="Previous track"
          className={cn(
            "rounded-full p-1 transition-opacity duration-200 ease-out hover:opacity-70 active:opacity-50",
            FOCUS_RING
          )}
          onClick={() => setSeconds(0)}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="13"
            viewBox="0 0 22 13"
            width="22"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.64844 12.2891C10.2578 12.2891 10.7734 11.8203 10.7734 10.9531V1.35156C10.7734 0.484375 10.2578 0.015625 9.64844 0.015625C9.32812 0.015625 9.07031 0.117188 8.75 0.304688L0.789062 4.99219C0.234375 5.32031 0 5.70312 0 6.14844C0 6.60156 0.234375 6.98438 0.789062 7.3125L8.75 12C9.0625 12.1875 9.32812 12.2891 9.64844 12.2891ZM20.3828 12.2891C20.9922 12.2891 21.5078 11.8203 21.5078 10.9531V1.35156C21.5078 0.484375 20.9922 0.015625 20.3828 0.015625C20.0625 0.015625 19.8047 0.117188 19.4844 0.304688L11.5234 4.99219C10.9688 5.32031 10.7344 5.70312 10.7344 6.14844C10.7344 6.60156 10.9688 6.98438 11.5234 7.3125L19.4844 12C19.7969 12.1875 20.0625 12.2891 20.3828 12.2891Z"
              fill="white"
            />
          </svg>
        </button>
        <button
          aria-label={paused ? "Play" : "Pause"}
          className={cn(
            "rounded-full p-1 transition-opacity duration-200 ease-out hover:opacity-70 active:opacity-50",
            FOCUS_RING
          )}
          onClick={() => setPaused((prev) => !prev)}
          type="button"
        >
          <PlayPauseButton
            active={
              <svg
                aria-hidden="true"
                className="h-5 w-5 fill-current text-white"
                fill="none"
                viewBox="0 0 12 14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0.9375 13.2422C1.25 13.2422 1.51562 13.1172 1.82812 12.9375L10.9375 7.67188C11.5859 7.28906 11.8125 7.03906 11.8125 6.625C11.8125 6.21094 11.5859 5.96094 10.9375 5.58594L1.82812 0.3125C1.51562 0.132812 1.25 0.015625 0.9375 0.015625C0.359375 0.015625 0 0.453125 0 1.13281V12.1172C0 12.7969 0.359375 13.2422 0.9375 13.2422Z" />
              </svg>
            }
            initial={
              <svg
                aria-hidden="true"
                className="h-5 w-5 fill-current text-white"
                fill="none"
                viewBox="0 0 10 13"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1.03906 12.7266H2.82031C3.5 12.7266 3.85938 12.3672 3.85938 11.6797V1.03906C3.85938 0.328125 3.5 0 2.82031 0H1.03906C0.359375 0 0 0.359375 0 1.03906V11.6797C0 12.3672 0.359375 12.7266 1.03906 12.7266ZM6.71875 12.7266H8.49219C9.17969 12.7266 9.53125 12.3672 9.53125 11.6797V1.03906C9.53125 0.328125 9.17969 0 8.49219 0H6.71875C6.03125 0 5.67188 0.359375 5.67188 1.03906V11.6797C5.67188 12.3672 6.03125 12.7266 6.71875 12.7266Z" />
              </svg>
            }
            isActive={paused}
          />
        </button>
        <button
          aria-label="Next track"
          className={cn(
            "rounded-full p-1 transition-opacity duration-200 ease-out hover:opacity-70 active:opacity-50",
            FOCUS_RING
          )}
          onClick={() => setSeconds(0)}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="13"
            viewBox="0 0 22 13"
            width="22"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.125 12.2891C1.44531 12.2891 1.71094 12.1875 2.02344 12L9.98438 7.3125C10.5391 6.98438 10.7812 6.60156 10.7812 6.14844C10.7812 5.70312 10.5391 5.32031 9.98438 4.99219L2.02344 0.304688C1.70312 0.117188 1.44531 0.015625 1.125 0.015625C0.515625 0.015625 0 0.484375 0 1.35156V10.9531C0 11.8203 0.515625 12.2891 1.125 12.2891ZM11.8594 12.2891C12.1797 12.2891 12.4453 12.1875 12.7578 12L20.7266 7.3125C21.2734 6.98438 21.5156 6.60156 21.5156 6.14844C21.5156 5.70312 21.2734 5.32031 20.7266 4.99219L12.7578 0.304688C12.4453 0.117188 12.1797 0.015625 11.8594 0.015625C11.25 0.015625 10.7344 0.484375 10.7344 1.35156V10.9531C10.7344 11.8203 11.25 12.2891 11.8594 12.2891Z"
              fill="white"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

type TransitionVariant = Partial<{
  scale: number;
  scaleX: number;
  scaleY: number;
  y: number;
}>;

const transitionVariants: Record<string, TransitionVariant> = {
  "ring-mode-idle": { scale: 0.9, scaleX: 0.9 },
  "timer-ring-mode": { scale: 0.7, y: -7.5 },
  "ring-mode-timer": { scale: 1.4, y: 7.5 },
  "timer-listenning": { scaleY: 1.1, y: 7.5 },
  "listenning-ring-mode": { scale: 0.65, y: -32 },
  "ring-mode-listenning": { scale: 1.5, y: 12.5 },
  "timer-idle": { scale: 0.7, y: -7.5 },
  "listenning-timer": { scaleY: 0.9, y: -12 },
  "listenning-idle": { scale: 0.4, y: -36 },
};

const exitVariants: {
  exit: (custom?: TransitionVariant) => TransitionVariant & {
    opacity: number[];
    filter: string;
  };
} = {
  exit: (custom: TransitionVariant = {}) => ({
    ...custom,
    opacity: [1, 0],
    filter: "blur(5px)",
  }),
};

/**
 * Each view is absolutely sized so the content can cross-fade while the pill is
 * still resizing, which means the height it will settle at is known up front.
 * The spring reads that ahead of the transition instead of measuring after it:
 * a small hop can afford to overshoot, a tall expansion cannot.
 */
const VIEW_HEIGHT: Record<string, number> = {
  idle: 28,
  "ring-mode": 28,
  timer: 64,
  listenning: 152,
};

const bounceFor = (from: string, to: string) => {
  const delta = VIEW_HEIGHT[to] - VIEW_HEIGHT[from];
  if (Math.abs(delta) < 20) {
    return 0.5;
  }
  const ratio = Math.abs(delta) / 100;
  const bounce = delta < 0 ? 0.35 - 0.3 * ratio : 0.3 + 0.3 * ratio;
  return Math.min(Math.max(bounce, 0.3), 0.35);
};

const STATES: { id: string; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "ring-mode", label: "Ring mode" },
  { id: "timer", label: "Timer" },
  { id: "listenning", label: "Listening" },
];

export const DynamicIslandBlock = () => {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState("idle");
  const [transition, setTransition] = useState<TransitionVariant>();
  const [bounceValue, setBounceValue] = useState(0.5);

  function renderContent() {
    switch (state) {
      case "timer":
        return <TimerView />;
      case "listenning":
        return <ListeningView />;
      case "ring-mode":
        return <RingModeView />;
      default:
        return <IdleView />;
    }
  }

  const handleStateChange = (newState: string) => {
    if (newState === state) {
      return;
    }
    setTransition(transitionVariants[`${state}-${newState}`]);
    setBounceValue(bounceFor(state, newState));
    setState(newState);
  };

  const morph = reduceMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, bounce: bounceValue };

  return (
    <DynamicIslandContext.Provider
      value={{ state, setState: handleStateChange }}
    >
      <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-border bg-muted">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <motion.div
              className="min-w-[100px] overflow-hidden rounded-full bg-black"
              layout
              style={{ borderRadius: "32px" }}
              transition={morph}
            >
              <motion.div
                animate={{
                  scale: 1,
                  opacity: 1,
                  filter: "blur(0px)",
                  originX: 0.5,
                  originY: 0.5,
                  transition: { delay: 0.05 },
                }}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        scale: 0.9,
                        opacity: 0,
                        filter: "blur(5px)",
                        originX: 0.5,
                        originY: 0.5,
                      }
                }
                key={state}
                transition={morph}
              >
                {renderContent()}
              </motion.div>
            </motion.div>

            {/* The outgoing view, kept alive off-screen purely so it has
                something to play its exit variant on. Never read aloud. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-1/2 flex h-[200px] w-[300px] -translate-x-1/2 items-start justify-center opacity-0"
            >
              <AnimatePresence
                custom={transition}
                initial={false}
                mode="popLayout"
              >
                <motion.div
                  exit="exit"
                  initial={{ opacity: 0 }}
                  key={`${state}second`}
                  variants={exitVariants}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div aria-label="Island state" className="flex gap-2" role="group">
            {STATES.map(({ id, label }) => (
              <Button
                aria-pressed={state === id}
                key={id}
                onClick={() => handleStateChange(id)}
                size="sm"
                variant={state === id ? "default" : "secondary"}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </DynamicIslandContext.Provider>
  );
};
