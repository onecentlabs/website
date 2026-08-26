import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "What OneCent Labs is, what the Router does, and which networks it supports.",
  alternates: { canonical: "/docs" },
};

const CHAINS = [
  ["Base", "L2, live"],
  ["Arbitrum", "L2, live"],
  ["Ethereum", "Mainnet, coming soon"],
];

export default function DocsOverviewPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Start here</span>
      <h1>What is OneCent?</h1>
      <p className="doc-lead">
        OneCent Labs builds execution infrastructure for on-chain trading. You state an
        outcome (this token, that chain, this amount) and OneCent solves the route and
        returns a transaction to sign.
      </p>

      <h2>Services</h2>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Router</dt>
          <dd>
            Solves execution across every integrated venue on the network you are trading:
            110+ liquidity modules on Arbitrum (100+ AMM and DEX protocols plus 11 RFQ market
            makers) over 38,000+ indexed pools, and 80+ modules on Base (70+ AMM and DEX plus
            the same 11 RFQ) over 20,000+ pools. Each protocol is integrated with its own
            math rather than a generic interface, so quotes reflect how that venue actually
            prices.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Bridge</dt>
          <dd>
            Moves value between chains with liquidity-aware bridge selection and settlement
            tracking.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Rates</dt>
          <dd>
            A fused mid-price from on-chain pools, order books and intent flow, with a
            confidence signal where more than one path supports the rate.
          </dd>
        </div>
      </dl>

      <h2>How a trade works</h2>
      <ol>
        <li>
          <strong>Intent.</strong> Pick input asset, output asset and amount.
        </li>
        <li>
          <strong>Search.</strong> Candidate paths are built from indexed pool state and RFQ
          quotes, priced with each protocol&apos;s own curve, and split across pools where
          that improves the result. Routes are ranked on output by default; ranking net of
          execution cost is available on request through the API.
        </li>
        <li>
          <strong>Quote.</strong> The winning route is simulated against current chain state
          and returned with output amount, minimum received and gas.
        </li>
        <li>
          <strong>Settle.</strong> You sign one transaction built from the quote&apos;s
          calldata.
        </li>
      </ol>

      <h2>Supported networks</h2>
      <dl className="doc-defs">
        {CHAINS.map(([name, note]) => (
          <div className="doc-def" key={name}>
            <dt>{name}</dt>
            <dd>{note}</dd>
          </div>
        ))}
      </dl>
      <p>
        Same chain in and out is a swap; different chains is a bridge. More networks are
        added as routing quality on them is validated.
      </p>

      <h2>Next</h2>
      <ul>
        <li>
          <Link href="/docs/quickstart">Quickstart</Link>: your first trade.
        </li>
        <li>
          <Link href="/docs/trading">Trading</Link>: the trade widget in detail.
        </li>
        <li>
          <Link href="/docs/api">API access</Link>: the engine over HTTP.
        </li>
      </ul>
    </article>
  );
}
