
// Ad types and configuration

// Types of ad placements
export enum AdPlacement {
  HOME_BANNER = 'home_banner',
  MATCH_SIDEBAR = 'match_sidebar',
  PROFILE_BANNER = 'profile_banner',
  INTERSTITIAL = 'interstitial'
}

// Ad provider configuration
export interface AdConfig {
  enabled: boolean;
  adProvider: 'mock' | 'google' | 'custom';
  settings: {
    refreshRate?: number; // in milliseconds
    showToFreeUsers: boolean;
    showToPremiumUsers: boolean;
  };
}

// Default ad configuration
export const defaultAdConfig: AdConfig = {
  enabled: true,
  adProvider: 'mock', // Use mock ads by default
  settings: {
    refreshRate: 60000, // Refresh ads every minute
    showToFreeUsers: true,
    showToPremiumUsers: false // Don't show ads to premium users
  }
};

// Check if ads should be shown to a user
export const shouldShowAdsToUser = (isPremiumUser: boolean): boolean => {
  if (!defaultAdConfig.enabled) return false;
  
  return isPremiumUser 
    ? defaultAdConfig.settings.showToPremiumUsers
    : defaultAdConfig.settings.showToFreeUsers;
};

// Get ad refresh rate
export const getAdRefreshRate = (): number => {
  return defaultAdConfig.settings.refreshRate || 60000;
};

// Track ad impression (for analytics)
export const trackAdImpression = (placement: AdPlacement): void => {
  console.log(`Ad impression tracked for: ${placement}`);
  // In a real implementation, this would send analytics data
};

// Track ad click (for analytics)
export const trackAdClick = (placement: AdPlacement): void => {
  console.log(`Ad click tracked for: ${placement}`);
  // In a real implementation, this would send analytics data
};
