import axios from "axios";

const BASE_URL = process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api/";
const FRAIS    = parseInt(process.env.ELECTION_FEES) || 500;

// ─────────────────────────────────────────────────────────────
// 🔑 Obtenir le token CamPay (username + password)
// ─────────────────────────────────────────────────────────────
async function getToken() {
  try {
    const response = await axios.post(`${BASE_URL}token/`, {
      username: process.env.CAMPAY_USERNAME,
      password: process.env.CAMPAY_PASSWORD,
    });
    return response.data.token;
  } catch (error) {
    console.error("❌ ERREUR TOKEN CAMPAY:", {
      message: error.message,
      data:    error.response?.data,
    });
    throw new Error("Impossible de récupérer le token CamPay");
  }
}

// ─────────────────────────────────────────────────────────────
// 💰 Initier la collecte (paiement entrant)
// ─────────────────────────────────────────────────────────────
export async function initierCollecte(telephone, adminId) {
  try {
    const token              = await getToken();
    const external_reference = `ELECTION-${adminId}-${Date.now()}`;

    const response = await axios.post(
      `${BASE_URL}collect/`,
      {
        amount:             String(FRAIS),
        currency:           "XAF",
        from:               telephone,
        description:        "Frais de création d'élection - eVote",
        external_reference,
      },
      { headers: { Authorization: `Token ${token}` } }
    );

    return {
      campay_reference: response.data.reference,
      external_reference,
      ussd_code:        response.data.ussd_code,
      montant:          FRAIS,
    };
  } catch (error) {
    console.error("❌ ERREUR COLLECTE CAMPAY:", {
      message: error.message,
      data:    error.response?.data,
      status:  error.response?.status,
    });
    throw new Error("Erreur lors de l'initiation du paiement");
  }
}

