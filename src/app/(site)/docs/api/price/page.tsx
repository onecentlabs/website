import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Price API",
  description:
    "Pair and USD pricing from the OneCent rates engine, fused across venues rather than read from a single pool.",
  alternates: { canonical: "/docs/api/price" },
};

export default function PriceApiPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Developers</span>
      <h1>Price API</h1>
      <p className="doc-lead">
        Read-only pricing from the same rates engine the Router uses. Two endpoints: the rate
        of one token against another, and the rate of a token in dollars.
      </p>

      <h2>Pair price</h2>
      <p>
        Returns the mid-price of a token against another on a given network. The rate is
        fused from on-chain pools, centralised order books and intent flow rather than read
        from a single pool, so a thin or manipulated pool does not set the number on its own.
      </p>

      <h2>USD price</h2>
      <p>
        Returns the same rate expressed in dollars, triangulated across several stablecoins
        instead of trusting one of them as the dollar. This is the price the Router UI
        displays, so your values and ours agree.
      </p>

      <h2>Confidence</h2>
      <p>
        A price may carry a confidence signal describing how well supported it is by current
        liquidity. It is only produced when the rate is corroborated by more than one
        independent path; with a single path there is nothing to agree or disagree with, so
        no confidence is returned. Handle its absence explicitly rather than treating it as
        zero.
      </p>
      <p>
        Where present, use it to decide whether to display a price, widen a spread or refuse
        to act on it. A low-confidence price is still a real observation, but it should not
        be treated as a fill.
      </p>

      <h2>Using it</h2>
      <ul>
        <li>
          Prices are for display, accounting and risk checks. They are not executable: a
          price does not reserve liquidity and does not account for your size.
        </li>
        <li>
          To trade, use the <Link href="/docs/api/quote">Quote API</Link>, which solves a
          route for your specific amount and returns a transaction.
        </li>
        <li>
          Prices move every block. Poll on an interval that matches how you use the number
          rather than caching it for long periods.
        </li>
        <li>Both endpoints are key-gated.</li>
      </ul>

      <h2>Access</h2>
      <p>
        Request a key through the <Link href="/#contact">contact form</Link> or by emailing{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. See{" "}
        <Link href="/docs/api">API access</Link> for how keys work.
      </p>
    </article>
  );
}
