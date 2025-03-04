// lib/analytics/mixpanel.ts
import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel with your project token
// In a real app, this should come from an environment variable
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '5a02213e8d3e2088ed7879dbbb292e4b';

// Only initialize in the browser, not during SSR
if (typeof window !== 'undefined') {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: true,
    persistence: 'localStorage',
  });
}

// Track event helper
export const track = (eventName: string, properties?: Record<string, unknown>) => {
  mixpanel.track(eventName, properties);
};

// Identify user helper
export const identify = (userId: string) => {
  mixpanel.identify(userId);
};

// Set user properties
export const setUserProperties = (properties: Record<string, unknown>) => {
  mixpanel.people.set(properties);
};

// Track page view
export const trackPageView = (pageName: string) => {
  track('Page View', { page: pageName });
};

// Reset user identity (on logout)
export const reset = () => {
  mixpanel.reset();
};

// Define common events
export const ANALYTICS_EVENTS = {
  SIGN_UP: 'Sign Up',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  VIEW_EVENT: 'View Event',
  PLACE_BET: 'Place Bet',
  VIEW_PROFILE: 'View Profile',
  CHANGE_LANGUAGE: 'Change Language',
  USE_REFERRAL: 'Use Referral Code',
  CREATE_REFERRAL: 'Create Referral',
  
  // Referral program specific events
  REFERRAL_LINK_COPIED: 'Referral Link Copied',
  REFERRAL_SIGNUP_COMPLETED: 'Referral Signup Completed',
  FIRST_BET_PLACED: 'First Bet Placed',
  REFERRAL_REWARD_EARNED: 'Referral Reward Earned',
  REFERRAL_BONUS_RECEIVED: 'Referral Bonus Received',
};