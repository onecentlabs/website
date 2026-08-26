import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Connect a wallet and make your first trade on the OneCent Router.",
  alternates: { canonical: "/docs/quickstart" },
};

export default function QuickstartPage() {
  return (
    <article className="doc-body">
      <span className="pixel-tag">Start here</span>
      <h1>Quickstart</h1>
      <p className="doc-lead">
        Nothing to install and no account to create. The app uses whatever wallet you
        connect.
      </p>

      <h2>1. Open the Router</h2>
      <p>
        Go to <Link href="/router">the Router</Link>. Quotes work before you connect, so you
        can price a trade first.
      </p>

      <h2>2. Connect a wallet</h2>
      <p>
        Press <strong>Connect wallet to trade</strong>. Supported: MetaMask, Coinbase Wallet,
        WalletConnect and injected browser extensions such as Rabby. An embedded wallet can
        also be created with an email or social login. Your address and a disconnect control
        then appear in the top bar.
      </p>

      <h2>3. Choose assets and amount</h2>
      <ol>
        <li>
          In the <strong>From</strong> card, use the network pill to change chain and the
          token pill to change asset.
        </li>
        <li>
          Enter an amount. Tap your balance to fill the maximum; on the native coin a gas
          reserve is held back.
        </li>
        <li>
          Set the <strong>To</strong> card the same way. A different network makes the trade
          a bridge.
        </li>
      </ol>

      <h2>4. Review</h2>
      <p>
        Above the button: estimated <strong>network cost</strong> in USD, your{" "}
        <strong>max slippage</strong>, and <strong>minimum received</strong>, the floor
        enforced on chain.
      </p>

      <h2>5. Trade</h2>
      <ol>
        <li>If your wallet is on another network, the app requests a switch.</li>
        <li>
          ERC-20 inputs need a one-off <strong>approval</strong>. Native coins skip this.
        </li>
        <li>Confirm the transaction in your wallet.</li>
        <li>
          A notification with an explorer link appears on confirmation. Bridges continue into
          settlement tracking on the destination chain.
        </li>
      </ol>

      <h2>Next</h2>
      <ul>
        <li>
          <Link href="/docs/trading">Trading</Link>: the widget in detail.
        </li>
        <li>
          <Link href="/docs/settings">Settings &amp; parameters</Link>: slippage and routing
          defaults.
        </li>
      </ul>
    </article>
  );
}
