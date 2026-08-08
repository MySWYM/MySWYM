import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import { LEGAL_ENTITY } from "./lib/legal-entity.js";

const C = {
  bg: "#f8f9fc",
  card: "#ffffff",
  ink: "#191c1e",
  inkLight: "#434751",
  border: "rgba(53,93,163,0.12)",
  accent: "#8eb3ff",
  accentText: "#154388",
};

const host = {
  name: "Vercel Inc.",
  address: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
  website: "https://vercel.com",
};

function LegalLayout({ title, subtitle, children }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Lexend', sans-serif" }}>
      <PublicNav />
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "96px 20px 56px" }}>
        <h1 style={{ color: C.ink, fontSize: "clamp(30px,4vw,44px)", margin: "0 0 10px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em" }}>{title}</h1>
        <p style={{ color: C.inkLight, marginTop: 0, marginBottom: 8 }}>{subtitle}</p>
        <p style={{ color: C.inkLight, fontSize: 12, marginTop: 0, marginBottom: 24 }}>Dernière mise à jour : {LEGAL_ENTITY.lastUpdated}</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "24px 22px", color: C.ink, lineHeight: 1.7, fontSize: 14 }}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function H({ children }) {
  return <h2 style={{ fontSize: 16, fontWeight: 800, color: C.ink, margin: "28px 0 10px", letterSpacing: "0.02em" }}>{children}</h2>;
}

function P({ children }) {
  return <p style={{ margin: "0 0 12px", color: C.inkLight }}>{children}</p>;
}

function Ul({ items }) {
  return (
    <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: C.inkLight }}>
      {items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
    </ul>
  );
}

export function MentionsLegalesPage() {
  const { tradeName, publisher, legalForm, email, site, siret, address } = LEGAL_ENTITY;
  return (
    <LegalLayout title="Mentions légales" subtitle={`Informations légales de l'éditeur du site ${site.replace("https://", "")}`}>
      <H>1. Éditeur du site</H>
      <P>
        Le site et l’application <strong style={{ color: C.ink }}>{tradeName}</strong> ({site}) sont édités par{" "}
        <strong style={{ color: C.ink }}>{publisher}</strong>, {legalForm}, exerçant sous le nom commercial {tradeName}.
      </P>
      <Ul items={[
        <>Directeur de la publication : <strong style={{ color: C.ink }}>{publisher}</strong></>,
        <>Contact : <a href={`mailto:${email}`} style={{ color: C.accentText }}>{email}</a></>,
        siret
          ? <>Numéro SIRET : {siret}</>
          : <>Numéro SIRET : communiqué sans délai sur demande écrite à {email} (mise à jour en cours sur cette page).</>,
        address
          ? <>Adresse du siège / établissement : {address}</>
          : <>Adresse de l’éditeur : communiquée sur demande écrite à {email}.</>,
      ]} />

      <H>2. Hébergement</H>
      <P>
        Le site est hébergé par <strong style={{ color: C.ink }}>{host.name}</strong>, {host.address}. Site : {host.website}.
      </P>
      <P>
        Les données de compte et plans d’entraînement sont stockées via l’infrastructure <strong style={{ color: C.ink }}>Supabase</strong> (authentification et base de données).
        Les paiements sont traités par <strong style={{ color: C.ink }}>Stripe</strong> (voir politique de confidentialité et CGV).
      </P>

      <H>3. Propriété intellectuelle</H>
      <P>
        L’ensemble des éléments du site et de l’application (textes, visuels, logo, structure, code, contenus d’entraînement)
        est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est interdite.
      </P>

      <H>4. Contact</H>
      <P>
        Pour toute question relative aux présentes mentions : <a href={`mailto:${email}`} style={{ color: C.accentText }}>{email}</a>.
      </P>
    </LegalLayout>
  );
}

