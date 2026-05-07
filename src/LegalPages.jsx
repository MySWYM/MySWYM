import { Link } from "react-router-dom";
import PublicNav from "./PublicNav.jsx";

const C = {
  bg: "#f8f9fc",
  card: "#ffffff",
  ink: "#191c1e",
  inkLight: "#434751",
  border: "rgba(53,93,163,0.12)",
  accent: "#8eb3ff",
  accentText: "#154388",
};

function LegalLayout({ title, subtitle, children }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Lexend', sans-serif" }}>
      <PublicNav />

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "96px 20px 56px" }}>
        <h1 style={{ color: C.ink, fontSize: "clamp(30px,4vw,44px)", margin: "0 0 10px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em" }}>{title}</h1>
        <p style={{ color: C.inkLight, marginTop: 0, marginBottom: 24 }}>{subtitle}</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "24px 22px", color: C.ink, lineHeight: 1.65, fontSize: 14 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions legales" subtitle="Informations legales de l'editeur du site myswym.app">
      <p><strong>Editeur du site :</strong> MySWYM.</p>
      <p><strong>Contact :</strong> contact@myswym.app.</p>
      <p><strong>Directeur de publication :</strong> Arthur Noel.</p>
      <p><strong>Hebergeur :</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
      <p><strong>Propriete intellectuelle :</strong> l'ensemble des contenus (textes, visuels, logo, code) est protege et ne peut etre reproduit sans autorisation prealable.</p>
    </LegalLayout>
  );
}

export function PolitiqueConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialite" subtitle="Traitement des donnees personnelles sur MySWYM">
      <p><strong>Donnees collecte es :</strong> email de compte, donnees de profil sportif, plans d'entrainement, donnees de paiement (via Stripe), et donnees Strava si l'utilisateur connecte son compte.</p>
      <p><strong>Finalites :</strong> creation et suivi du plan d'entrainement, gestion du compte, facturation, support utilisateur, amelioration du service.</p>
      <p><strong>Base legale :</strong> execution du service, respect d'obligations legales et interet legitime d'amelioration produit.</p>
      <p><strong>Duree de conservation :</strong> les donnees sont conservees pendant la duree d'utilisation du compte puis supprimees/anonimisees selon les obligations legales applicables.</p>
      <p><strong>Sous-traitants :</strong> Supabase (authentification et base de donnees), Stripe (paiement), Vercel (hebergement), Strava (integration optionnelle).</p>
      <p><strong>Droits :</strong> acces, rectification, suppression, limitation, opposition et portabilite, a exercer a l'adresse contact@myswym.app.</p>
    </LegalLayout>
  );
}

export function CguPage() {
  return (
    <LegalLayout title="CGU" subtitle="Conditions generales d'utilisation de l'application MySWYM">
      <p>L'application propose un accompagnement d'entrainement natation base sur les informations fournies par l'utilisateur.</p>
      <p>L'utilisateur est responsable de l'exactitude des donnees saisies et de son aptitude physique a pratiquer une activite sportive.</p>
      <p>Les contenus fournis sont des recommandations d'entrainement et ne remplacent pas un avis medical.</p>
      <p>MySWYM peut faire evoluer le service, ses fonctionnalites et ses conditions a tout moment.</p>
      <p>Tout usage frauduleux, detournement technique ou atteinte au service peut entrainer la suspension du compte.</p>
    </LegalLayout>
  );
}

export function CgvPage() {
  return (
    <LegalLayout title="CGV" subtitle="Conditions generales de vente de l'offre Premium MySWYM">
      <p><strong>Offres :</strong> abonnement mensuel ou annuel, detaille sur la page Tarifs.</p>
      <p><strong>Paiement :</strong> le paiement est securise et traite par Stripe.</p>
      <p><strong>Renouvellement :</strong> l'abonnement est reconduit automatiquement sauf resiliation avant la date de renouvellement.</p>
      <p><strong>Resiliation :</strong> possible a tout moment depuis le portail client; l'acces Premium reste actif jusqu'a la fin de la periode deja payee.</p>
      <p><strong>Droit de retractation :</strong> applique conformement aux dispositions legales en vigueur, sauf exceptions liees a l'execution immediate du service numerique.</p>
      <p><strong>Support :</strong> contact@myswym.app.</p>
    </LegalLayout>
  );
}

export function PolitiqueCookiesPage() {
  return (
    <LegalLayout title="Politique de cookies" subtitle="Information sur l'utilisation des cookies sur MySWYM">
      <p><strong>Cookies necessaires :</strong> indispensables au fonctionnement technique de l'application (session, securite, preferences de base).</p>
      <p><strong>Cookies de mesure d'audience :</strong> utilises uniquement si vous donnez votre consentement via la banniere cookies.</p>
      <p><strong>Finalite :</strong> comprendre l'usage du site pour ameliorer l'experience utilisateur.</p>
      <p><strong>Duree de conservation :</strong> les choix de consentement sont conserves pour limiter la repetition de la banniere.</p>
      <p><strong>Gestion du consentement :</strong> vous pouvez accepter ou refuser depuis la banniere affichee a votre premiere visite.</p>
      <p><strong>Contact :</strong> pour toute question, ecrivez a contact@myswym.app.</p>
    </LegalLayout>
  );
}
