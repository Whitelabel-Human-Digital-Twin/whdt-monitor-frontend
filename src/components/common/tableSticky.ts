"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * Shared class fragments for sticky table cells. Z-index ladder (highest first):
 * mirrored top scrollbar (40) > header corner (30) > header cells (20) >
 * population row first cell (15) > population row other cells (10) > body first-column cells (5).
 */

/** Header cell pinned to the top of the scroll region. */
export const STICKY_HEADER_CELL = "sticky top-0 z-20 bg-gray-700";

/** Header cell pinned to both top and left (the corner). */
export const STICKY_HEADER_CORNER = "sticky top-0 left-0 z-30 bg-gray-700";

/** Body cell pinned to the left edge. */
export const STICKY_FIRST_COL_CELL = "sticky left-0 z-[5]";

/** Measures an element's rendered height; used to compute header row offsets. */
export function useMeasuredHeight<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, height];
}
