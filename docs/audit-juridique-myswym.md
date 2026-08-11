# Audit juridique MySWYM — Droit français / européen

**Date d’audit :** 11 août 2026  
**Périmètre :** code repository MySWYM + documents légaux + UX  
**Benchmark structurel :** documents publics OpenSwim (aucune copie de texte)  
**Avertissement :** analyse automatisée — **ne constitue pas un avis d’avocat**. Points marqués **À VALIDER JURIDIQUEMENT** doivent être revus par un professionnel du droit.

---

## INFORMATIONS MANQUANTES À FOURNIR PAR LE PROPRIÉTAIRE

| Information | Pourquoi | Statut |
|---|---|---|
| SIRET / SIREN | LCEN + info précontractuelle Code conso | `[À FOURNIR]` |
| Adresse du siège / établissement | LCEN + CGV | `[À FOURNIR]` |
| Statut TVA (non assujetti ou n° TVA) | Facturation / CGV | `[À FOURNIR]` |
| Médiateur de la consommation (nom + site + adresse) | Obligation B2C | `[À FOURNIR]` |
| DPA / contrats sous-traitants (Supabase, Stripe, Vercel, PostHog, Resend, Google) | RGPD art. 28 | `[À FOURNIR]` |
| Confirmation pays d’hébergement Supabase (région projet) | Transferts / registre | `[À FOURNIR]` |
| Politique rétention inactivité (36 mois proposé) | Minimisation | `[À VALIDER]` |
| Configuration Stripe Billing (retries, past_due, grace) | Alignement CGV ↔ produit | `[À DOCUMENTER]` |
| Offre biennale : commercialisée ou non sur Tarifs | Cohérence publicité | `[À CLARIFIER]` |
| AIPD / DPIA données blessure-douleur | Art. 35 RGPD probable | `[À VALIDER JURIDIQUEMENT]` |
| Assurance RC pro / cyber | Risque opérationnel | Recommandé |
| Registre des traitements | Art. 30 RGPD | À établir |

---

## MODÈLE RÉEL (issu du code)

| Élément | Constat code |
|---|---|
| Exploitant | Arthur Noel, Entrepreneur individuel, nom commercial MySWYM |
| Pays | France (documents / droit applicable FR) — adresse siège manquante |
| Activité | SaaS web : générateur **rule-based** de plans / séances de natation |
| Public | Consommateurs (nageurs) ; B2C |
| Gratuit | Aperçu squelette / lecture limitée sans abo |
| Payant | Premium via Stripe Checkout |
| Essai | 7 jours, carte requise, tunnel **mensuel uniquement**, 1×/compte |
| Mensuel | 4,99 € TTC / mois, reconduction tacite |
| Annuel | 39,99 € TTC / an, prépayé, sans essai sur ce tunnel |
| Biennal | Price ID présent (29,99 € / 24 mois) — **non affiché** sur page Tarifs |
| Résiliation | Portail Stripe (« Gérer mon abonnement ») |
| Paiement | Stripe (carte) |
| Hébergement front | Vercel (US) |
| Auth / DB | Supabase |
| Analytics | PostHog EU (consentement) + `conversion_events` Supabase |
| E-mails | Resend |
| Intégrations | Strava (opt.), Google OAuth, Google Fonts, Instagram tools (admin Arthur) |
| IA | Arthur AI côté Instagram / admin — **pas** de génération LLM des séances in-app |

---

## A. SCORE DE RISQUE GLOBAL

**Score : 58 / 100** (0 = aucun risque, 100 = risque critique généralisé)

Interprétation : risque **moyen-élevé** avant corrections ; les corrections de cette PR (documents + UX) réduisent le score estimé vers **~38–42** une fois déployées, **sous réserve** de compléter SIRET/adresse/médiateur et de valider l’AIPD blessures.

---

## B. TOP 10 DES RISQUES

