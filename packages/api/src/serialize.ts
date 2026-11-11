import type { Api } from "./client"
import type { ApiConfig, ApiResponse, Headers, Params, Transform } from "./types"

export interface SerializeOptions {
	/**
	 * How array items are written. `false` (default, like axios): `a[]=1&a[]=2`. `true`: `a[0]=1&a[1]=2`.
	 * `null`: `a=1&a=2`.
	 */
	indexes?: boolean | null | undefined
	/** Write nested objects as `a.b=1` instead of `a[b]=1`. */
	dots?: boolean | undefined
}

export interface ParamsSerializerOptions extends SerializeOptions {
	/** Encode one key or value. Default `encodeURIComponent`. */
	encode?: ((value: string) => string) | undefined
}

type Leaf = string | Blob
const isBlob = (value: unknown): value is Blob => typeof Blob !== "undefined" && value instanceof Blob

/** Walk `value`, calling `emit(name, leaf)` for every primitive, Date and Blob. `undefined` is skipped; `null` is empty. */
function walk(name: string, value: unknown, options: SerializeOptions, emit: (name: string, leaf: Leaf) => void): void {
	if (value === undefined) return
	if (value === null) emit(name, "")
	else if (value instanceof Date) emit(name, value.toISOString())
	else if (isBlob(value)) emit(name, value)
	else if (Array.isArray(value)) {
		value.forEach((item: unknown, i) => {
			const nested = typeof item === "object" && item !== null && !(item instanceof Date) && !isBlob(item)
			// Nested items always need an index, or two objects in a list would merge into one.
			const suffix = options.indexes === null && !nested ? "" : options.indexes || nested ? `[${i}]` : "[]"
			walk(name + suffix, item, options, emit)
		})
	} else if (typeof value === "object") {
		for (const [k, v] of Object.entries(value)) walk(options.dots ? `${name}.${k}` : `${name}[${k}]`, v, options, emit)
	} else emit(name, String(value as string | number | boolean | bigint))
}

function entries(data: object, options: SerializeOptions, emit: (name: string, leaf: Leaf) => void): void {
	for (const [k, v] of Object.entries(data)) walk(k, v, options, emit)
}

/**
 * A `paramsSerializer` with axios's formatting options:
 *
 *   createApi({ paramsSerializer: createParamsSerializer({ indexes: null }) })   // a=1&a=2
 */
export function createParamsSerializer(options: ParamsSerializerOptions = {}): (params: Params) => string {
	const encode = options.encode ?? encodeURIComponent
	return (params) => {
		const out: string[] = []
		entries(params, options, (name, leaf) => out.push(`${encode(name)}=${encode(String(leaf))}`))
		return out.join("&")
	}
}

/** A plain object as an `application/x-www-form-urlencoded` body. */
export function toURLEncoded(data: object, options: SerializeOptions = {}): URLSearchParams {
	const out = new URLSearchParams()
	entries(data, options, (name, leaf) => out.append(name, String(leaf)))
	return out
}

/**
 * A plain object as `FormData`: nested objects become `a[b]`, arrays `a[]`, Dates ISO strings; `File`s
 * and `Blob`s are appended as they are. Pass `formData` to add to an existing one.
 */
export function toFormData(data: object, formData: FormData = new FormData(), options: SerializeOptions = {}): FormData {
	entries(data, options, (name, leaf) => formData.append(name, leaf))
	return formData
}

/** Split `a[b][0]` / `a.b` into its path. An empty segment (`a[]`) means "append". */
const path = (name: string): string[] => [...name.matchAll(/[^.[\]]+|\[\]/g)].map(([part]) => (part === "[]" ? "" : part))

/**
 * `FormData` (or `URLSearchParams`) as a plain object, the reverse of `toFormData`: `a[b]` and `a.b`
 * become nested objects, `a[]`, `a[0]` and repeated names become arrays.
 */
export function formToJSON(form: FormData | URLSearchParams): Record<string, unknown> {
	const root: Record<string, unknown> = {}
	const own = (target: object, key: string | number): boolean => Object.prototype.hasOwnProperty.call(target, key)
	form.forEach((value: unknown, name: string) => {
		const parts = path(name)
		// Names that would reach into prototypes are dropped whole.
		if (parts.some((part) => part === "__proto__" || part === "constructor" || part === "prototype")) return
		let target = root as Record<string, unknown> | unknown[]
		parts.forEach((part, i) => {
			const key: string | number = Array.isArray(target) ? (part === "" ? target.length : Number(part)) : part
			const slot = target as Record<string | number, unknown>
			if (i === parts.length - 1) {
				// A repeated plain name collects its values in an array.
				slot[key] = !Array.isArray(target) && own(slot, key) ? ([] as unknown[]).concat(slot[key], value) : value
				return
			}
			const next = parts[i + 1]!
			if (!own(slot, key) || typeof slot[key] !== "object" || slot[key] === null) {
				slot[key] = next === "" || /^\d+$/.test(next) ? [] : {}
			}
			target = slot[key] as Record<string, unknown> | unknown[]
		})
	})
	return root
}

const isPlainObject = (data: unknown): data is object =>
	typeof data === "object" && data !== null && [Object.prototype, null].includes(Object.getPrototypeOf(data) as object | null)

/**
 * A `transformRequest` that does what axios does with a plain-object body and a form `content-type`:
 * `multipart/form-data` turns it into `FormData`, `application/x-www-form-urlencoded` into a query string.
 *
 *   createApi({ transformRequest: formTransform() })
 *   api.post("/upload", { name, file }, { headers: { "content-type": "multipart/form-data" } })
 */
export function formTransform(options: SerializeOptions = {}): Transform {
	return (data: unknown, headers: Headers) => {
		const type = headers["content-type"] ?? ""
		if (!isPlainObject(data)) return data
		if (type.startsWith("multipart/form-data")) {
			delete headers["content-type"] // the runtime adds it back with the boundary
			return toFormData(data, undefined, options)
		}
		return type.startsWith("application/x-www-form-urlencoded") ? toURLEncoded(data, options) : data
	}
}

const form =
	(method: "post" | "put" | "patch") =>
	<T = unknown>(api: Api, url: string, data: object, config?: ApiConfig): Promise<ApiResponse<T>> =>
		api[method]<T>(url, isPlainObject(data) ? toFormData(data) : data, config)

/** `api.post` with the body sent as `multipart/form-data` (a plain object is converted with `toFormData`). */
export const postForm = form("post")
/** `api.put` with the body sent as `multipart/form-data`. */
export const putForm = form("put")
/** `api.patch` with the body sent as `multipart/form-data`. */
export const patchForm = form("patch")
