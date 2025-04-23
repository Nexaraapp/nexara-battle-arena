
import React from "react";
import { useGestureDetector } from "@/hooks/useGestureDetector";
import { SuperadminDialog } from "./SuperadminDialog";

interface SuperadminGestureDetectorProps {
  logoElementId?: string;
}

export const SuperadminGestureDetector: React.FC<SuperadminGestureDetectorProps> = ({ 
  logoElementId = "app-logo" 
}) => {
  const { showDialog, setShowDialog } = useGestureDetector({
    requiredClicks: 5,
    requireAltKey: false,
    logoElementId
  });

  return (
    <SuperadminDialog 
      open={showDialog} 
      onOpenChange={setShowDialog} 
    />
  );
};

export default SuperadminGestureDetector;
