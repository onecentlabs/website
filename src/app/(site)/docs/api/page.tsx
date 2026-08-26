import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "API access",
  description:
    "The OneCent engine as an HTTP API: what is available, how keys work, and how to request access.",
  alternates: { canonical: "/docs/api" },
};

export default function ApiPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Developers</span>
      <h1>API access</h1>
      <p className="doc-lead">
        The Router app is one client of our engine. The same routing, quoting and pricing is
        available over HTTP: 110+ liquidity modules and 38,000+ indexed pools on Arbitrum,
        80+ modules and 20,000+ pools on Base.
      </p>

      <h2>Endpoints</h2>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Quote</dt>
          <dd>
            Describe a trade and receive the solved route as an executable transaction. See{" "}
            <Link href="/docs/api/quote">Quote API</Link>.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Pair price</dt>
          <dd>
            Mid-price of a token against another on a given network, with a confidence
            signal where the rate is supported by more than one path. See{" "}
            <Link href="/docs/api/price">Price API</Link>.
          </dd>
        </div>
        <div className="doc-def">
          <dt>USD price</dt>
          <dd>
            The same rate in dollars, triangulated across multiple stablecoins. This is what
            the Router UI displays.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Health</dt>
          <dd>Liveness probe for monitoring. No key required.</dd>
        </div>
      </dl>

      <h2>Access</h2>
      <ul>
        <li>Keys are issued per integrator; there is no self-serve signup.</li>
        <li>One key per integration, sent on every request and scoped to the endpoints you need.</li>
        <li>
          Keys are server-side credentials. Do not ship one in a browser bundle or mobile
          app.
        </li>
        <li>
          Capacity is managed globally rather than by per-key rate limits. Tell us your
          expected volume so we can plan for it.
        </li>
      </ul>

      <h2>Operating notes</h2>
      <ul>
        <li>
          <strong>Quotes are perishable.</strong> Re-quote on a short interval and sign
          promptly.
        </li>
        <li>
          <strong>Load shedding.</strong> Quoting runs a bounded number of solves at once.
          Beyond that, requests wait briefly for a slot and are then rejected rather than
          served slowly. Those rejections are retryable and say nothing about your request.
        </li>
        <li>
          <strong>Response ids.</strong> Errors are terse but each response carries an id we
          can trace. See <Link href="/docs/api/quote">Quote API</Link>.
        </li>
        <li>
          <strong>Correlation ids.</strong> Attach your own and we echo it back and log it
          beside ours.
        </li>
      </ul>

      <h2>Requesting access</h2>
      <p>
        Tell us what you are building, your expected volume and the networks you need. We
        return a key, the full reference, and enable bridging or private mode if required.
      </p>
      <ul>
        <li>
          <Link href="/#contact">Contact form</Link>
        </li>
        <li>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
      </ul>
    </article>
  );
}
