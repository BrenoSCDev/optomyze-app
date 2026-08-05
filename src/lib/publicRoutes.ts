/**
 * PUBLIC ROUTES
 *
 * Paths served to people who are not CRM users — today just the booking page.
 *
 * The CRM's app-wide chrome (the Optus bubble) and its app-wide theming both
 * assume a signed-in user, and both are mounted above the router. Neither can
 * ask React Router where it is, so they check the location directly through
 * this helper. Keeping the list in one place is what stops the next public
 * page from having to rediscover both of them.
 */

export const PUBLIC_ROUTE_PREFIXES = ['/book/'] as const;

export const isPublicRoute = (pathname: string = window.location.pathname): boolean =>
  PUBLIC_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
