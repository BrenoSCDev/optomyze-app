import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EchoInstance = Echo<any>;

// Echo instance - lazily initialized
let echoInstance: EchoInstance | null = null;

/**
 * Creates a new Echo instance with current auth token
 * Only call this after authentication is complete
 */
export const initEcho = (): EchoInstance => {
  const token = localStorage.getItem('optomyze_auth_token');
  
  if (!token) {
    console.warn('⚠️ initEcho called without auth token');
  }

  // Disconnect existing instance if any
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.warn('⚠️ Error disconnecting previous Echo instance:', e);
    }
  }

  console.log('🔌 Initializing Echo with auth token');

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT),
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws'],
    authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
    },
  });

  return echoInstance;
};

/**
 * Gets the current Echo instance
 * Returns null if not yet initialized
 */
export const getEcho = (): EchoInstance | null => {
  return echoInstance;
};

/**
 * Disconnects and cleans up the Echo instance
 * Call this on logout
 */
export const disconnectEcho = (): void => {
  if (echoInstance) {
    console.log('🔌 Disconnecting Echo');
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.warn('⚠️ Error disconnecting Echo:', e);
    }
    echoInstance = null;
  }
};

/**
 * Checks if Echo is currently initialized
 */
export const isEchoInitialized = (): boolean => {
  return echoInstance !== null;
};
