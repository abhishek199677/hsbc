import { useCallback } from "react";

/**
 * Mouse-tracking glare: sets --mx / --my CSS variables on the element so
 * `.card-glare`'s radial highlight follows the cursor. Use together with
 * the `.card-glare` class from globals.css.
 */
export function useGlare<T extends HTMLElement>() {
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);
  return { onMouseMove };
}