1. **Mentions légales incomplètes (SIRET/adresse)** — LCEN  
2. **Médiateur de la consommation non identifié** — Code conso  
3. **Données blessure/douleur = données de santé potentielles sans cadre art. 9 complet** — RGPD  
4. **Droit de rétractation : texte CGV sans case UX préalable** *(corrigé dans cette PR)*  
5. **Acceptation CGU/privacy absente à l’inscription** *(corrigé)*  
6. **Suppression de compte documentée mais absente de l’UI** *(corrigé + cancel Stripe)*  
7. **Google Fonts / Speed Insights hors consentement** *(Speed Insights gated ; Fonts à auto-héberger)*  
8. **Mineurs : formulation permissive antérieure** *(corrigé : 18+)*  
9. **Clause biennale « non résiliable » potentiellement abusive** *(assouplie)*  
10. **Écart code ↔ documents** (biennal, delete, cookies)  

---

## C. CORRECTIONS CODE URGENTES (réalisées / restantes)

### Réalisées dans cette PR
- Réécriture CGU / CGV / Privacy / Cookies / Mentions  
- Cases inscription : 18+ + CGU/privacy  
- Cases pré-checkout : CGV/CGU + renonciation rétractation (UpgradeModal + PlanReadySheet)  
- Consentement explicite onboarding blessure  
- Bouton suppression de compte + cancel Stripe  
- Speed Insights derrière consentement cookies  
- Notice HardPaywall  

### Restantes (recommandées)
- Auto-héberger Google Fonts  
- Cases légales aussi sur Landing/Tarifs avant `create-checkout`  
- Tracer `accepted_terms_at` aussi pour OAuth Google (metadata post-callback)  
- Purge exhaustive toutes tables utilisateur (audit schéma Supabase)  
- Confirmer RLS sur toutes les tables PII  
- AIPD + éventuelle désactivation de la note libre blessure si trop sensible  

---

## D. CORRECTIONS DOCUMENTAIRES URGENTES

- Remplir placeholders `[À FOURNIR]` dans `src/lib/legal-entity.js`  
- Publier identité du médiateur  
- Mettre à jour date / version après chaque changement matériel  
- Établir registre des traitements + DPA  

---

## E–I. DOCUMENTS FINAUX

Intégrés dans l’application aux routes :

- `/cgu` — CGU finales  
- `/cgv` — CGV finales  
- `/politique-confidentialite` — Privacy finale  
- `/politique-cookies` — Cookies finale  
- `/mentions-legales` — Mentions finales  

Source : `src/LegalPages.jsx` + `src/lib/legal-entity.js`.

---

## J. CHECKLIST DE MISE EN PRODUCTION

- [ ] SIRET + adresse + TVA renseignés  
- [ ] Médiateur de la consommation renseigné  
- [ ] Déployer edge function `delete-account` (cancel Stripe)  
- [ ] Vérifier bannière cookies (accept / refuse / reset footer)  
- [ ] Vérifier cases inscription + checkout en staging  
- [ ] Vérifier portail résiliation Stripe  
- [ ] Tester suppression de compte bout-en-bout  
- [ ] Confirmer région Supabase + PostHog EU  
- [ ] Auto-héberger fonts **ou** documenter consentement fonts  
- [ ] Revue avocat (rétractation + art. 9 + clauses engagment)  
- [ ] Registre traitements + procédure violation données  

---

## COMPARAISON MySWYM vs OpenSwim

