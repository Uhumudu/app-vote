// backend/services/publicMailer.js
// Emails pour les élections publiques :
//   - Accusé réception candidature (au candidat)
//   - Alerte nouvelle candidature  (à l'admin)
//   - Candidature approuvée / rejetée (au candidat)
//   - Confirmation vote payé        (à l'électeur)
//
// Utilise le même transporter nodemailer que votre mailer.js existant.
// Assurez-vous que les variables d'env EMAIL_USER / EMAIL_PASS sont définies.

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `"EVote Platform" <${process.env.EMAIL_USER}>`;

// ─── Palette couleurs commune ─────────────────────────────────────────────────
const COLORS = {
  indigo:    "#4f46e5",
  indigoDark:"#4338ca",
  green:     "#16a34a",
  greenBg:   "#f0fdf4",
  red:       "#dc2626",
  redBg:     "#fef2f2",
  amber:     "#d97706",
  amberBg:   "#fffbeb",
  gray:      "#64748b",
  grayBg:    "#f8fafc",
  white:     "#ffffff",
  dark:      "#1e1b4b",
};

// ─── Layout HTML commun ───────────────────────────────────────────────────────
const layout = (accentColor, iconEmoji, content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EVote</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${accentColor},${COLORS.indigoDark});border-radius:20px 20px 0 0;padding:36px 40px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">${iconEmoji}</div>
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:4px 14px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
              EVote Platform
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:${COLORS.white};padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 20px 20px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Vous recevez cet email car vous avez interagi avec la plateforme EVote.<br/>
              © ${new Date().getFullYear()} EVote — Tous droits réservés.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Composants HTML réutilisables ────────────────────────────────────────────
const h1 = (text, color = COLORS.dark) =>
  `<h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:${color};letter-spacing:-0.5px;">${text}</h1>`;

const p = (text, style = "") =>
  `<p style="margin:0 0 16px;font-size:15px;color:${COLORS.gray};line-height:1.7;${style}">${text}</p>`;

const infoBox = (rows, borderColor = COLORS.indigo, bg = "#eef2ff") => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1.5px solid ${borderColor}33;border-radius:14px;margin-bottom:24px;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:10px 18px;font-size:13px;font-weight:600;color:${COLORS.gray};width:40%;border-bottom:1px solid ${borderColor}15;">${label}</td>
        <td style="padding:10px 18px;font-size:13px;font-weight:700;color:${COLORS.dark};border-bottom:1px solid ${borderColor}15;">${value}</td>
      </tr>`).join("")}
  </table>`;

