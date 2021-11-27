/**
 * This is used to display logo info, provide a link or inform there is one that can be downloaded from the blockchain itself
 */
export type LogoInfo = ("embedded" | {
url: string
})
/**
 * A human readable address.
 * 
 * In Cosmos, this is typically bech32 encoded. But for multi-chain smart contracts no assumptions should be made other than being UTF-8 encoded and of reasonable length.
 * 
 * This type represents a validated address. It can be created in the following ways 1. Use `Addr::unchecked(input)` 2. Use `let checked: Addr = deps.api.addr_validate(input)?` 3. Use `let checked: Addr = deps.api.addr_humanize(canonical_addr)?` 4. Deserialize from JSON. This must only be done from JSON that was validated before such as a contract's state. `Addr` must not be used in messages sent by the user because this would result in unvalidated instances.
 * 
 * This type is immutable. If you really need to mutate it (Really? Are you sure?), create a mutable copy using `let mut mutable = Addr::to_string()` and operate on that `String` instance.
 */
export type Addr = string

export interface MarketingInfoResponse {
/**
 * A longer description of the token and it's utility. Designed for tooltips or such
 */
description?: (string | null)
/**
 * A link to the logo, or a comment there is an on-chain logo stored
 */
logo?: (LogoInfo | null)
/**
 * The address (if any) who can update this data structure
 */
marketing?: (Addr | null)
/**
 * A URL pointing to the project behind this token.
 */
project?: (string | null)
[k: string]: unknown
}