export function PolitiqueConfidentialitePage() {
  const { tradeName, publisher, email, site, supportEmail } = LEGAL_ENTITY;
  return (
    <LegalLayout title="Politique de confidentialité" subtitle={`Traitement des données personnelles — ${tradeName}`}>
      <P>
        La présente politique décrit comment {publisher} ({tradeName}) traite vos données personnelles lorsque vous utilisez {site},
        conformément au RGPD et à la loi française « Informatique et Libertés ».
      </P>

      <H>1. Responsable du traitement</H>
      <P>
        Responsable : {publisher} — {tradeName}. Contact RGPD / droits :{" "}
        <a href={`mailto:${email}`} style={{ color: C.accentText }}>{email}</a>.
      </P>

      <H>2. Données collectées</H>
      <Ul items={[
        "Identifiants de compte : adresse e-mail, mot de passe (hashé par le prestataire d’auth) ou connexion via Google (Apple à venir), métadonnées de profil (prénom, avatar).",
        "Données sportives et plans : objectif, niveau, fréquence, bassin, allures, progression des séances, historiques locaux et synchronisés.",
        "Paiement & abonnement : identifiants Stripe (customer / subscription), statut Premium — MySWYM ne stocke pas les numéros de carte.",
        "Parrainage : code filleul (?ref=) et code parrain Premium le cas échéant.",
        "Strava (optionnel) : tokens OAuth et activités synchronisées tant que le compte reste connecté.",
        "Données techniques : logs de sécurité, préférences locales (ex. consentement cookies), données de navigation nécessaires au fonctionnement.",
      ]} />

      <H>3. Finalités et bases légales</H>
      <Ul items={[
        "Fourniture du service (compte, plans, Premium) — exécution du contrat.",
        "Facturation et obligations comptables — obligation légale.",
        "Sécurité, prévention de la fraude, support — intérêt légitime.",
        "Mesure d’audience / cookies non essentiels — uniquement avec votre consentement (si activés).",
        "Parrainage — exécution du programme et intérêt légitime anti-abus.",
      ]} />

      <H>4. Destinataires / sous-traitants</H>
      <Ul items={[
        "Supabase — authentification (email, Google ; Apple à venir), base de données, stockage d’avatars.",
        "Google (et Apple, une fois activé) — uniquement si vous choisissez de vous connecter via leur compte (identité et e-mail transmis à Supabase).",
        "Stripe — paiement et portail abonnement.",
        "Vercel — hébergement et diffusion du site.",
        "Strava — uniquement si vous connectez votre compte Strava.",
        "Google Fonts (polices) — chargement des typographies depuis les serveurs Google.",
      ]} />
      <P>Des transferts hors Union européenne peuvent avoir lieu (notamment USA) ; nos prestataires mettent en place des garanties adaptées (clauses contractuelles types, etc.).</P>

      <H>5. Durées de conservation</H>
      <Ul items={[
        "Compte et plans : pendant la durée d’utilisation du compte, puis suppression / anonymisation après demande ou inactivité prolongée.",
        "Données de facturation : durée légale applicable (généralement jusqu’à 10 ans).",
        "Strava : jusqu’à déconnexion Strava ou suppression du compte.",
        "Consentement cookies : jusqu’à retrait ou expiration du choix enregistré localement.",
      ]} />

      <H>6. Vos droits</H>
      <P>
        Vous disposez des droits d’accès, rectification, effacement, limitation, opposition, portabilité, et du droit d’introduire une réclamation auprès de la CNIL (www.cnil.fr).
        Pour exercer vos droits : {email}. Vous pouvez aussi supprimer votre compte depuis l’onglet Profil de l’application (suppression des données associées dans la mesure techniquement possible).
      </P>

      <H>7. Sécurité</H>
      <P>
        Accès authentifié (JWT), données d’abonnement écrites côté serveur uniquement, paiements via Stripe, politiques d’accès en base (RLS) sur les données utilisateur.
        Aucune méthode n’est infaillible ; signalez tout incident à {supportEmail}.
      </P>

      <H>8. Mineurs</H>
      <P>
        Le service s’adresse aux personnes majeures, ou aux mineurs disposant de l’autorisation du titulaire de l’autorité parentale.
        Les données de santé / forme physique restent sous la responsabilité de l’utilisateur.
      </P>

      <H>9. Contact</H>
      <P><a href={`mailto:${email}`} style={{ color: C.accentText }}>{email}</a> · <a href={`mailto:${supportEmail}`} style={{ color: C.accentText }}>{supportEmail}</a></P>
    </LegalLayout>
  );
}

