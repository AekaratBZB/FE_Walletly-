const pending = new Map();

/** Injects a script once per src. A failed load is forgotten so a retry can try again. */
export const loadScript = (src) => {
  if (!pending.has(src)) {
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        pending.delete(src);
        script.remove();
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
    pending.set(src, promise);
  }
  return pending.get(src);
};
