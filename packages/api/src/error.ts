import type { ApiConfig, ApiErrorCode, ApiResponse } from "./types"

/** Every failure of the client. `code` tells the cause apart: HTTP status, timeout, abort, network, parse. */
export class ApiError<T = unknown> extends Error {
	readonly status: number | undefined
	readonly data: T | undefined
	/** The underlying error (e.g. the fetch `TypeError`), when there is one. */
	readonly cause: unknown

	constructor(
		message: string,
		readonly code: ApiErrorCode,
		readonly config: ApiConfig,
		readonly response?: ApiResponse<T>,
		options?: { cause?: unknown },
	) {
		super(message)
		this.cause = options?.cause
		this.name = "ApiError"
		this.status = response?.status
		this.data = response?.data
	}
}

export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError
}