export function CguPage() {
  const { tradeName, email, site } = LEGAL_ENTITY;
  return (
    <LegalLayout title="CGU" subtitle={`Conditions générales d'utilisation — ${tradeName}`}>
      <P>
        Les présentes CGU régissent l’accès et l’utilisation de {site} et de l’application {tradeName}.
        En créant un compte ou en utilisant le service, vous acceptez ces conditions.
      </P>

      <H>1. Objet du service</H>
      <P>
        {tradeName} est un <strong style={{ color: C.ink }}>générateur de séances / plans d’entraînement de natation</strong> basé sur des règles métier
        (pas un service médical, pas une école de natation, pas un correcteur technique à distance).
        Les contenus sont des recommandations d’entraînement ; ils ne remplacent pas un avis médical ni un coach présent sur le bassin.
      </P>

      <H>2. Compte utilisateur</H>
      <Ul items={[
        "Vous devez fournir des informations exactes et maintenir la confidentialité de vos identifiants.",
        "Vous êtes responsable de l’usage de votre compte.",
        "Un compte = une personne physique ; le partage d’accès Premium à des tiers non autorisés est interdit.",
      ]} />

      <H>3. Accès et essai Premium</H>
      <P>
        L’accès au générateur de plan et au contenu des séances nécessite un abonnement Premium
        (essai Stripe de 7 jours avec carte bancaire requis, puis mensuel ou annuel selon l’offre choisie).
        Sans abonnement actif, l’aperçu du plan peut rester visible en lecture limitée (squelette),
        sans accès aux exercices ni à la génération de nouveaux programmes. Détails : CGV et page Tarifs.
      </P>

      <H>4. Responsabilité sportive et santé</H>
      <Ul items={[
        "Vous pratiquez sous votre seule responsabilité et selon votre aptitude physique.",
        "Consultez un professionnel de santé en cas de doute, pathologie, grossesse, reprise après blessure, etc.",
        "MySWYM ne garantit aucun résultat (performance, diplôme, perte de poids, etc.).",
      ]} />

      <H>5. Contenu et propriété intellectuelle</H>
      <P>
        Les plans générés sont destinés à votre usage personnel. Toute revente, republication massive ou extraction automatisée est interdite sans accord écrit.
      </P>

      <H>6. Comportements interdits</H>
      <Ul items={[
        "Atteinte à la sécurité, reverse engineering malveillant, surcharge abusive des serveurs.",
        "Usurpation d’identité, fraude au paiement ou au parrainage.",
        "Contenu illicite transmis via les canaux de contact.",
      ]} />

      <H>7. Suspension / résiliation</H>
      <P>
        {tradeName} peut suspendre ou résilier un compte en cas de violation des CGU, de fraude, ou de risque pour la sécurité du service.
        Vous pouvez supprimer votre compte depuis le Profil ou en écrivant à {email}.
      </P>

      <H>8. Évolution du service</H>
      <P>
        Les fonctionnalités peuvent évoluer. Les plans déjà générés ne sont pas régénérés silencieusement au détriment de votre progression
        (sauf actions explicites de votre part ou migrations techniques nécessaires communiquées).
      </P>

      <H>9. Droit applicable</H>
      <P>Droit français. À défaut d’accord amiable, tribunaux compétents selon les règles de procédure en vigueur.</P>
    </LegalLayout>
  );
}

