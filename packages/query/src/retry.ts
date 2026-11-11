import type { DefaultError } from "./register"

/** Number of retries, true = forever, false = none, or decide per failure. */
export type RetryValue<TError = DefaultError> = boolean | number | ((failureCount: number, error: TError) => boolean)
export type RetryDelayValue<TError = DefaultError> = number | ((failureCount: number, error: TError) => number)

export interface RetryOptions<TError = DefaultError> {
	/** Default 0 for imperative fetches. `failureCount` counts failures so far (1 on the first). */
	retry?: RetryValue<TError> | undefined
	/** Ms to wait before retrying. Default: exponential backoff 1s, 2s, 4s ... capped at 30s. */
	retryDelay?: RetryDelayValue<TError> | undefined
}

export function shouldRetry<TError>(retry: RetryValue<TError> | undefined, failureCount: number, error: TError): boolean {
	if (typeof retry === "function") return retry(failureCount, error)
	if (typeof retry === "number") return failureCount <= retry
	return retry === true
}

export function getRetryDelay<TError>(delay: RetryDelayValue<TError> | undefined, failureCount: number, error: TError): number {
	if (typeof delay === "function") return delay(failureCount, error)
	return delay ?? Math.min(1000 * 2 ** (failureCount - 1), 30_000)
}
