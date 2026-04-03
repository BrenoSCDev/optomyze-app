import { useState, useEffect } from 'react';
import api from '@/services/api';

// Module-level cache persists across component mounts for the session
const urlCache = new Map<string, string>();

/**
 * Fetches a private file from the backend (requires auth) and returns a blob URL.
 * Handles absolute URLs (http/https) by returning them as-is.
 * Results are cached for the lifetime of the browser session.
 */
export function usePrivateFile(path: string | null | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return urlCache.get(path);
  });

  useEffect(() => {
    if (!path) {
      setUrl(undefined);
      return;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      setUrl(path);
      return;
    }

    const cached = urlCache.get(path);
    if (cached) {
      setUrl(cached);
      return;
    }

    let cancelled = false;

    api
      .get(`/api/files/${path}`, { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(response.data);
        urlCache.set(path, objectUrl);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

/**
 * Programmatically download a private file through the authenticated API.
 */
export async function downloadPrivateFile(path: string, filename: string): Promise<void> {
  const response = await api.get(`/api/files/${path}`, {
    responseType: 'blob',
    params: { download: 1 },
  });

  const objectUrl = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
