"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

export type ScrollableTableProps = {
  /** The <table> element. Must be the single child. */
  children: ReactNode;
  /** CSS length for the scroll region's max height. */
  maxHeight?: string;
  /** Render the mirrored top scrollbar. It self-hides when there is no overflow. */
  topScrollbar?: boolean;
  className?: string;
};

export function ScrollableTable({
  children,
  maxHeight = "70vh",
  topScrollbar = true,
  className,
}: ScrollableTableProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const syncingRef = useRef<"body" | "mirror" | null>(null);
  const [spacerWidth, setSpacerWidth] = useState(0);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const table = tableRef.current;
    const body = bodyRef.current;
    if (!table || !body) return;

    const measure = () => {
      setSpacerWidth(table.scrollWidth);
      setOverflowing(table.scrollWidth > body.clientWidth);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(table);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  const handleBodyScroll = () => {
    if (syncingRef.current === "mirror") {
      syncingRef.current = null;
      return;
    }
    const body = bodyRef.current;
    const mirror = mirrorRef.current;
    if (!body || !mirror) return;
    syncingRef.current = "body";
    mirror.scrollLeft = body.scrollLeft;
  };

  const handleMirrorScroll = () => {
    if (syncingRef.current === "body") {
      syncingRef.current = null;
      return;
    }
    const body = bodyRef.current;
    const mirror = mirrorRef.current;
    if (!body || !mirror) return;
    syncingRef.current = "mirror";
    body.scrollLeft = mirror.scrollLeft;
  };

  const table = Children.only(children);
  const tableWithRef = isValidElement(table)
    ? cloneElement(table as ReactElement<{ ref?: Ref<HTMLTableElement> }>, { ref: tableRef })
    : table;

  return (
    <div className={`relative rounded-lg shadow-md overflow-hidden ${className ?? ""}`}>
      {topScrollbar && overflowing && (
        <div
          ref={mirrorRef}
          aria-hidden="true"
          tabIndex={-1}
          onScroll={handleMirrorScroll}
          className="sticky top-0 z-40 h-3 overflow-x-auto overflow-y-hidden scrollbar-visible"
        >
          <div style={{ width: spacerWidth, height: 1 }} />
        </div>
      )}
      <div
        ref={bodyRef}
        onScroll={handleBodyScroll}
        className="overflow-auto scrollbar-visible"
        style={{ maxHeight }}
      >
        {tableWithRef}
      </div>
    </div>
  );
}
