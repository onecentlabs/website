import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Quote API",
  description:
    "What the OneCent quote endpoint can do: routing, simulation, bridging, private mode, and how to get access.",
  alternates: { canonical: "/docs/api/quote" },
};

export default function QuoteApiPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Developers</span>
      <h1>Quote API</h1>
      <p className="doc-lead">
        One request describes a trade. The response contains the route, the amounts, the cost
        and the transaction to sign. There is no separate build call.
      </p>

      <h2>Capabilities</h2>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Solve a trade</dt>
          <dd>
            Searches 80+ liquidity modules, 70+ AMM and DEX protocols plus 11 RFQ market
            makers, across 38,000+ indexed pools. Each protocol is priced with its own curve,
            AMM and RFQ liquidity compete in the same search, and the order is split across
            pools where that improves the result.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Return a transaction</dt>
          <dd>
            The response includes the contract to call and the calldata to send, ready to sign
            from your own wallet. Non-custodial throughout.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Enforce a floor</dt>
          <dd>
            Slippage tolerance becomes a minimum written into the transaction. Below it the
            trade reverts.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Simulate before signing</dt>
          <dd>
            Routes are simulated against current chain state, so output and gas are measured
            rather than modelled. Can be disabled for faster indicative quotes.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Separate signer and receiver</dt>
          <dd>
            Send output to an address other than the signer, and price trades for addresses
            that do not yet hold the input.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Bound the search</dt>
          <dd>Cap route length and slippage tolerance per request.</dd>
        </div>
        <div className="doc-def">
          <dt>Speed profiles</dt>
          <dd>
            A tight budget for interactive quotes, or a wider search for depth discovery.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Rank net of gas</dt>
          <dd>Optionally select the winning route after execution cost rather than on gross output.</dd>
        </div>
        <div className="doc-def">
          <dt>Bridge in one call</dt>
          <dd>
            Name a destination network and the request solves swap legs and bridge together,
            with one transaction on the source chain. Enabled per key.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Private mode</dt>
          <dd>
            Submit without broadcasting intent publicly, protecting against front-running
            and sandwiching while the order is in flight. Enabled per key.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Token metadata</dt>
          <dd>
            Request decimals and USD values for both sides alongside the quote, avoiding
            extra lookups.
          </dd>
        </div>
      </dl>

      <h2>Access</h2>
      <p>
        Quoting is key-gated. <Link href="/#contact">Contact us</Link> or email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> with what you are building, your
        expected volume and the networks you need. You receive:
      </p>
      <ul>
        <li>A key scoped to the endpoints you use.</li>
        <li>
          The full reference: parameters and defaults, response fields, error codes and your
          limits.
        </li>
        <li>Bridging and private mode enabled on request.</li>
      </ul>

      <h2>Support and errors</h2>
      <ul>
        <li>
          Every response carries an id. Error bodies are intentionally opaque; send us the id
          and we can trace the exact cause, down to the block the quote was solved against.
        </li>
        <li>Log that id alongside your own request records.</li>
        <li>You can attach your own correlation id, which we echo back and store beside ours.</li>
        <li>Quote records are retained for a few days, then rolled off.</li>
        <li>
          At capacity the engine rejects requests rather than serving them slowly. Back off
          briefly and retry.
        </li>
      </ul>
    </article>
  );
}
