import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_SCALE = 0.55;

export default function useViewport() {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { isMobile: false, mobileScale: 1 };
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    return { isMobile, mobileScale: isMobile ? MOBILE_SCALE : 1 };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setState({ isMobile, mobileScale: isMobile ? MOBILE_SCALE : 1 });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}