| Sujet | OpenSwim | MySWYM (avant) | MySWYM conforme ? | Action |
|---|---|---|---|---|
| Identification éditeur | SAS + RCS + adresse | EI, SIRET/adresse manquants | Partiel | Fournir SIRET/adresse |
| Objet du service | App communautaire + training | Générateur rule-based natation | Oui (précisé) | — |
| Création de compte | Acceptation explicite | Implicite | Corrigé | Cases 18+ / CGU |
| Conditions d’utilisation | Très détaillées (US+EU) | Courtes | Renforcé | CGU réécrites |
| Abonnement | Store Apple/Google | Stripe web | Oui | Documenter biennal |
| Paiement | Stores | Stripe | Oui | — |
| Résiliation | In-app / stores | Portail Stripe | Oui | UI claire |
| Remboursement | Juridiction-spécifique | Partiel | Renforcé | CGV |
| Droit de rétractation | Annex EU | Texte seul | Corrigé | UX cases |
| Responsabilité | Waiver US agressif | Soft | Aligné FR | Pas de waiver US |
| Limites du service | Fort (non médical) | Présent | Renforcé | CGU §1/§6 |
| Programmes | Contenu + community | Rule-based | Oui | Expliqué |
| Risques natation | Section dédiée | Court | Renforcé | CGU + onboarding |
| PI | DMCA + IP | Court | Renforcé | CGU |
| Contenu utilisateur | Community | Limité | Oui | CGU |
| Suspension | Détaillée | Présente | Oui | — |
| Disponibilité | Oui | Présente | Oui | — |
| Données perso | Très longue (global) | Incomplète | Renforcé | Privacy |
| Cookies | Section dédiée | Basique | Renforcé | + PostHog/Fonts |
| Sous-traitants | Liste | Partielle | Renforcé | + Resend |
| Suppression données | Oui | Doc ≠ code | Corrigé | UI + function |
| Droits RGPD | Oui | Oui | Oui | — |
| Mineurs | 18+ strict | Ambigu | Corrigé | 18+ |
| Médiation | (EU annex) | Sur demande | Non | Fournir médiateur |
| Réclamations | Oui | Minimal | Renforcé | CGV |
| Droit applicable | FR pour EU | FR | Oui | — |

---

## ANALYSE CLAUSES OPENSWIM (protection)

| Clause OpenSwim | Pourquoi | Pertinent MySWYM | Transposable FR | Nécessaire | Formulation MySWYM |
|---|---|---|---|---|---|
| Assumption of risk / release US | Limiter litiges blessure | Partiel | **Non** (abusif / non opposable conso) | Non sous forme US | Avertissements + responsabilité limitée dans les limites légales |
| No medical advice | Clarifier nature service | Oui | Oui | Oui | CGU §1 et §6 |
| Open water risks | Risques spécifiques | Oui (plans eau libre) | Oui (info) | Oui | CGU §6 |
| 18+ eligibility | Mineurs / capacité | Oui | Oui | Oui | Inscription + Privacy |
| Auto-renewal disclosure | Transparence abo | Oui | Oui | Oui | CGV + UX checkout |
| Price change 30 days | Prévisibilité | Oui | Probable | Recommandé | CGV §3 (15j objectif) |
| Cap liability 12 months fees | Limiter dommage économique | Oui | Partiel (sous réserve droits conso) | Oui avec réserve | CGU §9 |
| Indemnification user | Transférer litiges | Faible (peu d’UGC) | À valider | Non prioritaire | Non ajouté |
| Class action waiver | US | Non | Non | Non | Non |
| Jury trial waiver | US | Non | Non | Non | Non |
| Withdrawal EU annex | Droit conso | Oui | Oui | Oui | CGV §7 + UX |
| Health data sensitivity | RGPD | Oui (blessure) | Oui | Oui | Privacy §2.3 + consent |

---

## RISQUES PÉNAUX POTENTIELS

### 1. Collecte / traitement illicite de données (dont santé)
- **GRAVITÉ :** élevée  
- **PROBABILITÉ :** moyenne  
- **BASE :** RGPD art. 9 / Code pénal (infractions données) — **À VALIDER** qualification exacte  
- **POURQUOI :** champ blessure + note + pain feedback  
- **CORRECTION CODE :** consentement explicite onboarding ; minimisation note  
- **CORRECTION DOCUMENT :** Privacy art. 9  
- **ACTION IMMÉDIATE :** AIPD ; ne pas envoyer notes à PostHog (déjà bloqué)

### 2. Manquement LCEN (éditeur non identifiable)
- **GRAVITÉ :** moyenne  
- **PROBABILITÉ :** élevée tant que SIRET/adresse absents  
- **BASE :** LCEN  
- **CORRECTION DOCUMENT :** placeholders + compléter  
- **ACTION :** fournir identité complète

