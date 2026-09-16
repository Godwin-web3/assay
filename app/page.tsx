"use client";

import { useEffect, useState } from "react";
import { KIND_LABEL, type CatalogToken } from "@/lib/catalog";

type Page = {
  token: CatalogToken;
  price: number | null;
  vsCohort: number | null;
  error: string | null;
  mintState: {
    decimals: number | null;
    supplyUi: number | null;
    scaledSupply: number | null;
    mintAuthority: string | null;
    freezeAuthority: string | null;
    program: string | null;
    extensions: string[];
    multiplier: number | null;
  } | null;
};

type Book = { asOf: string; sources: { overnightOfficialNav: boolean }; pages: Page[] };

type WalletLine = {
  token: CatalogToken;
  kindLabel: string;
  rawUi: number;
  scaledUi: number;
  multiplier: number | null;
  price: number | null;
  mark: number | null;
};

type WalletBook = {
  owner: string;
  asOf: string;
  lines: WalletLine[];
  otherTokenAccounts: number;
  note: string;
  error?: string;
};

export default function Home() {
  const [group, setGroup] = useState<"spacex" | "apple">("spacex");
  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState("reading ledger");
  const [owner, setOwner] = useState("");
  const [wallet, setWallet] = useState<WalletBook | null>(null);
  const [walletStatus, setWalletStatus] = useState("");

  useEffect(() => {
    let dead = false;
    setStatus("reading ledger");
    fetch(`/api/book?group=${group}`)
      .then((r) => r.json())
      .then((data: Book) => {
        if (!dead) {
          setBook(data);
          setStatus("");
        }
      })
      .catch(() => {
        if (!dead) setStatus("rpc failed");
      });
    return () => {
      dead = true;
    };
  }, [group]);

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <div className="mark">Assay</div>
          <h1>Do not trust the label on the box.</h1>
          <p className="lede">
            Same underlying name can be a tracker certificate, a structured note,
            a gated redeemable share, or SPV exposure. Assay reads the mint and
            puts the legal claim next to the live token.
          </p>
        </div>
      </header>

      <form
        className="wallet"
        onSubmit={(e) => {
          e.preventDefault();
          const addr = owner.trim();
          if (!addr) return;
          setWalletStatus("reading wallet");
          setWallet(null);
          fetch(`/api/wallet?owner=${encodeURIComponent(addr)}`)
            .then(async (r) => {
              const data = (await r.json()) as WalletBook;
              setWallet(data);
              setWalletStatus(data.error ?? "");
            })
            .catch(() => setWalletStatus("wallet read failed"));
        }}
      >
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="paste a Solana wallet"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit">read book</button>
      </form>
      {walletStatus && <p className="issuer">{walletStatus}</p>}
      {wallet && !wallet.error && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="badge">wallet book</div>
          <h2 className="sym">What this address actually holds</h2>
          <p className="issuer">{wallet.owner}</p>
          <p className="claim">{wallet.note}</p>
          {wallet.lines.length === 0 && (
            <p className="warn">No catalogued tokenized stocks in this wallet.</p>
          )}
          {wallet.lines.map((line) => (
            <dl key={line.token.mint} style={{ marginBottom: 12 }}>
              <dt>{line.token.symbol}</dt>
              <dd className="plain">{line.kindLabel}</dd>
              <dt>raw</dt>
              <dd className="plain">{line.rawUi.toLocaleString()}</dd>
              <dt>scaled</dt>
              <dd className="plain">{line.scaledUi.toLocaleString()}</dd>
              <dt>multiplier</dt>
              <dd className="plain">{line.multiplier ?? "none"}</dd>
              <dt>mark</dt>
              <dd className="plain">
                {line.mark !== null ? `$${line.mark.toFixed(2)}` : "no pool print"}
              </dd>
            </dl>
          ))}
          <p className="issuer">
            Other token accounts ignored: {wallet.otherTokenAccounts}
          </p>
        </section>
      )}

      <div className="tabs">
        <button
          className={group === "spacex" ? "tab on" : "tab"}
          onClick={() => setGroup("spacex")}
        >
          SpaceX four claims
        </button>
        <button
          className={group === "apple" ? "tab on" : "tab"}
          onClick={() => setGroup("apple")}
        >
          AAPL multiplier
        </button>
      </div>

      {status && <p className="issuer">{status}</p>}

      <section className={group === "spacex" ? "grid two" : "grid"}>
        {book?.pages.map((page) => (
          <article className="card" key={page.token.mint}>
            <div className="badge">{KIND_LABEL[page.token.kind]}</div>
            <h2 className="sym">{page.token.symbol}</h2>
            <p className="issuer">
              {page.token.issuer} · {page.token.underlying}
            </p>
            <p className="claim">{page.token.claim}</p>
            <p className="warn">{page.token.notTheShare}</p>
            {page.error && <p className="err">{page.error}</p>}
            <dl>
              <dt>mint</dt>
              <dd>{page.token.mint}</dd>
              <dt>program</dt>
              <dd>{page.mintState?.program ?? "-"}</dd>
              <dt>mint authority</dt>
              <dd>{page.mintState?.mintAuthority ?? "none"}</dd>
              <dt>freeze</dt>
              <dd>{page.mintState?.freezeAuthority ?? "none"}</dd>
              <dt>extensions</dt>
              <dd className="plain">
                {page.mintState?.extensions.length
                  ? page.mintState.extensions.join(", ")
                  : "none parsed"}
              </dd>
              <dt>multiplier</dt>
              <dd className="plain">
                {page.mintState?.multiplier ?? "not present"}
              </dd>
              <dt>raw supply</dt>
              <dd className="plain">
                {page.mintState?.supplyUi?.toLocaleString() ?? "-"}
              </dd>
              <dt>scaled supply</dt>
              <dd className="plain">
                {page.mintState?.scaledSupply?.toLocaleString() ?? "-"}
              </dd>
              <dt>pool price</dt>
              <dd className="plain">
                {page.price !== null ? `$${page.price.toFixed(4)}` : "no pool print"}
              </dd>
              <dt>vs cohort</dt>
              <dd className="plain">
                {page.vsCohort === null
                  ? "-"
                  : `${page.vsCohort >= 0 ? "+" : ""}${page.vsCohort.toFixed(2)}%`}
              </dd>
              <dt>docs</dt>
              <dd className="plain">
                <a href={page.token.docs} target="_blank" rel="noreferrer">
                  primary source
                </a>
              </dd>
            </dl>
          </article>
        ))}
      </section>

      <footer className="foot">
        <p>
          Price is a Jupiter pool print, not official NAV. Overnight cash-market
          tape is not included. Last-close versus pool comes next. No Pyth Pro.
        </p>
        <p className="mono">{book?.asOf ?? ""}</p>
      </footer>
    </main>
  );
}
