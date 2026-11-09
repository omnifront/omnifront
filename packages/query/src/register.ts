/**
 * Augment this to set the error type of every query and mutation that does not name its own:
 *
 *   declare module "@omnifront/query" {
 *     interface Register {
 *       defaultError: ApiError
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- exists to be augmented
export interface Register {}

/** `Error`, unless `Register` says otherwise. Types only: nothing checks what a query function throws. */
export type DefaultError = Register extends { defaultError: infer TError } ? TError : Error