export function CgvPage() {
  const { tradeName, email, supportEmail, site } = LEGAL_ENTITY;
  return (
    <LegalLayout title="CGV" subtitle={`Conditions générales de vente — offre Premium ${tradeName}`}>
      <P>
        Les présentes CGV s’appliquent aux abonnements Premium souscrits sur {site}.
        L’accès au générateur de plan nécessite un abonnement (essai Stripe inclus) ; un compte sans abonnement reste en lecture seule.
      </P>

      <H>1. Prestataire</H>
      <P>Vendeur : {LEGAL_ENTITY.publisher} ({tradeName}). Contact : {email} · Support : {supportEmail}.</P>

      <H>2. Offres Premium</H>
      <Ul items={[
        "Essai 7 jours (mensuel) : carte bancaire requise via Stripe Checkout ; 0 € pendant l’essai ; résiliation pendant l’essai = aucun prélèvement. Une seule fois par compte.",
        "Mensuel : 4,99 € TTC / mois après l’essai — sans engagement ; reconduction tacite ; résiliable à tout moment via le portail client Stripe ; accès jusqu’à la fin de la période déjà payée.",
        "Annuel : 39,99 € TTC / an (soit environ 3,33 € / mois) — offre prépayée (sans essai sur ce tunnel). Pas de remboursement une fois facturé, hors cas légaux (ex. droit de rétractation encore ouvert, défaut du prestataire).",
        "Biennal (24 mois) : 29,99 € TTC pour 24 mois — offre prépayée à engagement de durée. Non résiliable avant la fin de la période engagée, sauf cas légaux.",
      ]} />
      <P>
        Les prix affichés sont en euros. Le détail des fonctionnalités Premium figure sur la page Tarifs et dans l’application.
        MySWYM peut modifier ses tarifs pour les renouvellements futurs ; le prix de la période en cours reste inchangé.
      </P>

      <H>3. Commande et paiement</H>
      <Ul items={[
        "Le paiement est sécurisé et traité exclusivement par Stripe (carte bancaire).",
        "La souscription vaut acceptation des présentes CGV et des CGU.",
        "Un e-mail / reçu Stripe confirme la transaction.",
      ]} />

      <H>4. Renouvellement et résiliation</H>
      <P>
        Pendant l’essai 7 jours, la résiliation via « Gérer mon abonnement » (portail Stripe) empêche le premier prélèvement.
        L’abonnement mensuel se renouvelle ensuite automatiquement sauf résiliation avant renouvellement.
        L’offre annuelle est un prépaiement de 12 mois : pas de remboursement au prorata une fois facturée (hors cas légaux) ;
        elle peut se reconduire à l’échéance selon les conditions affichées au checkout, sauf résiliation avant renouvellement.
        L’offre biennale couvre 24 mois prépayés selon les conditions de l’offre.
      </P>

      <H>5. Droit de rétractation (14 jours)</H>
      <P>
        Conformément au Code de la consommation, vous disposez d’un délai de 14 jours pour vous rétracter d’un contrat conclu à distance,
        sans motif, à compter de la souscription.
      </P>
      <P>
        <strong style={{ color: C.ink }}>Exception — contenu numérique / service commencé :</strong> si vous demandez l’exécution immédiate de l’accès Premium
        et reconnaissez perdre votre droit de rétractation une fois le service pleinement exécuté (accès ouvert),
        le droit de rétractation peut ne plus s’appliquer dans les conditions de l’article L221-28 du Code de la consommation.
        Pour exercer une rétractation encore ouverte : écrivez à {email} en indiquant votre e-mail de compte.
      </P>

      <H>6. Programme de parrainage</H>
      <Ul items={[
        "Réservé aux comptes Premium en règle (génération d’un code / lien).",
        "Filleul : réduction typiquement de 20 % sur la première facture éligible (coupon Stripe), sous réserve d’éligibilité et de non-cumul avec d’autres offres incompatibles.",
        "Parrain : crédit commercial d’un montant équivalent à 4,99 € sur le solde client Stripe après paiement réussi du filleul, une seule fois par filleul éligible.",
        "MySWYM se réserve le droit de refuser, suspendre ou annuler un avantage en cas de fraude, auto-parrainage, abus ou non-respect des CGU.",
      ]} />

      <H>7. Disponibilité du service</H>
      <P>
        MySWYM s’efforce d’assurer une disponibilité continue mais ne garantit pas un service ininterrompu (maintenance, incidents prestataires).
        En cas d’indisponibilité prolongée imputable à MySWYM, un avoir ou une prolongation pourra être étudié au cas par cas.
      </P>

      <H>8. Médiation / litiges</H>
      <P>
        Droit français. En cas de litige de consommation, vous pouvez recourir gratuitement à un médiateur de la consommation
        (coordonnées communiquées sur demande à {email}) après démarche écrite préalable auprès de MySWYM.
      </P>
    </LegalLayout>
  );
}

export function PolitiqueCookiesPage() {
  const { email, tradeName } = LEGAL_ENTITY;
  return (
    <LegalLayout title="Politique de cookies" subtitle={`Cookies et traceurs — ${tradeName}`}>
      <H>1. Qu’est-ce qu’un cookie / stockage local ?</H>
      <P>
        Un cookie ou un stockage local (localStorage) est un petit fichier ou donnée enregistré sur votre appareil pour faire fonctionner le site,
        mémoriser un choix, ou — le cas échéant — mesurer l’audience.
      </P>

      <H>2. Ce que MySWYM utilise aujourd’hui</H>
      <Ul items={[
        "Nécessaires au service : session d’authentification (Supabase), sécurité, fonctionnement de l’application.",
        "Préférences produit en localStorage (ex. choix de consentement, caches de plans anonymes avant connexion, code de parrainage ?ref=).",
        "Polices Google Fonts chargées depuis les serveurs Google (peut entraîner un transfert technique d’adresse IP).",
      ]} />
      <P>
        <strong style={{ color: C.ink }}>Mesure d’audience :</strong> PostHog (analytics produit) peut être activé
        uniquement après acceptation via la bannière cookies. Aucune donnée sensible (email, notes, contenu complet
        de séance) n’est envoyée comme propriété d’événement. Tu peux refuser les cookies non essentiels.
      </P>

      <H>3. Gestion de votre choix</H>
      <P>
        À la première visite, une bannière vous permet d’accepter ou de refuser les cookies non essentiels.
        Votre choix est mémorisé localement (clé <code>myswym_cookie_consent_v1</code>).
        Pour le modifier : effacez les données du site dans votre navigateur, ou utilisez le lien « Gérer les cookies » du pied de page / bannière.
      </P>

      <H>4. Contact</H>
      <P><a href={`mailto:${email}`} style={{ color: C.accentText }}>{email}</a></P>
    </LegalLayout>
  );
}
