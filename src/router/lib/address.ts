import { getAddress } from "viem";
import type { ChainKind } from "./chains";

/**
 * Chain-family aware recipient address handling. Today only EVM chains are
 * supported; Solana ("svm") is stubbed so the recipient flow can branch on the
 * output chain's family when it lands (Base58 validation, different length).
 */
export type { ChainKind };

/**
 * Normalize an address to its canonical on-chain form, or null if invalid.
 *  - EVM: viem's getAddress applies the EIP-55 checksum. It throws on bad
 *    length/characters AND on a mismatched checksum for mixed-case input, so a
 *    non-null result doubles as validation. Lowercase input is accepted and
 *    returned checksummed (e.g. 0xabc… → 0xAbC…).
 */
export function normalizeRecipient(address: string, kind: ChainKind = "evm"): string | null {
  const a = address.trim();
  if (!a) return null;
  if (kind === "evm") {
    try {
      return getAddress(a);
    } catch {
      return null;
    }
  }
  // svm (Solana): TODO — Base58 decode + 32-byte length check.
  return null;
}

/** True when the address is valid for the given chain family (checksum-aware). */
export function isValidRecipient(address: string, kind: ChainKind = "evm"): boolean {
  return normalizeRecipient(address, kind) !== null;
}

/** Case-insensitive equality that respects the chain family. */
export function addressesEqual(a: string, b: string, kind: ChainKind = "evm"): boolean {
  const na = normalizeRecipient(a, kind);
  const nb = normalizeRecipient(b, kind);
  if (na && nb) return na === nb;
  // EVM addresses are case-insensitive; svm Base58 is case-sensitive.
  return kind === "evm" ? a.trim().toLowerCase() === b.trim().toLowerCase() : a.trim() === b.trim();
}
