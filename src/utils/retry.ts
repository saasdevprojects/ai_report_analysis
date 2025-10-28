/**
 * Retry a function with exponential backoff
 * @param fn Async function to retry
 * @param options Retry options
 * @returns Result of the function call
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we shouldn't or if we've reached max retries
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw lastError;
}

/**
 * Create a retry wrapper for Supabase queries
 */
export function withSupabaseRetry<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  }
): Promise<{ data: T | null; error: any }> {
  return withRetry(
    async () => {
      const { data, error } = await query();
      // Only retry on network errors or 5xx server errors
      if (error && (error.code === 'ECONNABORTED' || (error.code && error.code >= 500))) {
        throw error; // This will trigger a retry
      }
      return { data, error };
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      ...options,
    }
  );
}
