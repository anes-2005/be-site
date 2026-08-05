import { useEffect, useState, useCallback } from 'react';

// Minimal hash-based router. Routes:
//   #/                       Home
//   #/store                  Store
//   #/collection/:slug       Collection template
//   #/confirmation           Confirmation (after preorder submit)
//   #/admin                  Admin dashboard
//   #/admin/collection/:id   Collection editor
//   #/admin/preorders        Preorders list

export interface Route {
  path: string;
  params: Record<string, string>;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const segments = path.split('/').filter(Boolean);
  const params: Record<string, string> = {};
  if (query) {
    new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  }

  if (segments.length === 0) return { path: '/', params };
  if (segments.length === 1 && segments[0] === 'store') return { path: '/store', params };
  if (segments.length === 1 && segments[0] === 'about') return { path: '/about', params };
  if (segments.length === 1 && segments[0] === 'confirmation') return { path: '/confirmation', params };
  if (segments.length === 2 && segments[0] === 'collection') {
    return { path: '/collection/:slug', params: { slug: decodeURIComponent(segments[1]) } };
  }
  if (segments[0] === 'admin') {
    if (segments.length === 1) return { path: '/admin', params };
    if (segments.length === 2 && segments[1] === 'collections') return { path: '/admin/collections', params };
    if (segments.length === 2 && segments[1] === 'preorders') return { path: '/admin/preorders', params };
    if (segments.length === 2 && segments[1] === 'settings') return { path: '/admin/settings', params };
    if (segments.length === 2 && segments[1] === 'media') return { path: '/admin/media', params };
    if (segments.length === 2 && segments[1] === 'analytics') return { path: '/admin/analytics', params };
    if (segments.length === 2 && segments[1] === 'google') return { path: '/admin/google', params };
    if (segments.length === 2 && segments[1] === 'story') return { path: '/admin/story', params };
    if (segments.length === 3 && segments[1] === 'collection') {
      return { path: '/admin/collection/:id', params: { id: decodeURIComponent(segments[2]) } };
    }
  }
  return { path: '/not-found', params };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}

export function navigate(to: string) {
  if (to.startsWith('#')) window.location.hash = to.slice(1);
  else window.location.hash = to;
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
}
