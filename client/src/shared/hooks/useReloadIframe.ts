import { useRef, useCallback } from "react";

export const useReloadIframe = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reload = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      iframe.contentWindow?.location.reload();
    } catch {
      const baseUrl = iframe.src.split("?")[0];
      iframe.src = `${baseUrl}?t=${Date.now()}`;
    }
  }, []);

  return { iframeRef, reload };
};
