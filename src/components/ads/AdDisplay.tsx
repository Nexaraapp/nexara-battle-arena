
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AdPlacement, trackAdImpression, trackAdClick, getAdRefreshRate } from '@/utils/adUtils';
import { ExternalLink } from 'lucide-react';

type AdSize = 'banner' | 'sidebar' | 'interstitial';

interface AdDisplayProps {
  size: AdSize;
  placement: AdPlacement;
  className?: string;
}

/**
 * AdDisplay component for showing advertisements
 * This is a placeholder that can be integrated with actual ad providers
 */
const AdDisplay: React.FC<AdDisplayProps> = ({ 
  size, 
  placement, 
  className = '' 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  
  useEffect(() => {
    // Simulate ad loading
    setIsLoaded(false);
    const timer = setTimeout(() => {
      // For demonstration, 10% chance of ad error
      if (Math.random() > 0.9) {
        setAdError('Failed to load advertisement');
      } else {
        setIsLoaded(true);
        // Track impression when ad loads
        trackAdImpression(placement);
      }
    }, 1000);
    
    // Set up periodic refresh
    const refreshRate = getAdRefreshRate();
    const refreshTimer = setInterval(() => {
      setIsLoaded(false);
      setTimeout(() => {
        if (Math.random() > 0.9) {
          setAdError('Failed to load advertisement');
        } else {
          setIsLoaded(true);
          trackAdImpression(placement);
        }
      }, 1000);
    }, refreshRate);

    return () => {
      clearTimeout(timer);
      clearInterval(refreshTimer);
    };
  }, [placement]);

  // Define dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'banner':
        return 'h-16 w-full';
      case 'sidebar':
        return 'h-96 w-full';
      case 'interstitial':
        return 'h-64 w-full';
      default:
        return 'h-24 w-full';
    }
  };

  // Handle ad click
  const handleAdClick = () => {
    trackAdClick(placement);
    // In a real implementation, this would navigate to the ad destination
  };

  // If there's an error loading the ad
  if (adError) {
    return null; // Don't show anything if ad fails to load
  }

  return (
    <Card 
      className={`overflow-hidden ${getDimensions()} ${className} bg-gradient-to-r from-nexara-accent/5 to-nexara-highlight/5 border-nexara-accent/20 cursor-pointer transition-all hover:border-nexara-accent/40`}
      onClick={handleAdClick}
    >
      {!isLoaded ? (
        <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
          Loading advertisement...
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-2">
          <div className="text-xs text-gray-500 mb-1 flex items-center">
            Advertisement
            <ExternalLink size={10} className="ml-1" />
          </div>
          <div className="flex items-center justify-center flex-1 w-full bg-nexara-accent/10 rounded">
            <div className="text-center">
              <div className="text-sm font-medium text-nexara-accent mb-1">
                {size === 'banner' ? 'Play Now!' : 'Level Up Your Gaming Experience'}
              </div>
              <div className="text-xs text-gray-400">
                {size === 'banner' 
                  ? 'Click to download' 
                  : 'Join premium for exclusive rewards and bonuses'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdDisplay;
