import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { Alert, money } from "../Operations";
export function Dashboard() {
  const [d, setD] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/sellers/me/dashboard")
      .then(setD)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="ops">
      <Alert>{error}</Alert>
      {d ? (
        <>
          <header>
            <div>
              <p className="op-kicker">MON ACTIVITÉ</p>
              <h1>{d.seller.shopName}</h1>
              <p>
                {d.seller.status === "APPROVED"
                  ? "Compte approuvé"
                  : d.seller.status === "PENDING"
                    ? "Votre demande est en cours de validation par Westzone."
                    : "Compte suspendu — contactez Westzone."}
              </p>
            </div>
            <Link className="op-button" to="/products">
              Gérer mes annonces
            </Link>
          </header>
          <div className="op-metrics">
            {[
              ["Annonces publiées", d.activeProducts],
              ["En modération", d.pendingListings],
              ["Règlements reçus", money(d.paid)],
              ["À recevoir de Westzone", money(d.due)],
            ].map(([label, value]) => (
              <div className="op-card" key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <h2>Mes ventes & règlements</h2>
          <p>
            Westzone prend en charge la relation client. Retrouvez ici vos
            produits vendus, vos prix nets et les règlements enregistrés.
          </p>
          {d.settlements.map((o: any) => (
            <details className="op-card" key={o.reference}>
              <summary>
                {o.reference} · À recevoir : {money(o.due)}
              </summary>
              {o.lines.map((l: any, i: number) => (
                <p key={i}>
                  {l.name} · {l.quantity} × {money(l.unitPrice)}
                </p>
              ))}
              <p>
                Total fournisseur : {money(o.total)} · Réglé : {money(o.paid)}
              </p>
              {o.payments.map((p: any, i: number) => (
                <p key={i}>
                  {new Date(p.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                  {money(p.amount)} · {p.reference}
                </p>
              ))}
            </details>
          ))}
          {!d.settlements.length && (
            <div className="op-card">
              Vos ventes apparaîtront après acceptation d’un devis par le
              client.
            </div>
          )}
        </>
      ) : (
        <p>Chargement…</p>
      )}
    </div>
  );
}