// ─────────────────────────────────────────────────────────────
// 💰 Collecte avec montant personnalisé (votes publics)
// ─────────────────────────────────────────────────────────────
export async function campayCollect({ amount, from, description, external_reference }) {
  try {
    const token = await getToken();

    const response = await axios.post(
      `${BASE_URL}collect/`,
      {
        amount:   String(amount),
        currency: "XAF",
        from,
        description,
        external_reference,
      },
      { headers: { Authorization: `Token ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error("❌ ERREUR CAMPAY COLLECT:", {
      message: error.message,
      data:    error.response?.data,
      status:  error.response?.status,
    });
    throw new Error(error.response?.data?.message || "Erreur paiement CamPay");
  }
}

// ─────────────────────────────────────────────────────────────
// 🔍 Vérifier le statut d'une transaction
// ─────────────────────────────────────────────────────────────
export async function verifierStatutCampay(campayReference) {
  try {
    const token = await getToken();

    const response = await axios.get(
      `${BASE_URL}transaction/${campayReference}/`,
      { headers: { Authorization: `Token ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error("❌ ERREUR STATUT CAMPAY:", {
      message: error.message,
      data:    error.response?.data,
      status:  error.response?.status,
    });
    throw new Error("Erreur lors de la vérification du statut");
  }
}

// ─────────────────────────────────────────────────────────────
// 💸 Initier un transfert sortant (RETRAIT)
//
// ⚠️  IMPORTANT : L'endpoint /transfer/ n'est PAS disponible
//    sur demo.campay.net — il faut un compte de production.
//    En mode démo, on simule la réponse pour éviter le crash.
// ─────────────────────────────────────────────────────────────
export async function initierTransfert({ telephone, montant, description }) {
  const isDemo = BASE_URL.includes("demo.campay.net");

  // ── Mode DÉMO : simuler un retrait (pas d'endpoint réel) ──
  if (isDemo) {
    console.warn("⚠️  CamPay DEMO : /transfer/ non disponible — simulation activée.");
    const fakeReference    = `DEMO-RETRAIT-${Date.now()}`;
    const external_reference = `RETRAIT-${Date.now()}`;
    console.log("📤 Simulation retrait CamPay:", { telephone, montant, description });
    return {
      campay_reference: fakeReference,
      external_reference,
      montant,
    };
  }

  // ── Mode PRODUCTION ───────────────────────────────────────
  try {
    const token              = await getToken();
    const external_reference = `RETRAIT-${Date.now()}`;

    console.log("📤 Envoi retrait CamPay (production):", { telephone, montant, description });

    const response = await axios.post(
      `${BASE_URL}transfer/`,
      {
        amount:             String(montant),
        currency:           "XAF",
        to:                 telephone,
        description:        description || "Retrait eVote",
        external_reference,
      },
      { headers: { Authorization: `Token ${token}` } }
    );

    console.log("✅ Réponse CamPay transfer:", response.data);

    return {
      campay_reference: response.data.reference,
      external_reference,
      montant,
    };
  } catch (error) {
    console.error("❌ ERREUR TRANSFERT CAMPAY:", {
      message: error.message,
      data:    error.response?.data,
      status:  error.response?.status,
    });
    throw new Error(error.response?.data?.message || "Échec du transfert CamPay");
  }
}
































// import axios from "axios";

// const BASE_URL = process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api/";
// const FRAIS = parseInt(process.env.ELECTION_FEES) || 500;

// // ─────────────────────────────────────────────────────────────
// // 🔑 Obtenir le token CamPay
// // ─────────────────────────────────────────────────────────────
// async function getToken() {
//   try {
//     const res = await axios.post(`${BASE_URL}token/`, {
//       username: process.env.CAMPAY_USERNAME,
//       password: process.env.CAMPAY_PASSWORD,
//     });

//     return res.data.token;

//   } catch (error) {
//     console.error("❌ ERREUR TOKEN CAMPAY:", {
//       message: error.message,
//       data: error.response?.data,
//     });
//     throw new Error("Impossible de récupérer le token CamPay");
//   }
// }

// // ─────────────────────────────────────────────────────────────
// // 💰 Initier la collecte (paiement entrant)
// // ─────────────────────────────────────────────────────────────
// export async function initierCollecte(telephone, adminId) {
//   try {
//     const token = await getToken();
//     const external_reference = `ELECTION-${adminId}-${Date.now()}`;

//     const res = await axios.post(
//       `${BASE_URL}collect/`,
//       {
//         amount: FRAIS,
//         currency: "XAF",
//         from: telephone,
//         description: "Frais de création d'élection - eVote",
//         external_reference,
//       },
//       {
//         headers: {
//           Authorization: `Token ${token}`,
//         },
//       }
//     );

//     return {
//       campay_reference: res.data.reference,
//       external_reference,
//       ussd_code: res.data.ussd_code,
//       montant: FRAIS,
//     };

//   } catch (error) {
//     console.error("❌ ERREUR COLLECTE CAMPAY:", {
//       message: error.message,
//       data: error.response?.data,
//       status: error.response?.status,
//     });
//     throw new Error("Erreur lors de l'initiation du paiement");
//   }
// }

// // ─────────────────────────────────────────────────────────────
// // 🔍 Vérifier le statut d'une transaction
// // ─────────────────────────────────────────────────────────────
// export async function verifierStatutCampay(campayReference) {
//   try {
//     const token = await getToken();

//     const res = await axios.get(
//       `${BASE_URL}transaction/${campayReference}/`,
//       {
//         headers: {
//           Authorization: `Token ${token}`,
//         },
//       }
//     );

//     return res.data;

//   } catch (error) {
//     console.error("❌ ERREUR STATUT CAMPAY:", {
//       message: error.message,
//       data: error.response?.data,
//       status: error.response?.status,
//     });
//     throw new Error("Erreur lors de la vérification du statut");
//   }
// }

// // ─────────────────────────────────────────────────────────────
// // 💸 Initier un transfert (RETRAIT)
// // ─────────────────────────────────────────────────────────────
// export async function initierTransfert({ telephone, montant, description }) {
//   try {
//     const token = await getToken();
//     const external_reference = `RETRAIT-${Date.now()}`;

//     console.log("📤 Envoi retrait CamPay:", {
//       telephone,
//       montant,
//       description,
//     });

//     const res = await axios.post(
//       `${BASE_URL}transfer/`,
//       {
//         amount: montant,
//         currency: "XAF",
//         to: telephone,
//         description: description || "Retrait eVote",
//         external_reference,
//       },
//       {
//         headers: {
//           Authorization: `Token ${token}`,
//         },
//       }
//     );

//     console.log("✅ Réponse CamPay:", res.data);

//     return {
//       campay_reference: res.data.reference,
//       external_reference,
//       montant,
//     };

//   } catch (error) {
//     console.error("❌ ERREUR TRANSFERT CAMPAY:", {
//       message: error.message,
//       data: error.response?.data,
//       status: error.response?.status,
//     });
//     // Dans initierTransfert — ajoutez ce log avant le return
// // console.log("📤 CamPay transfer URL:", `${BASE_URL}transfer/`);
// // console.log("📤 CamPay transfer response:", res.data);

//     throw new Error(
//       error.response?.data?.message ||
//       "Échec du transfert CamPay"
//     );
//   }
// }
// // Ajouter dans campay.service.js
// export async function campayCollect({ amount, from, description, external_reference }) {
//   const token = await getToken();
//   const res = await axios.post(
//     `${BASE_URL}collect/`,
//     { amount: String(amount), currency: "XAF", from, description, external_reference },
//     { headers: { Authorization: `Token ${token}` } }
//   );
//   return res.data;
// }

