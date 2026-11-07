/** Number of retries, true = forever, false = none, or decide per failure. */
export type RetryValue = boolean | number | ((failureCount: number, error: unknown) => boolean)
export type RetryDelayValue = number | ((failureCount: number, error: unknown) => number)

export interface RetryOptions {
	/** Default 0 for imperative fetches. `failureCount` counts failures so far (1 on the first). */
	retry?: RetryValue | undefined
	/** Ms to wait before retrying. Default: exponential backoff 1s, 2s, 4s ... capped at 30s. */
	retryDelay?: RetryDelayValue | undefined
}

export function shouldRetry(retry: RetryValue | undefined, failureCount: number, error: unknown): boolean {
	if (typeof retry === "function") return retry(failureCount, error)
	if (typeof retry === "number") return failureCount <= retry
	return retry === true
}

export function getRetryDelay(delay: RetryDelayValue | undefined, failureCount: number, error: unknown): number {
	if (typeof delay === "function") return delay(failureCount, error)
	return delay ?? Math.min(1000 * 2 ** (failureCount - 1), 30_000)
}
