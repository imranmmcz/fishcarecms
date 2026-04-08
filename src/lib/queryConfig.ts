/**
 * React Query caching configuration for high-traffic optimization.
 * Provides staleTime + gcTime presets for different data types.
 */

// Products change infrequently — cache 5 min, keep in memory 30 min
export const PRODUCTS_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 30 * 60 * 1000,        // 30 minutes (garbage collection)
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

// Categories rarely change — cache 10 min
export const CATEGORIES_QUERY_CONFIG = {
  staleTime: 10 * 60 * 1000,
  gcTime: 60 * 60 * 1000,        // 1 hour
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

// Market prices update periodically — cache 2 min
export const MARKET_PRICES_QUERY_CONFIG = {
  staleTime: 2 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

// Settings / rarely changing data — cache 15 min
export const SETTINGS_QUERY_CONFIG = {
  staleTime: 15 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

// Flash sales — cache 1 min (time-sensitive)
export const FLASH_SALES_QUERY_CONFIG = {
  staleTime: 60 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: 2,
} as const;

// Default global config for QueryClient
export const GLOBAL_QUERY_DEFAULTS = {
  staleTime: 2 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 2,
  refetchOnMount: true,
} as const;
