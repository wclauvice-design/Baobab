import { Link } from 'react-router-dom';

export function LegalPrivacy() {
  return (
    <div className="legal-page" style={{ maxWidth: '860px', margin: '32px auto', padding: '0 20px', lineHeight: 1.7, color: '#1e293b' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontSize: '0.9rem' }}>
        ← Retour à l'accueil
      </Link>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <div>
            <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>
              Politique de Confidentialité et Protection des Données
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Engagement de transparence et conformité réglementaire · Baobab
            </p>
          </div>
        </div>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            1. Principe de Minimisation des Données
          </h2>
          <p>
            Baobab respecte strictement votre vie privée. Nous ne collectons que les informations strictement indispensables à la bonne exécution de vos commandes et livraisons :
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Numéro de téléphone :</strong> utilisé pour l'identification sécurisée (code OTP SMS), le suivi WhatsApp et le contact avec le livreur.</li>
            <li><strong>Nom, Prénom et Adresse / Ville :</strong> nécessaires à la livraison physique des marchandises et à l'émission de la facture proforma.</li>
            <li><strong>Historique des devis et paiements :</strong> conservé pour le suivi comptable, le service après-vente et la traçabilité du compte de séquestre.</li>
          </ul>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            2. Confidentialité et Non-Revente des Données
          </h2>
          <p>
            Vos données personnelles <strong>ne sont jamais vendues, louées ou cédées</strong> à des tiers publicitaires ou courtiers en données. Elles ne sont partagées qu'avec :
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Les transporteurs et transitaires partenaires habilités, uniquement pour la remise du colis au destinataire.</li>
            <li>Les commerçants concernés par votre commande, pour la préparation de vos articles.</li>
          </ul>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            3. Sécurité et Hébergement
          </h2>
          <p>
            Toutes les communications entre votre navigateur ou smartphone et nos serveurs sont chiffrées de bout en bout via le protocole TLS/HTTPS (certificats SSL 256 bits). Les mots de passe et clés privées ne sont jamais stockés en clair.
          </p>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            4. Vos Droits d'Accès et de Rectification
          </h2>
          <p>
            Conformément aux lois applicables sur la protection des données personnelles, vous disposez d'un droit permanent d'accès, de rectification et de suppression des informations vous concernant.
          </p>
          <p>
            Pour exercer ce droit ou demander la suppression de votre compte, contactez simplement notre délégué à la protection des données via WhatsApp au <strong>+226 76 95 00 89</strong> ou via la messagerie intégrée.
          </p>
        </section>
      </div>
    </div>
  );
}
