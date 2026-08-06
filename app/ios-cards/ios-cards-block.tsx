"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useState } from "react";

import { Item } from "./item";
import { List } from "./list";

export const IosCardsBlock = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const close = useCallback(() => setSelectedId(null), []);

  return (
    <>
      <List onSelect={setSelectedId} />
      <AnimatePresence>
        {selectedId && <Item id={selectedId} key="item" onClose={close} />}
      </AnimatePresence>
    </>
  );
};
