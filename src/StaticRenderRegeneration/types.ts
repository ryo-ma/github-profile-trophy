export interface StaticRegenerationOptions {
  // The number of milliseconds before the page should be revalidated
  revalidate?: number;
  // The headers to be sent with the response
  headers?: Headers;
}
