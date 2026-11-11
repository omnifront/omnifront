/** Its own module so the opt-in entries can test for it without pulling in `Query`. */
export class CancelledError extends Error {
	constructor() {
		super("Query was cancelled")
		this.name = "CancelledError"
	}
}
