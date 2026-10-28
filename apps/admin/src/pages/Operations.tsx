import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  getNotificationPermission,
  hasNotificationSupport,
  notifyNewClientMessage,
  requestNotificationPermission,
} from "../lib/notifications";
import { variantLabel } from "@baobab/shared";
import "./operations.css";
export const money = (v: any) =>
  `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} FCFA`;
const date = (v: string) => (v ? new Date(v).toLocaleString("fr-FR") : "—");
const base = "/admin/concierge";
const labels: Record<string, string> = {
  DRAFT: "Devis en préparation",
  QUOTED: "Devis à confirmer",
  CONFIRMED: "Confirmée",
  PREPARING: "Préparation à Dubaï",
  HANDED_TO_CARRIER: "Remise au transporteur",
  IN_TRANSIT: "En transit",
  ARRIVED: "Arrivée au pays",
  CUSTOMS: "Dédouanement",
  LOCAL_DELIVERY: "Livraison locale",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  CLIENT_PAYMENT: "Paiement client reçu",
  COD_COLLECTION: "Espèces encaissées par le livreur",
  COURIER_REMITTANCE: "Reversement reçu du livreur",
  SUPPLIER_PAYMENT: "Règlement fournisseur",
  LOGISTICS_COST: "Coût logistique payé",
  CUSTOMER_REFUND: "Remboursement client",
  PENDING: "À vérifier",
  CONFIRMED_ENTRY: "Confirmé",
  REJECTED: "Non validé",
  SENT: "Envoyé",
  FAILED: "Échec",
  SENDING: "Envoi en cours",
  MANUAL: "Message préparé manuellement",
};
const steps = [
  "CONFIRMED",
  "PREPARING",
  "HANDED_TO_CARRIER",
  "IN_TRANSIT",
  "ARRIVED",
  "CUSTOMS",
  "LOCAL_DELIVERY",
  "DELIVERED",
];
export function Alert({ children }: { children: any }) {
  return children ? (
    <div className="op-alert" role="status">
      {children}
    </div>
  ) : null;
}
function useLoad(path: string, interval = 0) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  const refresh = () =>
    api
      .get<any>(path)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    let active = true;
    const run = () =>
      api
        .get<any>(path)
        .then((d) => {
          if (active) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => active && setError(e.message));
    run();
    const t = interval
      ? setInterval(() => {
          if (!document.hidden) run();
        }, interval)
      : undefined;
    const onFocus = () => run();
    const onVisibility = () => {
      if (!document.hidden) run();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      if (t) clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [path, interval]);
  return { data, error, refresh, setData };
}
function OrderTable({ orders }: { orders: any[] }) {
  return (
    <div className="op-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Commande / client</th>
            <th>Étape</th>
            <th>Total accepté</th>
            <th>Payé</th>
            <th>Reste dû</th>
            <th>À vérifier</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link to={`/orders/${o.id}`}>{o.reference}</Link>
                <small>
                  {o.customer.firstName} {o.customer.lastName} ·{" "}
                  {o.customer.country}
                </small>
              </td>
              <td>
                <span className="op-pill">{labels[o.status]}</span>
              </td>
              <td>
                {o.acceptedRevision ? money(o.finance.total) : "Non accepté"}
              </td>
              <td>{money(o.finance.paid)}</td>
              <td>{money(o.finance.due)}</td>
              <td>{o.finance.pendingPayments || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && (
        <p className="op-empty">Aucune commande pour le moment.</p>
      )}
    </div>
  );
}
export function Overview() {
  const { data, error } = useLoad(`${base}/overview`, 15000);
  return (
    <div className="ops">
      <header>
        <div>
          <p className="op-kicker">BAOBAB · OPÉRATIONS</p>
          <h1>Votre activité, au même endroit.</h1>
        </div>
        <Link className="op-button" to="/customers">
          Créer une commande
        </Link>
      </header>
      <Alert>{error}</Alert>
      {data && (
        <>
          <div className="op-metrics">
            {[
              ["conversations", "Messages à traiter", "/messages"],
              ["payments", "Paiements à vérifier", "/orders"],
              ["listings", "Annonces à modérer", "/catalog"],
              ["sellers", "Commerçants à approuver", "/sellers"],
              ["quotes", "Devis en cours", "/orders"],
            ].map(([key, label, path]) => (
              <Link className="op-card" key={key} to={path}>
                <span>{label}</span>
                <strong>{data.counts[key]}</strong>
              </Link>
            ))}
          </div>
          <h2>Trésorerie & engagements</h2>
          <div className="op-metrics">
            {[
              ["cashReceived", "Fonds clients reçus par Baobab"],
              ["due", "Solde dû par les clients"],
              ["courierDue", "À reverser par les livreurs"],
              ["supplierDue", "À régler aux fournisseurs"],
              ["logisticsPaid", "Logistique payée"],
              ["refundDue", "Remboursements à traiter"],
            ].map(([key, label]) => (
              <div className="op-card" key={key}>
                <span>{label}</span>
                <b>{money(data.totals[key])}</b>
              </div>
            ))}
          </div>
          {!data.emailConfigured && (
            <Alert>
              Les emails restent en attente tant que le prestataire d’envoi
              n’est pas configuré. Le suivi privé et les messages dans
              l’application fonctionnent indépendamment.
            </Alert>
          )}
          <h2>Commandes à suivre</h2>
          <OrderTable
            orders={data.orders.filter(
              (o: any) =>
                !["DELIVERED", "CANCELLED"].includes(o.status) ||
                Number(o.finance.due) > 0 ||
                Number(o.finance.courierDue) > 0 ||
                o.finance.pendingPayments,
            )}
          />
        </>
      )}
    </div>
  );
}
export function TradeOrders() {
  const { data, error } = useLoad(`${base}/orders`, 15000);
  const [search, setSearch] = useState("");
  return (
    <div className="ops">
      <header>
        <h1>Commandes & devis</h1>
        <Link className="op-button" to="/customers">
          Nouvelle commande
        </Link>
      </header>
      <input
        placeholder="Rechercher une référence ou un client"
        aria-label="Rechercher une commande"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Alert>{error}</Alert>
      {data && (
        <OrderTable
          orders={data.filter((o: any) =>
            `${o.reference} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.phone}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )}
        />
      )}
    </div>
  );
}
export function Customers() {
  const { data, error, refresh } = useLoad(`${base}/customers`),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  const navigate = useNavigate();
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      fd = new FormData(form);
    setBusy(true);
    try {
      await api.post(
        `${base}/customers`,
        Object.fromEntries(
          [...fd.entries()]
            .map(([k, v]) => [
              k,
              k === "messagingOptIn"
                ? fd.getAll("messagingOptIn").includes("on")
                : v,
            ])
            .filter(([k, v]) => v !== ""),
        ),
      );
      form.reset();
      await refresh();
      setMessage("Fiche client créée.");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function order(customerId: string) {
    setBusy(true);
    try {
      const o = await api.post<any>(`${base}/orders`, { customerId });
      sessionStorage.setItem(`tracking_${o.id}`, o.trackingUrl);
      navigate(`/orders/${o.id}`);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ops">
      <header>
        <h1>Clients</h1>
      </header>
      <p>
        Une fiche unique par téléphone. Les échanges et commandes restent
        rattachés à cette fiche, même sans compte.
      </p>
      <Alert>{error || message}</Alert>
      <details className="op-card">
        <summary>Créer la fiche d’un nouveau client</summary>
        <form className="op-form" onSubmit={create}>
          {[
            ["firstName", "Prénom"],
            ["lastName", "Nom"],
            ["phone", "Téléphone international (+…)"],
            ["whatsapp", "WhatsApp (facultatif)"],
            ["email", "Email (facultatif)"],
            ["country", "Pays"],
            ["city", "Ville"],
            ["address", "Adresse de livraison"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                name={name}
                type={name === "email" ? "email" : "text"}
                required={!["whatsapp", "email"].includes(name)}
              />
            </label>
          ))}
          <input type="hidden" name="messagingOptIn" value="false" />
          <label className="op-check">
            <input name="messagingOptIn" type="checkbox" />
            Le client accepte les notifications de sa commande par email.
          </label>
          <button className="op-button" disabled={busy}>
            Enregistrer le client
          </button>
        </form>
      </details>
      <input
        aria-label="Rechercher un client"
        placeholder="Nom, téléphone ou email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="op-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Destination</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data
              ?.filter((c: any) =>
                `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((c: any) => (
                <tr key={c.id}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td>
                    {c.phone}
                    <small>{c.email}</small>
                  </td>
                  <td>
                    {c.city}, {c.country}
                    <small>{c.address}</small>
                  </td>
                  <td>
                    <button
                      className="op-button secondary"
                      disabled={busy}
                      onClick={() => order(c.id)}
                    >
                      Créer une commande
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function OperationsInbox() {
  const { id } = useParams(),
    navigate = useNavigate();
  // Fast polling: 1.5s for open conversation, 3s for conversation list
  const list = useLoad(`${base}/conversations`, 3000),
    detail = useLoad(`${base}/conversations/${id || "none"}`, id ? 1500 : 0),
    customers = useLoad(`${base}/customers`);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [text, setText] = useState("");
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState("Client");
  const [guestLastName, setGuestLastName] = useState("Baobab");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCity, setGuestCity] = useState("Ouagadougou");
  const [guestCountry, setGuestCountry] = useState("Burkina Faso");
  const [notifState, setNotifState] = useState<NotificationPermission>(getNotificationPermission);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUrgentCountRef = useRef<number | null>(null);
  const prevDetailMsgsRef = useRef<number>(0);

  const urgentCount = list.data?.filter((c: any) => c.needsReply).length || 0;

  // Real-time notification when a client message arrives in conversation list
  useEffect(() => {
    if (!list.data) return;
    const currentUrgent = list.data.filter((c: any) => c.needsReply).length;
    if (prevUrgentCountRef.current !== null && currentUrgent > prevUrgentCountRef.current) {
      const latest = list.data.find((c: any) => c.needsReply);
      const name = latest?.customer ? `${latest.customer.firstName} ${latest.customer.lastName}` : "Client Baobab";
      const snippet = latest?.messages?.[0]?.body || "Nouveau message";
      notifyNewClientMessage(name, snippet);
    }
    prevUrgentCountRef.current = currentUrgent;
  }, [list.data]);

  // Real-time notification when client sends message in open thread
  useEffect(() => {
    const msgs = detail.data?.messages || [];
    if (prevDetailMsgsRef.current > 0 && msgs.length > prevDetailMsgsRef.current) {
      const added = msgs.slice(prevDetailMsgsRef.current);
      const incoming = added.find((m: any) => m.role === "CLIENT");
      if (incoming) {
        notifyNewClientMessage("Client", incoming.body);
      }
    }
    prevDetailMsgsRef.current = msgs.length;
  }, [detail.data?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail.data?.messages?.length]);

  async function act(fn: () => Promise<any>) {
    setBusy(true);
    try {
      await fn();
      await detail.refresh();
      await list.refresh();
      setMessage("");
      // Fait disparaître immédiatement la pastille rouge de la page concernée
      window.dispatchEvent(new Event("baobab:refresh-counts"));
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePrepareOrder() {
    if (detail.data.customerId) {
      act(async () => {
        const o = await api.post<any>(`${base}/orders`, {
          customerId: detail.data.customerId,
          conversationId: id,
        });
        sessionStorage.setItem(`tracking_${o.id}`, o.trackingUrl);
        navigate(`/orders/${o.id}`);
      });
    } else {
      setShowQuickOrderModal(true);
    }
  }

  async function handleCreateCustomerAndOrder(e: FormEvent) {
    e.preventDefault();
    act(async () => {
      const cust = await api.post<any>(`${base}/customers`, {
        firstName: guestFirstName.trim() || "Client",
        lastName: guestLastName.trim() || "Baobab",
        phone: guestPhone.trim(),
        country: guestCountry.trim(),
        city: guestCity.trim(),
        address: guestCity.trim(),
        messagingOptIn: true,
      });

      await api.patch(`${base}/conversations/${id}/customer`, {
        customerId: cust.id,
      });

      const o = await api.post<any>(`${base}/orders`, {
        customerId: cust.id,
        conversationId: id,
      });

      sessionStorage.setItem(`tracking_${o.id}`, o.trackingUrl);
      setShowQuickOrderModal(false);
      navigate(`/orders/${o.id}`);
    });
  }
  return (
    <div className="ops">
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1>Messages clients</h1>
          {urgentCount > 0 && (
            <span className="op-pill" style={{ background: "#ef4444", color: "#fff", fontWeight: 700 }}>
              {urgentCount} à traiter
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hasNotificationSupport() && notifState !== "granted" && (
            <button
              type="button"
              className="op-button"
              style={{ background: "#f59e0b", color: "#000", fontWeight: 600 }}
              onClick={async () => {
                const p = await requestNotificationPermission();
                setNotifState(p);
              }}
            >
              🔔 Activer alertes sonores
            </button>
          )}
          {notifState === "granted" && (
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
              ✓ Alertes actives
            </span>
          )}
          <Link className="op-button secondary" to="/customers">
            Créer une fiche client
          </Link>
        </div>
      </header>
      <Alert>{list.error || message}</Alert>
      <div className="op-inbox">
        <aside>
          {list.data?.map((c: any) => (
            <Link
              className={id === c.id ? "selected" : ""}
              to={`/messages/${c.id}`}
              key={c.id}
            >
              <strong>{c.subject}</strong>
              {c.needsReply && <span className="op-pill">À répondre</span>}
              <small>
                {c.customer
                  ? `${c.customer.firstName} ${c.customer.lastName}`
                  : "Invité · fiche à rattacher"}
              </small>
              <p>{c.messages[0]?.body.slice(0, 100)}</p>
            </Link>
          ))}
        </aside>
        <section>
          {id && detail.data ? (
            <>
              <h2>{detail.data.subject}</h2>
              <div className="op-row" style={{ flexWrap: "wrap", gap: 10 }}>
                {detail.data.customer ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="op-pill" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                      👤 {detail.data.customer.firstName} {detail.data.customer.lastName} ({detail.data.customer.phone})
                    </span>
                  </div>
                ) : (
                  <select
                    aria-label="Rattacher un client"
                    value={detail.data.customerId || ""}
                    onChange={(e) =>
                      e.target.value &&
                      act(() =>
                        api.patch(`${base}/conversations/${id}/customer`, {
                          customerId: e.target.value,
                        }),
                      )
                    }
                  >
                    <option value="">Rattacher à une fiche client existante…</option>
                    {customers.data?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} · {c.phone}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  disabled={busy}
                  type="button"
                  className="op-button"
                  style={{ background: "#064e3b", color: "#fff", fontWeight: 700 }}
                  onClick={handlePrepareOrder}
                >
                  📋 Préparer une commande {detail.data.customer ? "" : "(avec fiche client)"}
                </button>
              </div>

              {showQuickOrderModal && (
                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, margin: "10px 0" }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    📋 Fiche client pour préparer le devis / la commande
                  </h3>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#475569" }}>
                    Renseignez les coordonnées pour créer la fiche client et générer le devis officiel de ce renseignement.
                  </p>
                  <form onSubmit={handleCreateCustomerAndOrder} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Prénom</label>
                      <input required value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} placeholder="Prénom" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Nom</label>
                      <input required value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} placeholder="Nom" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Téléphone WhatsApp</label>
                      <input required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+226..." style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Ville</label>
                      <input required value={guestCity} onChange={(e) => setGuestCity(e.target.value)} placeholder="Ouagadougou, Abidjan..." style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Pays</label>
                      <input required value={guestCountry} onChange={(e) => setGuestCountry(e.target.value)} placeholder="Burkina Faso, Côte d'Ivoire..." style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                    </div>
                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 8 }}>
                      <button type="submit" disabled={busy} className="op-button" style={{ background: "#064e3b", color: "#fff", fontWeight: 700 }}>
                        {busy ? "Création en cours…" : "✓ Créer la fiche & ouvrir la commande →"}
                      </button>
                      <button type="button" onClick={() => setShowQuickOrderModal(false)} className="op-button secondary">
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="op-chat">
                {detail.data.messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={m.role === "CLIENT" ? "client" : "team"}
                  >
                    <small>
                      {m.role === "CLIENT" ? "Client" : "Baobab"} ·{" "}
                      {date(m.createdAt)}
                    </small>
                    <p>{m.body}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form
                className="op-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const replyText = text.trim();
                  if (!replyText) return;
                  const optimisticMsg = {
                    id: `temp-${Date.now()}`,
                    role: "BAOBAB",
                    body: replyText,
                    createdAt: new Date().toISOString(),
                  };
                  if (detail.data) {
                    detail.setData({
                      ...detail.data,
                      messages: [...(detail.data.messages || []), optimisticMsg],
                    });
                  }
                  setText("");
                  act(async () => {
                    await api.post(`${base}/conversations/${id}/messages`, {
                      body: replyText,
                      requestKey: crypto.randomUUID(),
                    });
                  });
                }}
              >
                <textarea
                  required
                  maxLength={4000}
                  aria-label="Réponse au client"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Répondre au client…"
                />
                <button className="op-button" disabled={busy}>
                  Envoyer
                </button>
              </form>
              {detail.data.tradeOrders.map((o: any) => (
                <Link className="op-pill" key={o.id} to={`/orders/${o.id}`}>
                  {o.reference}
                </Link>
              ))}
            </>
          ) : (
            <p className="op-empty">Sélectionnez une conversation.</p>
          )}
        </section>
      </div>
    </div>
  );
}
export function TradeDetail() {
  const { id } = useParams(),
    { data: o, error, refresh } = useLoad(`${base}/orders/${id}`, 15000),
    products = useLoad("/products/mine");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [url, setUrl] = useState(sessionStorage.getItem(`tracking_${id}`) || ""),
    [whatsapp, setWhatsapp] = useState(""),
    [entryKey, setEntryKey] = useState(() => crypto.randomUUID()),
    [lines, setLines] = useState<any[]>([
      { productId: "", variantId: "", quantity: 1, unitPrice: "0", minimumException: "" },
    ]);
  async function act(suffix: string, body?: any) {
    setBusy(true);
    try {
      const r = await api.post<any>(`${base}/orders/${id}/${suffix}`, body);
      if (r?.trackingUrl) {
        setUrl(r.trackingUrl);
        sessionStorage.setItem(`tracking_${id}`, r.trackingUrl);
      }
      if (r?.whatsappUrl) setWhatsapp(r.whatsappUrl);
      setMessage("Enregistré.");
      await refresh();
      window.dispatchEvent(new Event("baobab:refresh-counts"));
      return true;
    } catch (e: any) {
      setMessage(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!o)
    return (
      <div className="ops">
        <Alert>{error}</Alert>
        <p>Chargement de la commande…</p>
      </div>
    );
  const q = o.quotes.find((q: any) => q.revision === o.currentRevision),
    f = o.finance,
    next = steps[steps.indexOf(o.status) + 1];
  return (
    <div className="ops">
      <header>
        <div>
          <Link to="/orders">← Commandes</Link>
          <h1>{o.reference}</h1>
          <p>
            {o.customer.firstName} {o.customer.lastName} · {o.customer.phone} ·{" "}
            {o.customer.city}, {o.customer.country}
          </p>
        </div>
        <span className="op-pill">{labels[o.status]}</span>
      </header>
      <Alert>{error || message}</Alert>
      <div className="op-metrics">
        {[
          ["total", "Total du devis accepté"],
          ["paid", "Payé par le client"],
          ["due", "Reste dû"],
          ["courierDue", "Chez le livreur"],
          ["supplierDue", "Fournisseurs à payer"],
          ["cashBalance", "Trésorerie nette"],
          ["estimatedMargin", "Marge prévisionnelle"],
          ["actualMargin", "Marge réalisée"],
        ].map(([key, label]) => (
          <div className="op-card" key={key}>
            <span>{label}</span>
            <b>
              {f[key] === null
                ? "Coûts non clôturés"
                : key === "total" && !o.acceptedRevision
                  ? "Non accepté"
                  : money(f[key])}
            </b>
          </div>
        ))}
      </div>
      <div className="op-columns">
        <section>
          <div className="op-card">
            <h2>Devis {q ? `n°${q.revision}` : ""}</h2>
            {q ? (
              <>
                <p>
                  {o.acceptedRevision === q.revision
                    ? "Accepté par le client"
                    : "En attente de confirmation du client"}{" "}
                  · Validité : {date(q.expiresAt)}
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.lines.map((l: any) => (
                      <tr key={`${l.productId}:${l.variantId || ""}`}>
                        <td>
                          {l.name}
                          {l.variantLabel && (
                            <small>
                              {l.variantLabel}
                              {l.variantSku ? ` · ${l.variantSku}` : ""}
                            </small>
                          )}
                          <small>
                            Net fournisseur : {money(l.supplierUnitPrice)}
                            {l.minimumException &&
                              ` · Exception : ${l.minimumException}`}
                          </small>
                        </td>
                        <td>{l.quantity}</td>
                        <td>{money(l.unitPrice)}</td>
                        <td>{money(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  Produits : {money(q.productTotal)} · Logistique facturée :{" "}
                  {money(q.logisticsCharge)} · Remise : {money(q.discount)}
                </p>
                <strong>Total proposé : {money(q.total)}</strong>
                <p className="op-pre">{q.terms}</p>
                <p>
                  Destination : {q.destination} · {q.paymentMode}
                </p>
              </>
            ) : (
              <p>
                Créez un devis après avoir convenu des produits et frais avec le
                client.
              </p>
            )}
          </div>
          {["DRAFT", "QUOTED", "CONFIRMED"].includes(o.status) && (
            <details className="op-card">
              <summary>
                {q
                  ? "Préparer une nouvelle version du devis"
                  : "Préparer le devis"}
              </summary>
              <p>
                Chaque version doit être acceptée par le client. Les prix
                fournisseurs et quantités sont conservés dans le devis accepté.
              </p>
              <form
                className="op-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await act("quotes", {
                    ...Object.fromEntries(
                      [...fd.entries()].filter(([, v]) => v !== ""),
                    ),
                    expectedRevision: o.currentRevision,
                    lines: lines.map((l) => ({
                      ...l,
                      quantity: Number(l.quantity),
                    })),
                    expiresAt: new Date(
                      String(fd.get("expiresAt")),
                    ).toISOString(),
                  });
                }}
              >
                <div className="op-span">
                  {lines.map((l, i) => (
                    <div className="op-quote-line" key={i}>
                      <label>
                        Annonce
                        <select
                          required
                          value={l.productId}
                          onChange={(e) => {
                            const p = products.data.find(
                              (p: any) => p.id === e.target.value,
                            );
                            if (!p) return;
                            const activeVariants = (p.variants || []).filter(
                              (variant: any) => variant.active,
                            );
                            const firstVariant = activeVariants[0];
                            setLines(
                              lines.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      productId: p.id,
                                      variantId: firstVariant?.id || "",
                                      quantity: Math.ceil((p.minimumOrder || 1) / (p.packSize || 1)) * (p.packSize || 1),
                                      unitPrice: String(firstVariant?.price ?? p.price),
                                    }
                                  : x,
                              ),
                            );
                          }}
                        >
                          <option value="">Choisir…</option>
                          {products.data
                            ?.filter((p: any) => p.moderation === "PUBLISHED")
                            .map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} · minimum {p.minimumOrder}
                              </option>
                            ))}
                        </select>
                      </label>
                      {(() => {
                        const selected = products.data?.find(
                          (p: any) => p.id === l.productId,
                        );
                        const activeVariants = (selected?.variants || []).filter(
                          (variant: any) => variant.active,
                        );
                        if (!activeVariants.length) return null;
                        return (
                          <label>
                            Variante vendue
                            <select
                              required
                              value={l.variantId || ""}
                              onChange={(e) => {
                                const variant = activeVariants.find(
                                  (candidate: any) =>
                                    candidate.id === e.target.value,
                                );
                                setLines(
                                  lines.map((x, j) =>
                                    j === i
                                      ? {
                                          ...x,
                                          variantId: e.target.value,
                                          unitPrice: String(
                                            variant?.price ?? x.unitPrice,
                                          ),
                                        }
                                      : x,
                                  ),
                                );
                              }}
                            >
                              <option value="">Choisir…</option>
                              {activeVariants.map((variant: any) => (
                                <option key={variant.id} value={variant.id}>
                                  {variantLabel(variant)} · {variant.stock} en stock
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      })()}
                      <label>
                        Quantité
                        <input
                          type="number"
                          min="1"
                          required
                          value={l.quantity}
                          onChange={(e) =>
                            setLines(
                              lines.map((x, j) =>
                                j === i
                                  ? { ...x, quantity: Number(e.target.value) }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Prix unitaire FCFA
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={l.unitPrice}
                          onChange={(e) =>
                            setLines(
                              lines.map((x, j) =>
                                j === i
                                  ? { ...x, unitPrice: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Motif d’exception au minimum (facultatif)
                        <input
                          value={l.minimumException}
                          onChange={(e) =>
                            setLines(
                              lines.map((x, j) =>
                                j === i
                                  ? { ...x, minimumException: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLines(lines.filter((_, j) => j !== i))
                          }
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="op-button secondary"
                    disabled={lines.length >= 30}
                    onClick={() =>
                      setLines([
                        ...lines,
                        {
                          productId: "",
                          variantId: "",
                          quantity: 1,
                          unitPrice: "0",
                          minimumException: "",
                        },
                      ])
                    }
                  >
                    Ajouter un produit
                  </button>
                </div>
                {[
                  ["logisticsCharge", "Transport et frais facturés"],
                  ["logisticsEstimate", "Coût logistique estimé"],
                  ["discount", "Remise"],
                ].map(([name, label]) => (
                  <label key={name}>
                    {label} (FCFA)
                    <input
                      name={name}
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="0"
                      required
                    />
                  </label>
                ))}
                <label>
                  Paiement
                  <select name="paymentMode">
                    <option value="PREPAID">Avant expédition</option>
                    <option value="DEPOSIT">Acompte puis solde</option>
                    <option value="COD">À la livraison</option>
                  </select>
                </label>
                <label>
                  Échéance de paiement
                  <input type="date" name="dueDate" />
                </label>
                <label>
                  Expiration du devis
                  <input type="datetime-local" name="expiresAt" required />
                </label>
                <label>
                  Livraison estimée
                  <input
                    name="estimatedDelivery"
                    placeholder="Ex. 3 à 5 semaines après expédition"
                  />
                </label>
                <label>
                  Destination
                  <input
                    name="destination"
                    minLength={5}
                    defaultValue={`${o.customer.address}, ${o.customer.city}, ${o.customer.country}`}
                    required
                  />
                </label>
                <label className="op-span">
                  Conditions convenues : frais inclus/exclus, acompte, paiement
                  et livraison
                  <textarea
                    name="terms"
                    minLength={5}
                    maxLength={4000}
                    required
                  />
                </label>
                <button className="op-button" disabled={busy}>
                  Envoyer cette version à confirmer
                </button>
              </form>
            </details>
          )}
          <div className="op-card">
            <h2>Écritures financières</h2>
            <div className="op-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Opération</th>
                    <th>Montant</th>
                    <th>État / référence</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {o.entries.map((e: any) => (
                    <tr key={e.id}>
                      <td>
                        {labels[e.kind]}
                        <small>
                          {date(e.createdAt)} · {e.createdBy}
                        </small>
                      </td>
                      <td>{money(e.amount)}</td>
                      <td>
                        {e.state === "CONFIRMED" ? "Confirmé" : labels[e.state]}
                        <small>{e.reference}</small>
                      </td>
                      <td>
                        {e.state === "PENDING" && (
                          <div className="op-row">
                            <button
                              disabled={busy}
                              onClick={() => act(`entries/${e.id}/confirm`)}
                            >
                              Confirmer reçu
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => act(`entries/${e.id}/reject`)}
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {o.acceptedRevision && (
              <details>
                <summary>Enregistrer une opération réelle</summary>
                <form
                  className="op-form"
                  onChange={() => setEntryKey(crypto.randomUUID())}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      fd = new FormData(form);
                    if (
                      await act("entries", {
                        ...Object.fromEntries(
                          [...fd.entries()].filter(([, v]) => v !== ""),
                        ),
                        requestKey: entryKey,
                      })
                    ) {
                      form.reset();
                      setEntryKey(crypto.randomUUID());
                    }
                  }}
                >
                  <label>
                    Opération
                    <select name="kind">
                      {[
                        "CLIENT_PAYMENT",
                        "COD_COLLECTION",
                        "COURIER_REMITTANCE",
                        "SUPPLIER_PAYMENT",
                        "LOGISTICS_COST",
                        "CUSTOMER_REFUND",
                      ].map((k) => (
                        <option key={k} value={k}>
                          {labels[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Montant (FCFA)
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </label>
                  <label>
                    Fournisseur (pour règlement)
                    <select name="supplierId">
                      <option value="">Stock propre Baobab</option>
                      {Array.from(
                        new Set(
                          o.quotes
                            .find((q: any) => q.revision === o.acceptedRevision)
                            ?.lines.map((l: any) => l.supplierId)
                            .filter(Boolean),
                        ),
                      ).map((s: any) => (
                        <option key={s} value={s}>
                          {products.data?.find((p: any) => p.sellerId === s)
                            ?.seller?.shopName || s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Référence / justificatif
                    <input name="reference" minLength={2} required />
                  </label>
                  <label className="op-span">
                    Note interne
                    <textarea name="note" />
                  </label>
                  <p className="op-span">
                    Vérifiez la réception ou le décaissement avant
                    enregistrement. Une écriture confirmée reste conservée dans
                    l’historique.
                  </p>
                  <button disabled={busy} className="op-button">
                    Confirmer l’opération
                  </button>
                </form>
              </details>
            )}
          </div>
          <div className="op-card">
            <h2>Historique horodaté</h2>
            {o.events.map((e: any) => (
              <div className="op-event" key={e.id}>
                <strong>{labels[e.status]}</strong>
                <small>
                  {date(e.createdAt)} · {e.createdBy}
                </small>
                <p>{e.message}</p>
              </div>
            ))}
          </div>
        </section>
        <aside>
          <div className="op-card">
            <h2>Suivi client</h2>
            {url ? (
              <>
                <p className="op-pre">{url}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    className="op-button secondary"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(url)
                        .then(() => setMessage("Lien copié."))
                        .catch(() => setMessage("Copiez le lien affiché."))
                    }
                  >
                    Copier le lien privé
                  </button>
                  <a
                    href={`https://wa.me/${o.customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Bonjour ${o.customer.firstName}, voici votre lien de suivi en direct pour votre commande Baobab (réf. ${o.reference}) :\n${url}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="op-button"
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    Envoyer au client sur WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p>
                Le lien a été transmis dans la conversation ou remis lors de la
                création.
              </p>
            )}
            <details>
              <summary>Remplacer le lien privé</summary>
              <p>L’ancien lien cessera immédiatement de fonctionner.</p>
              <button
                disabled={busy}
                className="op-button secondary"
                onClick={() => act("rotate-link")}
              >
                Révoquer et générer un lien
              </button>
            </details>
          </div>
          <div className="op-card">
            <h2>Progression logistique</h2>
            {o.acceptedRevision && steps.includes(o.status) && next && (
              <form
                className="op-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  act("status", {
                    status: next,
                    message: new FormData(e.currentTarget).get("message"),
                  });
                }}
              >
                <p>
                  Prochaine étape : <strong>{labels[next]}</strong>
                </p>
                <textarea
                  name="message"
                  required
                  minLength={3}
                  placeholder="Information réelle à communiquer au client"
                />
                <button className="op-button" disabled={busy}>
                  Confirmer cette étape
                </button>
              </form>
            )}
            {["DRAFT", "QUOTED", "CONFIRMED", "PREPARING"].includes(
              o.status,
            ) && (
              <details>
                <summary>Annuler la commande</summary>
                <form
                  className="op-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act("status", {
                      status: "CANCELLED",
                      message: new FormData(e.currentTarget).get("message"),
                    });
                  }}
                >
                  <textarea
                    name="message"
                    minLength={3}
                    required
                    placeholder="Motif communiqué au client"
                  />
                  <button className="op-button secondary" disabled={busy}>
                    Confirmer l’annulation
                  </button>
                </form>
              </details>
            )}
            {o.status === "DELIVERED" && !o.logisticsFinalized && (
              <>
                <p>
                  Clôturez uniquement après enregistrement de tous les coûts
                  logistiques.
                </p>
                <button
                  className="op-button"
                  disabled={busy}
                  onClick={() => act("close-costs")}
                >
                  Clôturer les coûts
                </button>
              </>
            )}
          </div>
          <div className="op-card">
            <h2>Notifications & rappels</h2>
            <p>
              Reste dû : {money(f.due)}. Les rappels sont bloqués si un paiement
              est en vérification.
            </p>
            <div className="op-stack">
              <button
                className="op-button secondary"
                disabled={busy || Number(f.due) <= 0 || f.pendingPayments > 0}
                onClick={() => act("remind", { channel: "WHATSAPP" })}
              >
                Préparer un rappel WhatsApp
              </button>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="op-button"
                >
                  Ouvrir le message dans WhatsApp
                </a>
              )}
              <button
                className="op-button secondary"
                disabled={busy || Number(f.due) <= 0 || f.pendingPayments > 0}
                onClick={() => act("remind", { channel: "EMAIL" })}
              >
                Envoyer un rappel par email
              </button>
            </div>
            <details>
              <summary>
                Historique des notifications ({o.notices.length})
              </summary>
              {o.notices.map((n: any) => (
                <div className="op-event" key={n.id}>
                  <strong>
                    {n.channel} · {labels[n.state] || n.state}
                  </strong>
                  <small>{date(n.sentAt || n.createdAt)}</small>
                  <p>{n.body}</p>
                  {n.lastError && <Alert>{n.lastError}</Alert>}
                </div>
              ))}
            </details>
          </div>
          <details className="op-card">
            <summary>Versions précédentes du devis</summary>
            {o.quotes
              .filter((v: any) => v.revision !== o.currentRevision)
              .map((v: any) => (
                <div className="op-event" key={v.id}>
                  Version {v.revision} · {money(v.total)} · {date(v.createdAt)}
                  <p className="op-pre">{v.terms}</p>
                </div>
              ))}
          </details>
        </aside>
      </div>
    </div>
  );
}
