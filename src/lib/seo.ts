import { useEffect } from 'react';

interface SeoOptions {
  title?: string;
  description?: string;
  ogImage?: string;
}

// Updates document head for the current route. Replaces the default title/meta.
export function useSeo({ title, description, ogImage }: SeoOptions) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta('name', 'description', description);
    if (title) setMeta('property', 'og:title', title);
    if (description) setMeta('property', 'og:description', description);
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('name', 'twitter:image', ogImage);
    }
  }, [title, description, ogImage]);
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
