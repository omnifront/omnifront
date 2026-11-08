/** `value` itself, or what it returns when it is a function (initialData, placeholderData, updaters). */
export const resolve = <T, A extends unknown[]>(value: T | ((...args: A) => T), ...args: A): T =>
	typeof value === "function" ? (value as (...args: A) => T)(...args) : value
