import { Link } from "react-router-dom";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";

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
      <Footer />
    </motion.div>
  );
}

export function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" subtitle="Informations légales de l'éditeur du site myswym.app">
      <p><strong>Éditeur du site :</strong> MySWYM.</p>
      <p><strong>Contact :</strong> contact@myswym.app.</p>
      <p><strong>Directeur de publication :</strong> Arthur Noel.</p>
      <p><strong>Hébergeur :</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
      <p><strong>Propriété intellectuelle :</strong> l'ensemble des contenus (textes, visuels, logo, code) est protégé et ne peut être reproduit sans autorisation préalable.</p>
    </LegalLayout>
  );
}

export function PolitiqueConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" subtitle="Traitement des données personnelles sur MySWYM">
      <p><strong>Données collectées :</strong> email de compte, données de profil sportif, plans d'entraînement, données de paiement (via Stripe), et données Strava si l'utilisateur connecte son compte.</p>
      <p><strong>Finalités :</strong> création et suivi du plan d'entraînement, gestion du compte, facturation, support utilisateur, amélioration du service.</p>
      <p><strong>Base légale :</strong> exécution du service, respect d'obligations légales et intérêt légitime d'amélioration produit.</p>
      <p><strong>Durée de conservation :</strong> les données sont conservées pendant la durée d'utilisation du compte puis supprimées/anonymisées selon les obligations légales applicables.</p>
      <p><strong>Sous-traitants :</strong> Supabase (authentification et base de données), Stripe (paiement), Vercel (hébergement), Strava (intégration optionnelle).</p>
      <p><strong>Droits :</strong> accès, rectification, suppression, limitation, opposition et portabilité, à exercer à l'adresse contact@myswym.app.</p>
    </LegalLayout>
  );
}

export function CguPage() {
  return (
    <LegalLayout title="CGU" subtitle="Conditions générales d'utilisation de l'application MySWYM">
      <p>L'application propose un accompagnement d'entraînement natation basé sur les informations fournies par l'utilisateur.</p>
      <p>L'utilisateur est responsable de l'exactitude des données saisies et de son aptitude physique à pratiquer une activité sportive.</p>
      <p>Les contenus fournis sont des recommandations d'entraînement et ne remplacent pas un avis médical.</p>
      <p>MySWYM peut faire évoluer le service, ses fonctionnalités et ses conditions à tout moment.</p>
      <p>Tout usage frauduleux, détournement technique ou atteinte au service peut entraîner la suspension du compte.</p>
    </LegalLayout>
  );
}

export function CgvPage() {
  return (
    <LegalLayout title="CGV" subtitle="Conditions générales de vente de l'offre Premium MySWYM">
      <p><strong>Offres :</strong> abonnement mensuel ou annuel, détaillé sur la page Tarifs.</p>
      <p><strong>Paiement :</strong> le paiement est sécurisé et traité par Stripe.</p>
      <p><strong>Renouvellement :</strong> l'abonnement est reconduit automatiquement sauf résiliation avant la date de renouvellement.</p>
      <p><strong>Résiliation :</strong> possible à tout moment depuis le portail client ; l'accès Premium reste actif jusqu'à la fin de la période déjà payée.</p>
      <p><strong>Droit de rétractation :</strong> appliqué conformément aux dispositions légales en vigueur, sauf exceptions liées à l'exécution immédiate du service numérique.</p>
      <p><strong>Support :</strong> contact@myswym.app.</p>
    </LegalLayout>
  );
}

export function PolitiqueCookiesPage() {
  return (
    <LegalLayout title="Politique de cookies" subtitle="Information sur l'utilisation des cookies sur MySWYM">
      <p><strong>Cookies nécessaires :</strong> indispensables au fonctionnement technique de l'application (session, sécurité, préférences de base).</p>
      <p><strong>Cookies de mesure d'audience :</strong> utilisés uniquement si vous donnez votre consentement via la bannière cookies.</p>
      <p><strong>Finalité :</strong> comprendre l'usage du site pour améliorer l'expérience utilisateur.</p>
      <p><strong>Durée de conservation :</strong> les choix de consentement sont conservés pour limiter la répétition de la bannière.</p>
      <p><strong>Gestion du consentement :</strong> vous pouvez accepter ou refuser depuis la bannière affichée à votre première visite.</p>
      <p><strong>Contact :</strong> pour toute question, écrivez à contact@myswym.app.</p>
    </LegalLayout>
  );
}
