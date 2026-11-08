import type { PersistStorage } from "./index"

export interface IndexedDBStorageOptions {
	/** Database name. Default `"omnifront"`. */
	dbName?: string
	/** Object store name. Default `"cache"`. */
	storeName?: string
}

/**
 * A `PersistStorage` backed by IndexedDB (no size limit worth worrying about, unlike
 * localStorage's ~5 MB). Values are the serialized strings the persister gives it.
 */
export function createIndexedDBStorage({ dbName = "omnifront", storeName = "cache" }: IndexedDBStorageOptions = {}): PersistStorage {
	let opened: Promise<IDBDatabase> | undefined
	const open = (): Promise<IDBDatabase> =>
		(opened ??= new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName, 1)
			request.onupgradeneeded = () => request.result.createObjectStore(storeName)
			request.onsuccess = () => resolve(request.result)
			request.onerror = () => reject(request.error)
		}))

	const run = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
		const db = await open()
		return new Promise<T>((resolve, reject) => {
			const request = operation(db.transaction(storeName, mode).objectStore(storeName))
			request.onsuccess = () => resolve(request.result)
			request.onerror = () => reject(request.error)
		})
	}

	return {
		getItem: (key) => run<string | undefined>("readonly", (store) => store.get(key)),
		setItem: async (key, value) => void (await run("readwrite", (store) => store.put(value, key))),
		removeItem: async (key) => void (await run("readwrite", (store) => store.delete(key))),
	}
}