const btn = (text, url, bgColor = COLORS.indigo) => `
  <div style="text-align:center;margin:24px 0 8px;">
    <a href="${url}" style="display:inline-block;padding:13px 32px;background:${bgColor};color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 14px ${bgColor}55;">
      ${text} →
    </a>
  </div>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;

// ─── 1. Accusé réception candidature → au candidat ───────────────────────────
export const sendCandidatureReceivedEmail = async ({ email, nom, prenom, titreElection, candidat_id }) => {
  if (!email) return; // email optionnel

  const html = layout(COLORS.indigo, "📋", `
    ${h1("Candidature bien reçue !")}
    ${p(`Bonjour <strong style="color:${COLORS.dark}">${prenom} ${nom}</strong>,`)}
    ${p(`Votre candidature à l'élection <strong>"${titreElection}"</strong> a été enregistrée avec succès.
         Elle est actuellement <strong>en attente d'examen</strong> par l'administrateur.`)}
    ${infoBox([
      ["Élection",    titreElection],
      ["Candidat",    `${prenom} ${nom}`],
      ["ID candidat", `#${candidat_id}`],
      ["Statut",      "⏳ En attente de validation"],
    ])}
    ${p(`Conservez votre <strong>ID candidat #${candidat_id}</strong> — il vous permet d'accéder à votre tableau de bord une fois approuvé.`, `background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;color:${COLORS.amber};`)}
    ${btn("Voir l'élection", `${process.env.FRONTEND_URL || "https://evote.cm"}/voter/${candidat_id}`)}
    ${divider()}
    ${p("Vous recevrez un email dès que votre candidature sera traitée.", "font-size:13px;")}
  `);

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `📋 Candidature reçue — ${titreElection}`,
    html,
  });
};

// ─── 2. Alerte nouvelle candidature → à l'admin ──────────────────────────────
export const sendNewCandidatureAlertEmail = async ({ adminEmail, adminNom, adminPrenom, candidatNom, candidatPrenom, candidatEmail, candidatTel, titreElection, election_id, candidat_id }) => {
  if (!adminEmail) return;

  const html = layout(COLORS.amber, "🔔", `
    ${h1("Nouvelle candidature reçue", COLORS.amber)}
    ${p(`Bonjour <strong style="color:${COLORS.dark}">${adminPrenom} ${adminNom}</strong>,`)}
    ${p(`Une nouvelle candidature a été soumise pour votre élection <strong>"${titreElection}"</strong>. Elle est en attente de votre validation.`)}
    ${infoBox([
      ["Candidat",   `${candidatPrenom} ${candidatNom}`],
      ["Email",      candidatEmail || "—"],
      ["Téléphone",  candidatTel   || "—"],
      ["ID candidat",`#${candidat_id}`],
      ["Élection",   titreElection],
    ], COLORS.amber, COLORS.amberBg)}
    ${btn("Examiner la candidature", `${process.env.FRONTEND_URL || "https://evote.cm"}/admin/elections/${election_id}/candidatures`, COLORS.amber)}
    ${divider()}
    ${p("Connectez-vous à votre espace admin pour approuver ou rejeter cette candidature.", "font-size:13px;")}
  `);

  await transporter.sendMail({
    from:    FROM,
    to:      adminEmail,
    subject: `🔔 Nouvelle candidature — ${titreElection}`,
    html,
  });
};

// ─── 3a. Candidature approuvée → au candidat ─────────────────────────────────
export const sendCandidatureApprouveeEmail = async ({ email, nom, prenom, titreElection, candidat_id, dateDebut }) => {
  if (!email) return;

  const html = layout(COLORS.green, "✅", `
    ${h1("Votre candidature est approuvée !", COLORS.green)}
    ${p(`Bonjour <strong style="color:${COLORS.dark}">${prenom} ${nom}</strong>,`)}
    ${p(`Bonne nouvelle ! Votre candidature à l'élection <strong>"${titreElection}"</strong> a été <strong style="color:${COLORS.green}">approuvée</strong> par l'administrateur.
         Vous êtes désormais visible par tous les électeurs.`)}
    ${infoBox([
      ["Élection",    titreElection],
      ["Candidat",    `${prenom} ${nom}`],
      ["ID candidat", `#${candidat_id}`],
      ["Début vote",  dateDebut],
      ["Statut",      "✅ Approuvé — visible publiquement"],
    ], COLORS.green, COLORS.greenBg)}
    ${btn("Voir mon tableau de bord", `${process.env.FRONTEND_URL || "https://evote.cm"}/dashboard-candidat?mode=candidat&id=${candidat_id}`, COLORS.green)}
    ${divider()}
    ${p(`Partagez votre candidature et mobilisez vos soutiens ! Votre ID candidat est <strong>#${candidat_id}</strong>.`, "font-size:13px;")}
  `);

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `✅ Candidature approuvée — ${titreElection}`,
    html,
  });
};

// ─── 3b. Candidature rejetée → au candidat ───────────────────────────────────
export const sendCandidatureRejeteeEmail = async ({ email, nom, prenom, titreElection }) => {
  if (!email) return;

  const html = layout(COLORS.red, "❌", `
    ${h1("Candidature non retenue", COLORS.red)}
    ${p(`Bonjour <strong style="color:${COLORS.dark}">${prenom} ${nom}</strong>,`)}
    ${p(`Nous vous informons que votre candidature à l'élection <strong>"${titreElection}"</strong> n'a <strong style="color:${COLORS.red}">pas été retenue</strong> par l'administrateur.`)}
    ${p(`Si vous pensez qu'il s'agit d'une erreur, contactez directement l'organisateur de l'élection.`, `background:${COLORS.redBg};border:1px solid #fecaca;border-radius:10px;padding:12px 16px;color:${COLORS.red};`)}
    ${btn("Voir les résultats de l'élection", `${process.env.FRONTEND_URL || "https://evote.cm"}/voter/1`, COLORS.red)}
    ${divider()}
    ${p("Merci de votre participation à la plateforme EVote.", "font-size:13px;")}
  `);

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `❌ Candidature non retenue — ${titreElection}`,
    html,
  });
};

// ─── 4. Confirmation vote payé → à l'électeur (si email fourni) ──────────────
export const sendVoteConfirmationEmail = async ({ email, nomElecteur, candidatNom, candidatPrenom, titreElection, frais, campayRef, election_id }) => {
  if (!email) return;

  const html = layout(COLORS.green, "🗳", `
    ${h1("Votre vote est confirmé !", COLORS.green)}
    ${p(`Bonjour <strong style="color:${COLORS.dark}">${nomElecteur || "Électeur"}</strong>,`)}
    ${p(`Votre vote pour <strong style="color:${COLORS.indigo}">${candidatPrenom} ${candidatNom}</strong> lors de l'élection
         <strong>"${titreElection}"</strong> a été enregistré avec succès.`)}
    ${infoBox([
      ["Élection",   titreElection],
      ["Candidat",   `${candidatPrenom} ${candidatNom}`],
      ["Montant",    `${frais} XAF`],
      ["Référence",  campayRef],
      ["Statut",     "✅ Vote confirmé"],
    ], COLORS.green, COLORS.greenBg)}
    ${p(`Vous pouvez voter à nouveau en payant les frais de <strong>${frais} XAF</strong>.`, `background:${COLORS.grayBg};border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;`)}
    ${btn("Voir les résultats en direct", `${process.env.FRONTEND_URL || "https://evote.cm"}/resultats/${election_id}`)}
    ${divider()}
    ${p("Merci d'avoir participé à cette élection sur EVote.", "font-size:13px;")}
  `);

  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `🗳 Vote confirmé — ${titreElection}`,
    html,
  });
};
