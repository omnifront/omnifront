export interface Subscribable<TSnapshot> {
	subscribe(listener: () => void): () => void
	getSnapshot(): TSnapshot
	getServerSnapshot?(): TSnapshot
}
