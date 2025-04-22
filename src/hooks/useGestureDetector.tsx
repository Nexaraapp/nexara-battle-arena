
import { useState, useEffect } from "react";

interface GestureDetectorOptions {
  requiredClicks?: number;
  requireAltKey?: boolean;
  logoElementId?: string;
}

export const useGestureDetector = ({
  requiredClicks = 3,
  requireAltKey = true,
  logoElementId
}: GestureDetectorOptions = {}) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const handleFastClicks = (e: MouseEvent) => {
      if (!requireAltKey || e.altKey) {
        const currentTime = Date.now();
        if (currentTime - lastClickTime < 500) {
          setClickCount((prev) => prev + 1);
        } else {
          setClickCount(1);
        }
        setLastClickTime(currentTime);
      }
    };

    // Handle logo clicks if logoElementId is provided
    const logoElement = logoElementId ? document.getElementById(logoElementId) : null;
    if (logoElement) {
      const handleLogoClick = () => {
        setClickCount((prev) => prev + 1);
      };
      logoElement.addEventListener("click", handleLogoClick);
      return () => {
        window.removeEventListener("click", handleFastClicks);
        logoElement.removeEventListener("click", handleLogoClick);
      };
    }

    window.addEventListener("click", handleFastClicks);
    return () => window.removeEventListener("click", handleFastClicks);
  }, [lastClickTime, requireAltKey, logoElementId]);

  useEffect(() => {
    if (clickCount >= requiredClicks) {
      setShowDialog(true);
      setClickCount(0);
    }
  }, [clickCount, requiredClicks]);

  return { showDialog, setShowDialog };
};
