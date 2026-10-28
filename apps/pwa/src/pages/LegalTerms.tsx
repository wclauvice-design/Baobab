import { Link } from 'react-router-dom';
import { Icon } from './Marketplace';

export function LegalTerms() {
  return (
    <div className="legal-page" style={{ maxWidth: '860px', margin: '32px auto', padding: '0 20px', lineHeight: 1.7, color: '#1e293b' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontSize: '0.9rem' }}>
        ← Retour à l'accueil
      </Link>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '2rem' }}>📜</span>
          <div>
            <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>
              Conditions Générales d'Utilisation et de Vente (CGUV)
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Dernière mise à jour : 25 Octobre 2026 · Plateforme Westzone Marketplace & Conciergerie
            </p>
          </div>
        </div>

        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            1. Objet et Présentation de la Plateforme
          </h2>
          <p>
            La plateforme <strong>Westzone</strong> est une marketplace et un service d'intermédiation commerciale et logistique facilitant les échanges entre des acheteurs situés en Afrique (notamment Burkina Faso, Côte d'Ivoire, Mali, Sénégal, Togo, Bénin, Niger, Guinée) et des commerçants et grossistes certifiés basés à Dubaï (Émirats Arabes Unis) et dans la sous-région.
          </p>
          <p>
            Westzone agit en qualité de <strong>tiers de confiance, intermédiaire technique et opérateur de conciergerie</strong> : réception des demandes, établissement de devis proforma transparents, sécurisation des paiements, inspection de conformité physique des colis avant expédition, et coordination du transport (fret maritime et aérien).
          </p>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            2. Devis, Commandes et Prix
          </h2>
          <p>
            <strong>2.1 Devis Proforma :</strong> Toute commande fait l'objet d'un devis préalable mentionnant clairement le détail des articles, les prix unitaires, les frais de transport et logistique convenus, ainsi que le mode de règlement (comptant avant expédition, acompte ou contre-remboursement selon éligibilité).
          </p>
          <p>
            <strong>2.2 Validation :</strong> La confirmation du devis par l'acheteur via son lien privé de suivi engage les deux parties sur les termes spécifiques du devis (quantités, prix, délais estimatifs).
          </p>
          <p>
            <strong>2.3 Monnaies et Devises :</strong> La monnaie de référence comptable est le Franc CFA (XOF). Les conversions indicatives en Dirhams des Émirats (AED), Euros (EUR) ou Dollars US (USD) sont fournies pour la commodité de l'acheteur à des taux fixes transparents.
          </p>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            3. Garantie « Paiement Protégé » (Séquestre Manuel de Confiance)
          </h2>
          <p>
            Afin d'éliminer tout risque d'escroquerie ou de marchandise fantôme :
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>
              Les sommes versées par l'acheteur sont réceptionnées et tracées dans un journal d'écritures sécurisé (compte séquestre dédié Westzone).
            </li>
            <li>
              <strong>Le commerçant vendeur n'est crédité</strong> qu'après vérification physique, contrôle de conformité et validation de la disponibilité de la marchandise à Dubaï.
            </li>
            <li>
              En cas de défaillance avérée du commerçant ou d'impossibilité de fournir les articles conformes au devis accepté, l'acheteur bénéficie du remboursement intégral des sommes engagées.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            4. Expédition, Fret et Délais
          </h2>
          <p>
            Les délais de transport sont indicatifs et dépendent du mode retenu :
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Fret Express Aérien :</strong> 3 à 6 jours ouvrés après inspection.</li>
            <li><strong>Fret Aérien Cargo Standard :</strong> 14 à 16 jours.</li>
            <li><strong>Fret Maritime (Conteneur / Groupage) :</strong> 45 à 50 jours de port à port.</li>
          </ul>
          <p>
            Westzone assure le suivi continu et transmet les jalons logistiques en temps réel sur l'espace privé de suivi de l'acheteur.
          </p>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            5. Litiges, Réclamations et Retours
          </h2>
          <p>
            L'acheteur dispose d'un délai de <strong>48 heures</strong> à compter de la réception locale du colis pour signaler toute non-conformité majeure, casse ou manquant, photos et justificatifs à l'appui.
          </p>
          <p>
            Les litiges sont traités en conciliation rapide via la messagerie Westzone ou notre ligne WhatsApp officielle (+226 76 95 00 89). En cas de non-conformité avérée imputable au vendeur ou au transport, Westzone prend en charge le remplacement ou le remboursement selon les modalités du dossier.
          </p>
        </section>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            6. Droit Applicable et Juridiction
          </h2>
          <p>
            Les présentes conditions sont soumises aux réglementations commerciales de l'espace UEMOA / OHADA pour les opérations locales en Afrique de l'Ouest, complétées par les usages du commerce international pour les approvisionnements à Dubaï.
          </p>
        </section>
      </div>
    </div>
  );
}
