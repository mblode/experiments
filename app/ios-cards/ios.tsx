"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { Item } from "./item";
import { List } from "./list";

export const Ios = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <List setSelectedId={setSelectedId} />
      <AnimatePresence>
        {selectedId && (
          <Item id={selectedId} key="item" setSelectedId={setSelectedId} />
        )}
      </AnimatePresence>
    </>
  );
};
