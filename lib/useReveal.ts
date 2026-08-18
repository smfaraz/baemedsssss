import { useCallback, useEffect, useState } from 'react';

/**
 * Adds `.is-visible` to elements carrying `.reveal-on-scroll` inside the ref once
 * they scroll into view. Pairs with the CSS reveal transition in index.css and
 * respects prefers-reduced-motion (elements are shown immediately).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const [root, setRoot] = useState<T | null>(null);
  const containerRef = useCallback((node: T | null) => setRoot(node), []);

  useEffect(() => {
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll('.reveal-on-scroll')) as HTMLElement[];
    // Support refs placed directly on a reveal element (not just an ancestor).
    if (root.classList.contains('reveal-on-scroll')) nodes.push(root);
    if (nodes.length === 0) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [root]);

  return containerRef;
}
