import { useEffect, useState, useCallback } from 'react';

const TOKEN_KEY = 'be_admin_token';
const FUNCTION_PATH = '/functions/v1/admin-auth';

function functionUrl(action: 'login' | 'verify'): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  return `${url}${FUNCTION_PATH}?action=${action}`;
}

function anonHeaders(): Record<string, string> {
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return {
    'Content-Type': 'application/json',
    apikey: anon,
    Authorization: `Bearer ${anon}`,
  };
}

function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export interface AdminAuthState {
  authenticated: boolean;
  loading: boolean;
  error: string;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

export function useAdminAuth(): AdminAuthState {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const verify = useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(functionUrl('verify'), {
        method: 'POST',
        headers: anonHeaders(),
        body: JSON.stringify({ token }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { valid?: boolean };
      return data.valid === true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = readToken();
      if (!token) {
        if (active) {
          setAuthenticated(false);
          setLoading(false);
        }
        return;
      }
      const ok = await verify(token);
      if (!active) return;
      if (!ok) writeToken(null);
      setAuthenticated(ok);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [verify]);

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      setError('');
      try {
        const res = await fetch(functionUrl('login'), {
          method: 'POST',
          headers: anonHeaders(),
          body: JSON.stringify({ password }),
        });
        const data = (await res.json()) as { token?: string; error?: string };
        if (!res.ok || !data.token) {
          setError(data.error || 'Incorrect password.');
          return false;
        }
        writeToken(data.token);
        setAuthenticated(true);
        return true;
      } catch {
        setError('Could not reach the server. Please try again.');
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    writeToken(null);
    setAuthenticated(false);
  }, []);

  return { authenticated, loading, error, login, logout };
}