### 3. Pratiques commerciales trompeuses
- **GRAVITÉ :** moyenne  
- **PROBABILITÉ :** faible-moyenne  
- **POURQUOI :** biennal en CGV mais absent Tarifs ; « pas de remboursement » sans réserve légale claire (corrigé)  
- **ACTION :** aligner offres affichées / code

### 4. Publicité / cookies sans consentement
- **GRAVITÉ :** moyenne  
- **PROBABILITÉ :** moyenne (Fonts, Speed Insights avant fix)  
- **BASE :** ePrivacy / CNIL  
- **CORRECTION :** Speed Insights gated ; Fonts à auto-héberger

### 5. Fraude / usurpation (parrainage, multi-comptes)
- **GRAVITÉ :** faible-moyenne  
- **PROBABILITÉ :** faible  
- **CORRECTION :** anti-doublon checkout + CGU interdits

### 6. Présentation « médicale » abusive
- **GRAVITÉ :** élevée si positionnement médical  
- **PROBABILITÉ :** faible (produit rule-based + disclaimers)  
- **ACTION :** maintenir limites produit ; ne pas diagnostiquer

### 7. Conservation excessive / échec droit à l’effacement
- **GRAVITÉ :** moyenne  
- **PROBABILITÉ :** moyenne avant UI delete  
- **CORRECTION :** bouton + function cancel Stripe

### 8. Accès non autorisé / sécurité insuffisante
- **GRAVITÉ :** élevée  
- **PROBABILITÉ :** dépend RLS / secrets  
- **ACTION :** audit RLS + secrets hors repo (OK actuellement)

### 9. Communications commerciales non consenties
- **GRAVITÉ :** moyenne  
- **PROBABILITÉ :** faible (surtout transactionnel)  
- **ACTION :** documenter ; opt-in si marketing futur

### 10. Contenu protégé / Unsplash démo blog
- **GRAVITÉ :** faible  
- **PROBABILITÉ :** faible  
- **ACTION :** vérifier licences images blog / ne pas publier placeholders Unsplash en prod

---

## COHÉRENCE CODE ↔ DOCUMENTS

| Fonction réelle | Mention docs | Conforme ? | Correction |
|---|---|---|---|
| Essai 7j mensuel carte | CGV | Oui | — |
| Annuel 39,99 sans essai | CGV / Tarifs | Oui | — |
| Biennal 29,99 | CGV oui / Tarifs non | Partiel | Clarifié CGV |
| Portail résiliation | CGV / Profil | Oui | — |
| Suppression compte | Privacy | Oui après UI | Corrigé |
| PostHog consent | Cookies | Oui | — |
| conversion_events sans cookie | Privacy | Oui (documenté) | — |
| Blessure / pain | Privacy art. 9 | Oui après rewrite | Consent UX |
| Google Fonts | Cookies | Oui | Auto-héberger |
| Speed Insights | Cookies | Oui | Gated |
| Génération rule-based | CGU | Oui | — |
| Pas de regen silencieuse | CGU | Oui | — |
| Parrainage −20% / 4,99€ | CGV | Oui | — |
| Rétractation L221-28 | CGV | Oui + UX | Corrigé |
| Médiateur | CGV | Non | `[À FOURNIR]` |
| 18+ | Privacy/CGU | Oui | Cases |

---

## UX JURIDIQUE — PAGE → ÉLÉMENT → TEXTE → COMPORTEMENT

| Page | Élément | Texte | Comportement |
|---|---|---|---|
| `/inscription` | Checkbox âge | « Je confirme avoir 18 ans révolus. » | Bloque submit + OAuth signup |
| `/inscription` | Checkbox CGU/privacy | Liens CGU + privacy | Bloque submit |
| UpgradeModal | CheckoutLegalGates | CGV/CGU + L221-28 | Bloque checkout |
| PlanReadySheet | CheckoutLegalGates | idem | Bloque essai |
| Onboarding blessure | Notice + consent | Notice santé + consent art. 9 | Requis si « oui » |
| Paramètres | Supprimer mon compte | Warning + confirm | Appelle `delete-account` |
| Footer | Gérer les cookies | reset consent | Réaffiche bannière |
| Bannière cookies | Accept / Refuse | PostHog | Opt-in/out |

