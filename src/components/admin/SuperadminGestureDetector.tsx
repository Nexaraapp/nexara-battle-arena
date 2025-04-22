
import React from "react";
import { useGestureDetector } from "@/hooks/useGestureDetector";
import { SuperadminDialog } from "./SuperadminDialog";

interface SuperadminGestureDetectorProps {}

export const SuperadminGestureDetector: React.FC<SuperadminGestureDetectorProps> = () => {
  const { showDialog, setShowDialog } = useGestureDetector({
    requiredClicks: 3,
    requireAltKey: true,
    logoElementId: "app-logo"
  });

  return (
    <SuperadminDialog 
      open={showDialog} 
      onOpenChange={setShowDialog} 
    />
  );
};

export default SuperadminGestureDetector;
