/**
 * LARAVEL ECHO CONFIGURATION
 * 
 * Configures Laravel Echo with Reverb WebSocket server for real-time messaging
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Echo
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}
window.Pusher = Pusher;

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('optomyze_token');
};

// Initialize Laravel Echo with Reverb configuration
const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: parseInt(import.meta.env.VITE_REVERB_PORT ?? '8090'),
  wssPort: parseInt(import.meta.env.VITE_REVERB_PORT ?? '8090'),
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept: 'application/json',
    }
  }
});

export default echo;

// Re-export for convenience
export { getAuthToken };
