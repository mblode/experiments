"use client";

import { ArrowUndoUpIcon } from "blode-icons-react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const COUNTDOWN_SECONDS = 10;

const CountdownTimer = ({
  initialSeconds,
  intervalSeconds = 1,
  onFinish,
  onTick,
}: {
  initialSeconds: number;
  intervalSeconds?: number;
  onFinish: () => void;
  onTick: (seconds: number) => void;
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (seconds <= 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => {
      const next = seconds - 1;
      setSeconds(next);
      onTick(next);
    }, intervalSeconds * 1000);
    return () => clearTimeout(timer);
  }, [seconds, intervalSeconds, onFinish, onTick]);

  // Slot-keyed, so only the digit that changed springs in and 10 to 9 does not
  // re-animate the whole number.
  const digits = buildKeyedCharacters(`${seconds}`, "slot");

  return (
    <span
      aria-hidden="true"
      className="block w-10 rounded-full bg-destructive py-1 text-center text-white"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {digits.map(({ char: digit, key, order }) => {
          return (
            <motion.span
              animate={{ y: 0, scale: 1, filter: "blur(0px)", opacity: 1 }}
              className="inline-block"
              exit={{ y: 10, scale: 0.8, filter: "blur(3px)", opacity: 0 }}
              initial={{ y: -10, scale: 0.8, filter: "blur(3px)", opacity: 0 }}
              key={key}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      delay: order * 0.04,
                      type: "spring",
                      bounce: 0.2,
                      stiffness: 220,
                      damping: 22,
                    }
              }
            >
              {digit}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </span>
  );
};

const DELETE_STATUS = {
  INITIAL: "initial",
  IN_PROGRESS: "in-progress",
  CANCELLED: "cancelled",
  DELETED: "deleted",
} as const;

const StaggeredText = ({
  text,
  initialAnimationEnabled = true,
}: {
  text: string;
  initialAnimationEnabled?: boolean;
}) => {
  const characters = buildKeyedCharacters(text, "restage");
  const reduced = useReducedMotion();

  return (
    // This position:relative is intentional. It prevents the text from layout shift
    // The layout prop here ensures that text doesn't stretch too much
    <motion.span className="relative block" layout>
      {/* The visible copy is one span per character; the readable copy is
          exposed once on the button itself. */}
      <span aria-hidden="true">
        <AnimatePresence initial={initialAnimationEnabled} mode="popLayout">
          {characters.map(({ char, key, order }) => {
            if (char === " ") {
              return <span key={key}>{"\u00A0"}</span>;
            }
            return (
              <motion.span
                animate={{ y: 0, filter: "blur(0px)", opacity: 1, scale: 1 }}
                className="inline-block"
                exit={{ y: -12, filter: "blur(4px)", opacity: 0, scale: 0.8 }}
                initial={{
                  y: 12,
                  filter: "blur(4px)",
                  opacity: 0,
                  scale: 0.8,
                }}
                key={key}
                transition={
                  reduced ? { duration: 0 } : { delay: order * 0.012 }
                }
              >
                {char}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>
    </motion.span>
  );
};

/**
 * The two callers want opposite things out of AnimatePresence, so they get
 * opposite keys.
 *
 * "slot" keys on position and value: the countdown should animate only the
 * digit that actually changed, so 10 to 9 leaves the rest of the number alone.
 *
 * "restage" keys on the whole string and position, so every character of the
 * outgoing label exits and every character of the incoming one enters. Keying
 * the label by character instead is what broke it: Delete Account and Cancel
 * Deletion share ten character keys between them, so those letters survived as
 * the same element and flew sideways to their new slot, which is the one thing
 * a letter-by-letter rewrite must not look like.
 */
const buildKeyedCharacters = (value: string, mode: "slot" | "restage") => {
  return Array.from(value).map((char, index) => ({
    char,
    key: mode === "slot" ? `${index}-${char}` : `${value}-${index}`,
    order: index,
  }));
};

export const TimedUndoBlock = () => {
  const [status, setStatus] = useState<
    (typeof DELETE_STATUS)[keyof typeof DELETE_STATUS]
  >(DELETE_STATUS.INITIAL);
  const [announcement, setAnnouncement] = useState("");
  const reduced = useReducedMotion();

  const hasStatusChanged = status !== DELETE_STATUS.INITIAL;

  const isDeleting = status === DELETE_STATUS.IN_PROGRESS;
  const isDeleted = status === DELETE_STATUS.DELETED;

  const onTimerEnd = useCallback(() => {
    setStatus(DELETE_STATUS.DELETED);
    setAnnouncement("Account deleted.");
  }, []);

  // Announced at the halfway mark only. A live region that fires every tick is
  // unusable; two updates give the remaining time without the chatter.
  const onTick = useCallback((seconds: number) => {
    if (seconds === Math.floor(COUNTDOWN_SECONDS / 2)) {
      setAnnouncement(
        `${seconds} seconds until the account is deleted. Activate the button to cancel.`
      );
    }
  }, []);

  const handleClick = () => {
    if (isDeleting) {
      setStatus(DELETE_STATUS.CANCELLED);
      setAnnouncement("Deletion cancelled.");
      return;
    }
    setStatus(DELETE_STATUS.IN_PROGRESS);
    setAnnouncement(
      `Deleting account in ${COUNTDOWN_SECONDS} seconds. Activate the button again to cancel.`
    );
  };

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <AnimatePresence
        initial={false}
        onExitComplete={() =>
          setTimeout(() => {
            setStatus(DELETE_STATUS.INITIAL);
            setAnnouncement("");
          }, 200)
        }
      >
        {isDeleted ? null : (
          <motion.button
            // Matches the visible label word for word, then adds the context the
            // per-character spans cannot carry.
            aria-label={
              isDeleting
                ? "Cancel Deletion"
                : `Delete Account. You get ${COUNTDOWN_SECONDS} seconds to undo.`
            }
            className={clsx(
              "flex h-14 cursor-pointer items-center gap-2 rounded-full py-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
              isDeleting
                ? "bg-destructive/10 px-3 text-destructive"
                : "bg-destructive px-6 text-white"
            )}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            layout
            onClick={handleClick}
            style={{
              // needed to make sure the layout transition doesn't skew border radius
              borderRadius: "9999px",
            }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    type: "spring",
                    bounce: 0.15,
                    duration: 0.45,
                  }
            }
            type="button"
            whileTap={reduced ? undefined : { scale: 0.97 }}
          >
            {isDeleting && (
              <motion.span
                animate={{ opacity: 1, filter: "blur(0px)" }}
                aria-hidden="true"
                className="rounded-full bg-destructive p-1.5 text-white"
                exit={{
                  opacity: 0,
                  filter: "blur(4px)",
                }}
                initial={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                <ArrowUndoUpIcon className="h-5 w-5 stroke-[2.5px]" />
              </motion.span>
            )}

            <StaggeredText
              initialAnimationEnabled={hasStatusChanged}
              text={isDeleting ? "Cancel Deletion" : "Delete Account"}
            />

            {isDeleting && (
              <motion.span
                animate={{ opacity: 1, filter: "blur(0px)" }}
                className="block"
                exit={{
                  opacity: 0,
                  filter: "blur(4px)",
                }}
                initial={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                <CountdownTimer
                  initialSeconds={COUNTDOWN_SECONDS}
                  onFinish={onTimerEnd}
                  onTick={onTick}
                />
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
