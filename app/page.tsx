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

export default function Home() {
  const [group, setGroup] = useState<"spacex" | "apple">("spacex");
  const [book, setBook] = useState<Book | null>(null);
  const [status, setStatus] = useState("reading ledger");

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
              <dd>{page.mintState?.program ?? "—"}</dd>
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
                {page.mintState?.supplyUi?.toLocaleString() ?? "—"}
              </dd>
              <dt>scaled supply</dt>
              <dd className="plain">
                {page.mintState?.scaledSupply?.toLocaleString() ?? "—"}
              </dd>
              <dt>pool price</dt>
              <dd className="plain">
                {page.price !== null ? `$${page.price.toFixed(4)}` : "no pool print"}
              </dd>
              <dt>vs cohort</dt>
              <dd className="plain">
                {page.vsCohort === null
                  ? "—"
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
