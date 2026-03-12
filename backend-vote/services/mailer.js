// backend/services/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Envoyer les credentials à un électeur nouvellement ajouté
 * @param {Object} params
 * @param {string} params.email          - Email de l'électeur
 * @param {string} params.nom            - Nom
 * @param {string} params.prenom         - Prénom
 * @param {string} params.motDePasse     - Mot de passe en clair
 * @param {string} params.titreElection  - Titre de l'élection
 */
export const sendCredentialsEmail = async ({ email, nom, prenom, motDePasse, titreElection }) => {
  const mailOptions = {
    from: `"eVote – Plateforme de vote" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `🗳 Votre accès à l'élection : ${titreElection}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0;">

        <!-- Header -->
        <div style="background: #4f46e5; padding: 30px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🗳 eVote</h1>
          <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Plateforme de vote en ligne sécurisée</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px 40px; background: white;">
          <p style="font-size: 16px; color: #333;">Bonjour <strong>${prenom} ${nom}</strong>,</p>

          <p style="color: #555; line-height: 1.6;">
            Vous avez été inscrit(e) en tant qu'électeur(trice) pour l'élection suivante :
          </p>

          <div style="background: #eef2ff; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
            <strong style="color: #4f46e5;">📋 ${titreElection}</strong>
          </div>

          <p style="color: #555;">Voici vos identifiants de connexion :</p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 10px 14px; background: #f3f4f6; border-radius: 6px 0 0 6px; color: #666; font-size: 14px; width: 40%;">
                📧 Email
              </td>
              <td style="padding: 10px 14px; background: #f9fafb; border-radius: 0 6px 6px 0; font-weight: bold; color: #111; font-size: 14px;">
                ${email}
              </td>
            </tr>
            <tr><td colspan="2" style="height: 8px;"></td></tr>
            <tr>
              <td style="padding: 10px 14px; background: #f3f4f6; border-radius: 6px 0 0 6px; color: #666; font-size: 14px;">
                🔑 Mot de passe
              </td>
              <td style="padding: 10px 14px; background: #f9fafb; border-radius: 0 6px 6px 0; font-weight: bold; color: #111; font-family: monospace; font-size: 16px; letter-spacing: 2px;">
                ${motDePasse}
              </td>
            </tr>
          </table>

          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              ⚠️ <strong>Important :</strong> Ce mot de passe est provisoire. Conservez-le précieusement et ne le partagez avec personne.
            </p>
          </div>

          <p style="color: #555; line-height: 1.6;">
            Connectez-vous sur la plateforme eVote avec ces identifiants pour participer au vote.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/Login"
              style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
              Se connecter →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f3f4f6; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Cet email a été envoyé automatiquement par la plateforme eVote.<br/>
            Si vous pensez avoir reçu cet email par erreur, veuillez l'ignorer.
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
