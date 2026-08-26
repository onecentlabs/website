import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trading",
  description:
    "Every field, readout and state of the OneCent Router trade widget explained.",
  alternates: { canonical: "/docs/trading" },
};

export default function TradingPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Router app</span>
      <h1>Trading</h1>
      <p className="doc-lead">
        Reference for the trade card: what each field contains and what each readout means.
      </p>

      <h2>The card</h2>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Section rail</dt>
          <dd>
            Switches products. <strong>Trade</strong> is live; Yields and RWAs are not yet
            available.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Public / Private</dt>
          <dd>
            Sets how the order is submitted. See{" "}
            <Link href="/docs/settings">Settings &amp; parameters</Link>.
          </dd>
        </div>
        <div className="doc-def">
          <dt>From</dt>
          <dd>
            Source network, token and amount. The token contract address sits next to the
            label and can be copied. Below: USD value of the amount and your wallet balance,
            which fills the field when tapped.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Flip</dt>
          <dd>Swaps both sides, networks and tokens together.</dd>
        </div>
        <div className="doc-def">
          <dt>To</dt>
          <dd>
            Destination network, token and quoted output. Read-only: you specify the input
            and the router solves for the output. <strong>Recipient</strong> defaults to{" "}
            <em>Self</em>.
          </dd>
        </div>
      </dl>

      <h2>Picking assets</h2>
      <p>
        The network and token pills open the same picker. Token lists come from our registry
        per network; search accepts a symbol, name or contract address. The asset selected on
        the other side is filtered out.
      </p>

      <h2>Entering an amount</h2>
      <ul>
        <li>Input is debounced: the quote fetches shortly after you stop typing.</li>
        <li>Tapping your balance fills the maximum, reserving gas on native coins.</li>
        <li>
          The optional <strong>amount slider</strong> sizes the amount as a percentage of
          your balance, snapping to 0 / 25 / 50 / 75 / MAX.
        </li>
      </ul>

      <h2>Recipient</h2>
      <p>
        Tap <strong>Recipient</strong> to send output to another address. Addresses are
        validated against the destination network before a quote is requested, and recent
        recipients are stored in your browser. A custom recipient resets on a fresh load.
      </p>

      <h2>Review row</h2>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Network cost</dt>
          <dd>
            Simulated gas usage for your route multiplied by the live gas price on the source
            network, in USD.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Max slippage</dt>
          <dd>
            Your tolerance, or <em>Auto</em> when left to the router.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Min received</dt>
          <dd>
            The floor written into the transaction. Below it the trade reverts and you keep
            your input, minus gas.
          </dd>
        </div>
      </dl>

      <h2>Quote refresh</h2>
      <p>
        Quotes are re-fetched roughly every 15 seconds and immediately on any input change,
        and are simulated against current chain state. If simulation cannot complete, the
        card falls back to the routing estimate and says so.
      </p>

      <h2>Executing</h2>
      <ol>
        <li>
          <strong>Switch network</strong> if the wallet is not on the source chain.
        </li>
        <li>
          <strong>Approve</strong>: one-off allowance for ERC-20 inputs.
        </li>
        <li>
          <strong>Trade</strong>: one signature over the quote&apos;s calldata. The router
          address in each quote is verified before signing.
        </li>
        <li>
          <strong>Confirm</strong>: explorer link on completion; bridges continue into
          settlement tracking.
        </li>
      </ol>

      <h2>Bridging</h2>
      <p>
        There is no separate bridge screen. Set <strong>To</strong> to a different network and
        the router solves the swap legs and the bridge together. You sign once, on the source
        chain. The same asset on both sides is valid.
      </p>
      <p>
        Cross-chain quotes are not simulated, so the output is a routing estimate and{" "}
        <strong>Min received</strong> derives from your slippage tolerance. After the source
        transaction confirms, the card watches the destination chain and reports success once
        the funds land. Keep gas on the destination chain if you intend to use the funds
        there.
      </p>

      <h2>Button states</h2>
      <ul>
        <li>
          <strong>Connect wallet to trade</strong>: quotes work; connecting is required only
          to sign.
        </li>
        <li>
          <strong>Insufficient balance</strong>: amount exceeds your balance on the source
          chain.
        </li>
        <li>
          <strong>Choose two different tokens</strong>: same token and chain on both sides.
        </li>
        <li>
          A red line above the button is a quote error, usually no route for that pair at that
          size.
        </li>
      </ul>
    </article>
  );
}
