/**
 * The site can be deployed under a sub-path (GitHub Pages project sites use
 * `/<repo>`). `next/link` adds that prefix automatically, but plain <img>,
 * <video> and CSS url() references to files in /public do not — wrap them in
 * `asset()`.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')

export function asset(path: string): string {
  if (!path) return path
  if (/^(https?:|data:|blob:|\/\/)/i.test(path)) return path
  if (BASE_PATH && path.startsWith(BASE_PATH + '/')) return path
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}

/** Strips the trailing slash that `trailingSlash: true` adds, so `/letters/` === `/letters`. */
export function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return '/'
  const withoutBase = BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || '/' : pathname
  return withoutBase.length > 1 && withoutBase.endsWith('/') ? withoutBase.slice(0, -1) : withoutBase
}