---

## BENCHMARK NATATION — OÙ TRAITER

| Sujet | CGU | CGV | Privacy | Onboarding | Avant séance |
|---|---|---|---|---|---|
| Entraînement autonome | ✓ | | | ✓ | ✓ (rappel court) |
| Recommandations séances | ✓ | | | | |
| Niveaux / objectifs | ✓ | | ✓ | ✓ | |
| Progression / perfs | ✓ | | ✓ | | |
| Blessures / douleurs | ✓ | | ✓ art.9 | ✓ consent | Feedback pain |
| Reprise après arrêt | ✓ | | | ✓ | |
| Eau libre | ✓ | | | | Contenu séances |
| Piscine / matériel | ✓ | | | ✓ | |
| Absence garantie résultat | ✓ | ✓ | | | |
| Non médical | ✓ | | ✓ | ✓ | |

---

## OBLIGATIONS JURIDIQUES CLÉS (échantillon)

| Texte | Obligation | Impact MySWYM | Correction |
|---|---|---|---|
| LCEN | Identification éditeur/hébergeur | Mentions | Placeholders → compléter |
| C. conso L221-5 s. | Info précontractuelle | Prix, durée, résiliation | CGV + UX |
| C. conso L221-18/28 | Rétractation / exceptions | SaaS immédiat | Cases + CGV |
| C. conso L611-1 s. | Médiation conso | Litiges | Fournir médiateur |
| RGPD art. 6/9/13 | Bases légales + info | Privacy | Réécriture |
| CNIL cookies | Consentement traceurs | PostHog/Fonts | Bannière + gate |
| Clauses abusives C. conso | Équilibre pro/conso | Pas de waiver total | Responsabilité limitée légalement |

**Niveau de certitude :** CERTAIN pour LCEN/info précontractuelle/médiation/RGPD info ; PROBABLE pour qualification données santé ; À VALIDER JURIDIQUEMENT pour portée exacte L221-28 sur essai Stripe et clause d’engagement biennal.

---

## PROPRIÉTÉ INTELLECTUELLE — POINTS DOUTEUX

| Élément | Source / licence | Risque | Action |
|---|---|---|---|
| Images Unsplash (blog démo) | Unsplash | Faible si démo | Remplacer en prod / attribuer |
| Google Fonts | Google | Transfert IP | Auto-héberger |
| Lucide icons | ISC | Faible | OK |
| Contenu séances MySWYM | Original | — | Protéger comme PI éditeur |
| Contenu OpenSwim | Concurrent | — | **Ne pas copier** (respecté) |

---

*Fin du rapport d’audit. Les documents contractuels complets sont servis par l’application.*


## Mise à jour identité & santé (11 août 2026)

- Éditeur : Arthur Noël / A.Natation — SIRET 941 900 052 00015 — 21 Rue du Cachon, 55000 Fains-Véel
- TVA : art. 293 B CGI ; DPA Supabase/Stripe/Vercel
- Médiateur : `[MÉDIATEUR À CONFIRMER]`
- Données santé art. 9 : FC + blessures listes fermées ; consentement séparé ; RLS ; exclus analytics
- Migration : `20260811120000_health_data_rls.sql`

## Mise à jour Buddy sécurisé (11 août 2026)

- Annuaire sans numéro (RPC `get_buddy_directory`) ; téléphone privé + révélation via `get_connection_phones` après match mutuel + double consentement
- Tables : `buddy_connections`, `buddy_blocks`, `buddy_reports`, `buddy_moderation` — suspension auto Buddy à 3 signalements
- UX : avertissement sécurité, e-mail vérifié requis, masquer n° / quitter / signaler / bloquer
- CGU §9 mise en relation ; Privacy §2.7 « Mise en relation et numéro de téléphone » (art. 6.1.a)
- Migration : `20260811140000_buddy_safe_matching.sql` (à appliquer sur Supabase) ; redeploy `delete-account`

