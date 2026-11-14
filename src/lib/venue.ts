/**
 * Trading venue copy, in one place. The DEX is being changed and what it exposes
 * publicly isn't confirmed yet, so the site only claims what is true either way:
 * trades settle on-chain.
 *
 * When the founder confirms the DEX can be named, set `name` (e.g. "Hyperliquid")
 * and the market copy picks it up. When traders can look up their account on a
 * block explorer, set `explorerUrl` to surface a "Verify on-chain" link.
 */
export const venue = {
  name: null as string | null,
  explorerUrl: null as string | null,
};

/** Label form, e.g. "On-chain perps" or "Hyperliquid perps" */
export const marketsLabel = venue.name ? `${venue.name} perps` : "On-chain perps";
/** Mid-sentence form, e.g. "on-chain perps" or "Hyperliquid perps" */
export const marketsPhrase = venue.name ? `${venue.name} perps` : "on-chain perps";
