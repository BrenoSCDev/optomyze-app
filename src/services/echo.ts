import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

const echo = new Echo({
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
      Authorization: `Bearer ${localStorage.getItem('optomyze_auth_token')}`,
      Accept: 'application/json'
    },
  },
});

export default echo;
