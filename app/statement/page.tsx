"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { KIND_LABEL, type CatalogToken } from "@/lib/catalog";

type Line = {
  token: CatalogToken;
  kindLabel: string;
  rawUi: number;
  scaledUi: number;
  multiplier: number | null;
  price: number | null;
  mark: number | null;
};

type Book = {
  owner: string;
  asOf: string;
  lines: Line[];
  note: string;
  error?: string;
};

function StatementBody() {
  const params = useSearchParams();
  const owner = params.get("owner") ?? "";
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    if (!owner) return;
    fetch(`/api/wallet?owner=${encodeURIComponent(owner)}`)
      .then((r) => r.json())
      .then(setBook)
      .catch(() => setBook({ owner, asOf: "", lines: [], note: "", error: "failed" }));
  }, [owner]);

  if (!owner) return <p>Missing wallet.</p>;
  if (!book) return <p>Writing statement.</p>;
  if (book.error) return <p>{book.error}</p>;

  return (
    <main className="wrap">
      <div className="mark">Assay statement</div>
      <h1>Position book</h1>
      <p className="issuer">{book.owner}</p>
      <p className="issuer">{book.asOf}</p>
      <p className="claim">{book.note}</p>
      <p className="warn">This token is not the share. Marks use pool prints, not official NAV.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["symbol", "kind", "raw", "scaled", "mult", "mark"].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #2a261c", padding: "6px 4px" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {book.lines.map((line) => (
            <tr key={line.token.mint}>
              <td style={{ padding: "6px 4px" }}>{line.token.symbol}</td>
              <td style={{ padding: "6px 4px" }}>{line.kindLabel ?? KIND_LABEL[line.token.kind]}</td>
              <td style={{ padding: "6px 4px" }}>{line.rawUi}</td>
              <td style={{ padding: "6px 4px" }}>{line.scaledUi}</td>
              <td style={{ padding: "6px 4px" }}>{line.multiplier ?? "-"}</td>
              <td style={{ padding: "6px 4px" }}>
                {line.mark !== null ? `$${line.mark.toFixed(2)}` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="foot">Print this page to PDF from the phone share sheet.</p>
    </main>
  );
}

export default function StatementPage() {
  return (
    <Suspense fallback={<p className="wrap">Writing statement.</p>}>
      <StatementBody />
    </Suspense>
  );
}
