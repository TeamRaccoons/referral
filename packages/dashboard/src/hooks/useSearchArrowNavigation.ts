"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useReactiveEventListener(
  eventName: string,
  handler: (event: any) => void,
  element = typeof window !== "undefined" ? window : null,
) {
  // Create a ref that stores handler
  const savedHandler = useRef<React.Ref<any>>();
  // Update ref.current value if handler changes.
  // This allows our effect below to always get latest handler ...
  // ... without us needing to pass it in effect deps array ...
  // ... and potentially cause effect to re-run every render.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  useEffect(
    () => {
      if (typeof window !== "undefined") {
        // Make sure element supports addEventListener
        // On
        const isSupported = element && element.addEventListener;
        if (!isSupported) return;
        // Create event listener that calls handler function stored in ref
        const eventListener = (event: any) =>
          typeof savedHandler.current === "function" &&
          savedHandler.current(event);
        // Add event listener
        element.addEventListener(eventName, eventListener);
        // Remove event listener on cleanup
        return () => {
          element.removeEventListener(eventName, eventListener);
        };
      }
    },
    [eventName, element], // Re-run if eventName or element changes
  );
}

export const useSearchArrowNavigation = <T>({
  items,
  defaultIndex = 0,
  key,
  autoPaginateContainerId = "",
}: {
  items: T[];
  defaultIndex?: number;
  /* update key */
  key?: string;
  autoPaginateContainerId?: string;
}) => {
  const [keyboardIndex, setKeyboardIndex] = useState(-1);
  const itemsRef = useRef<React.RefObject<HTMLElement>[]>([]);
  const containerHeight =
    (
      document.getElementById(autoPaginateContainerId) as any
    )?.getBoundingClientRect() || 0;

  useEffect(() => {
    if (items.length > 0) {
      // Fix a bug where ref is lost when rerendering happens
      setTimeout(() => {
        setKeyboardIndex(defaultIndex);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key || items]);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || (e.code === "Tab" && e.shiftKey === true)) {
        e.preventDefault();

        setKeyboardIndex((prevIndex) => {
          if (prevIndex > 0) {
            // Auto scroll down
            if (
              autoPaginateContainerId &&
              itemsRef.current[keyboardIndex] &&
              (itemsRef as any).current[keyboardIndex].current?.scrollIntoView
            ) {
              const elementOffsetTop = (itemsRef as any).current[prevIndex - 1]
                .current.offsetTop;
              if (elementOffsetTop + 50 < containerHeight.height) {
                document.getElementById("search-result-list")!.scrollTop =
                  elementOffsetTop - containerHeight.top;
              }
            }

            return prevIndex - 1;
          }
          return 0;
        });
      }

      if (e.code === "ArrowDown" || (e.code === "Tab" && e.shiftKey !== true)) {
        e.preventDefault();

        setKeyboardIndex((prevIndex) => {
          if (prevIndex >= -1 && prevIndex < items.length - 1) {
            // Auto scroll down
            if (
              autoPaginateContainerId &&
              itemsRef.current[keyboardIndex] &&
              (itemsRef as any).current[keyboardIndex].current?.scrollIntoView
            ) {
              const elementOffsetTop = (itemsRef as any).current[prevIndex + 1]
                .current.offsetTop;
              if (elementOffsetTop + 50 > containerHeight.height) {
                document.getElementById("search-result-list")!.scrollTop =
                  elementOffsetTop;
              }
            }

            return prevIndex + 1;
          }
          return prevIndex;
        });
      }
    },
    [
      keyboardIndex,
      items,
      autoPaginateContainerId,
      containerHeight.height,
      containerHeight.top,
    ],
  );
  useReactiveEventListener("keydown", handler);

  const setFocusIndex = useCallback(
    (index: number) => {
      setKeyboardIndex(index);
    },
    [setKeyboardIndex],
  );

  return { itemsRef, keyboardIndex, setFocusIndex };
};

export default useSearchArrowNavigation;
