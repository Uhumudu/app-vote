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

/**
 * Envoyer une confirmation de vote à l'électeur
 */
export const sendVoteConfirmationEmail = async ({ email, nom, prenom, titreElection, dateVote }) => {
  const mailOptions = {
    from: `"eVote – Plateforme de vote" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `✅ Confirmation de vote — ${titreElection}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0;">

        <!-- Header -->
        <div style="background: #4f46e5; padding: 30px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🗳 eVote</h1>
          <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Plateforme de vote en ligne sécurisée</p>
        </div>

        <!-- Icône succès -->
        <div style="background: white; padding: 36px 40px 0; text-align: center;">
          <div style="width: 72px; height: 72px; background: #ecfdf5; border-radius: 50%; display: inline-block; line-height: 72px; font-size: 36px;">✅</div>
          <h2 style="margin: 16px 0 6px; font-size: 22px; font-weight: 800; color: #1e1b4b;">
            Votre vote a bien été enregistré !
          </h2>
          <p style="margin: 0 0 28px; font-size: 15px; color: #6b7280;">
            Bonjour <strong style="color: #1e1b4b;">${prenom} ${nom}</strong>,
            votre participation a été prise en compte avec succès.
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 0 40px 32px; background: white;">

          <!-- Récapitulatif -->
          <div style="background: #eef2ff; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px;">
            <p style="margin: 0 0 14px; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.08em;">
              Récapitulatif
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0;">Élection</td>
                <td style="font-size: 13px; font-weight: 700; color: #1e1b4b; text-align: right; padding: 6px 0;">${titreElection}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0; border-top: 1px solid #e0e7ff;">Électeur</td>
                <td style="font-size: 13px; font-weight: 700; color: #1e1b4b; text-align: right; padding: 6px 0; border-top: 1px solid #e0e7ff;">${prenom} ${nom}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0; border-top: 1px solid #e0e7ff;">Date du vote</td>
                <td style="font-size: 13px; font-weight: 700; color: #1e1b4b; text-align: right; padding: 6px 0; border-top: 1px solid #e0e7ff;">${dateVote}</td>
              </tr>
            </table>
          </div>

          <!-- Note anonymat -->
          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px;">
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #92400e;">
              🔒 Vote anonyme et sécurisé
            </p>
            <p style="margin: 0; font-size: 12px; color: #b45309; line-height: 1.6;">
              Votre choix est strictement confidentiel et ne peut pas être modifié une fois validé.
              Aucune information sur votre vote ne sera divulguée.
            </p>
          </div>

          <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
            Merci pour votre participation à cette élection.
          </p>
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

/**
 * Notifier le créateur que son élection a été approuvée
 */
export const sendElectionApprovedEmail = async ({ email, nom, prenom, titreElection, dateDebut }) => {
  const mailOptions = {
    from: `"eVote – Plateforme de vote" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `✅ Votre élection a été approuvée — ${titreElection}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0;">

        <!-- Header -->
        <div style="background: #4f46e5; padding: 30px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🗳 eVote</h1>
          <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Plateforme de vote en ligne sécurisée</p>
        </div>

        <!-- Icône succès -->
        <div style="background: white; padding: 36px 40px 0; text-align: center;">
          <div style="width: 72px; height: 72px; background: #ecfdf5; border-radius: 50%; display: inline-block; line-height: 72px; font-size: 36px;">✅</div>
          <h2 style="margin: 16px 0 6px; font-size: 22px; font-weight: 800; color: #1e1b4b;">
            Élection approuvée !
          </h2>
          <p style="margin: 0 0 28px; font-size: 15px; color: #6b7280;">
            Bonjour <strong style="color: #1e1b4b;">${prenom} ${nom}</strong>,
            votre élection a été validée par le Super Administrateur.
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 0 40px 32px; background: white;">

          <!-- Récapitulatif -->
          <div style="background: #eef2ff; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px;">
            <p style="margin: 0 0 14px; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.08em;">
              Récapitulatif
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0;">Élection</td>
                <td style="font-size: 13px; font-weight: 700; color: #1e1b4b; text-align: right; padding: 6px 0;">${titreElection}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0; border-top: 1px solid #e0e7ff;">Statut</td>
                <td style="font-size: 13px; font-weight: 700; color: #16a34a; text-align: right; padding: 6px 0; border-top: 1px solid #e0e7ff;">✅ Approuvée</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0; border-top: 1px solid #e0e7ff;">Date de début</td>
                <td style="font-size: 13px; font-weight: 700; color: #1e1b4b; text-align: right; padding: 6px 0; border-top: 1px solid #e0e7ff;">${dateDebut}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.6;">
              🎉 Vous pouvez dès maintenant vous connecter à votre espace administrateur pour gérer vos candidats et électeurs.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login"
              style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
              Accéder à mon espace →
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

/**
 * Notifier le créateur que son élection a été refusée
 */
export const sendElectionRejectedEmail = async ({ email, nom, prenom, titreElection }) => {
  const mailOptions = {
    from: `"eVote – Plateforme de vote" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `❌ Votre élection a été refusée — ${titreElection}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; border: 1px solid #e0e0e0;">

        <!-- Header -->
        <div style="background: #4f46e5; padding: 30px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🗳 eVote</h1>
          <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Plateforme de vote en ligne sécurisée</p>
        </div>

        <!-- Icône refus -->
        <div style="background: white; padding: 36px 40px 0; text-align: center;">
          <div style="width: 72px; height: 72px; background: #fef2f2; border-radius: 50%; display: inline-block; line-height: 72px; font-size: 36px;">❌</div>
          <h2 style="margin: 16px 0 6px; font-size: 22px; font-weight: 800; color: #1e1b4b;">
            Élection non approuvée
          </h2>
          <p style="margin: 0 0 28px; font-size: 15px; color: #6b7280;">
            Bonjour <strong style="color: #1e1b4b;">${prenom} ${nom}</strong>,
            votre demande de création d'élection n'a pas pu être validée.
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 0 40px 32px; background: white;">

          <!-- Récapitulatif -->
          <div style="background: #fff1f2; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px;">
            <p style="margin: 0 0 14px; font-size: 11px; font-weight: 700; color: #e11d48; text-transform: uppercase; letter-spacing: 0.08em;">
              Récapitulatif
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0;">Élection</td>
                <td style="font-size: 13px; font-weight: 700; color: #1e1b4b; text-align: right; padding: 6px 0;">${titreElection}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #6b7280; padding: 6px 0; border-top: 1px solid #ffe4e6;">Statut</td>
                <td style="font-size: 13px; font-weight: 700; color: #dc2626; text-align: right; padding: 6px 0; border-top: 1px solid #ffe4e6;">❌ Refusée</td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
              ⚠️ Pour plus d'informations sur les raisons de ce refus ou pour soumettre une nouvelle demande,
              veuillez contacter l'équipe eVote ou soumettre une nouvelle élection en rectifiant les informations.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/creer-election"
              style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
              Soumettre une nouvelle élection →
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


