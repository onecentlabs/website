import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings & parameters",
  description:
    "Slippage, display options, and the routing parameters behind every OneCent quote.",
  alternates: { canonical: "/docs/settings" },
};

export default function SettingsPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Router app</span>
      <h1>Settings &amp; parameters</h1>
      <p className="doc-lead">
        Two settings are user-controlled: slippage tolerance and the amount slider. The rest
        of the search is tuned by the router.
      </p>

      <h2>Max slippage</h2>
      <p>
        Slippage is the gap between the quoted price and the executed price. Your setting is
        the maximum gap you will accept before the trade should fail instead.
      </p>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Auto</dt>
          <dd>
            Default. No tolerance is sent with the quote and the engine applies its own,
            currently 3%. The minimum received on the review row reflects it.
          </dd>
        </div>
        <div className="doc-def">
          <dt>0.1%</dt>
          <dd>For deep, stable pairs.</dd>
        </div>
        <div className="doc-def">
          <dt>0.5% / 1%</dt>
          <dd>For volatile pairs or thinner liquidity.</dd>
        </div>
        <div className="doc-def">
          <dt>Custom</dt>
          <dd>
            0.01% to 50%. Wider tolerances allow worse fills than quoted.
          </dd>
        </div>
      </dl>
      <p>
        Your setting is reflected in <strong>Min received</strong> on the review row. That
        value is what the transaction enforces on chain.
      </p>

      <h2>Amount slider</h2>
      <p>
        Off by default. When enabled, a percentage slider appears under the From amount. It
        moves continuously and snaps to 0 / 25 / 50 / 75 / MAX. MAX on a native coin reserves
        gas.
      </p>

      <h2>Private trade</h2>
      <p>
        The switch in the card header submits the order without broadcasting your intent
        publicly, protecting against front-running and sandwiching while the order is in
        flight. Fields,
        quotes and execution are otherwise identical.
      </p>
      <p>
        It is not anonymity, since the settled transaction is public on chain, and it is not
        a price guarantee; your slippage tolerance still bounds the fill. The switch resets to
        Public on a fresh load.
      </p>

      <h2>Storage</h2>
      <p>
        Slippage and the slider preference are saved in your browser, per device. Nothing is
        stored on our side and no setting is tied to your wallet address. The{" "}
        <Link href="/docs/trading">custom recipient</Link> and the private-mode switch are
        deliberately not persisted.
      </p>

      <h2>Routing defaults</h2>
      <p>The app sends these with every quote and does not expose them as controls.</p>
      <dl className="doc-defs">
        <div className="doc-def">
          <dt>Max hops</dt>
          <dd>Up to three legs. Longer paths cost more in gas and execution risk.</dd>
        </div>
        <div className="doc-def">
          <dt>Simulation</dt>
          <dd>
            On. Quotes are executed against current chain state, which produces the output
            amount and gas estimate.
          </dd>
        </div>
        <div className="doc-def">
          <dt>Optimiser</dt>
          <dd>On. Splits orders across venues and searches for the best plan.</dd>
        </div>
      </dl>
    </article>
  );
}
