import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Alert } from "./Operations";
export function BusinessSettings() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .get("/admin/concierge/settings")
      .then(setData)
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <div className="ops">
      <header>
        <div>
          <p className="op-kicker">PARAMÈTRES BAOBAB</p>
          <h1>Contacts & notifications</h1>
        </div>
      </header>
      <Alert>{message}</Alert>
      {data && (
        <div className="op-columns">
          <section className="op-card">
            <h2>WhatsApp officiel</h2>
            <p>
              Ce numéro est utilisé par les boutons de contact des annonces.
              Toute modification s’applique aux prochaines ouvertures de page,
              sans redéploiement.
            </p>
            <form
              className="op-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const whatsapp = String(
                  new FormData(e.currentTarget).get("whatsapp"),
                ).replace(/[\s().-]/g, "");
                setBusy(true);
                try {
                  setData(
                    await api.patch("/admin/concierge/settings", { whatsapp }),
                  );
                  setMessage("Numéro WhatsApp mis à jour.");
                } catch (e: any) {
                  setMessage(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Numéro avec indicatif international
                <input
                  name="whatsapp"
                  type="tel"
                  required
                  defaultValue={data.whatsapp || ""}
                  placeholder="+971568934905"
                />
              </label>
              <button className="op-button" disabled={busy}>
                Enregistrer le numéro
              </button>
            </form>
          </section>
          <aside className="op-card">
            <h2>Emails de suivi</h2>
            <p>
              {data.emailConfigured
                ? "Prestataire configuré. Les messages sont envoyés aux clients ayant accepté les notifications."
                : "Prestataire non configuré. Les messages sont conservés en attente ; ils ne sont pas marqués envoyés."}
            </p>
            <p>
              La messagerie Baobab et le lien privé de suivi restent
              disponibles.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
