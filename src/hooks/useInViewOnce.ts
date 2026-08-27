import { useEffect, useRef, useState } from 'react';

export function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasEntered) return;
    if (!('IntersectionObserver' in window)) {
      setHasEntered(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setHasEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.18 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasEntered]);

  return { ref, hasEntered };
}
