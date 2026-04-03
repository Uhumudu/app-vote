import axios from "axios";

const BASE_URL = process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api/";
const FRAIS    = parseInt(process.env.ELECTION_FEES) || 500;

// 🔑 Obtenir le token CamPay
async function getToken() {
  const res = await axios.post(`${BASE_URL}token/`, {
    username: process.env.CAMPAY_USERNAME,
    password: process.env.CAMPAY_PASSWORD,
  });
  return res.data.token;
}

// 💰 Initier la collecte de frais
export async function initierCollecte(telephone, adminId) {
  const token              = await getToken();
  const external_reference = `ELECTION-${adminId}-${Date.now()}`;

  const res = await axios.post(
    `${BASE_URL}collect/`,
    {
      amount:             FRAIS,
      currency:           "XAF",
      from:               telephone,         // Format: 237XXXXXXXXX
      description:        "Frais de création d'élection - eVote",
      external_reference,
    },
    { headers: { Authorization: `Token ${token}` } }
  );

  return {
    campay_reference:    res.data.reference,
    external_reference,
    ussd_code:           res.data.ussd_code,
    montant:             FRAIS,
  };
}

// 🔍 Vérifier le statut d'un paiement
export async function verifierStatutCampay(campayReference) {
  const token = await getToken();
  const res   = await axios.get(
    `${BASE_URL}transaction/${campayReference}/`,
    { headers: { Authorization: `Token ${token}` } }
  );
  return res.data; // { status: "SUCCESSFUL" | "PENDING" | "FAILED", ... }
}


// Initier un transfert (retrait vers compte Mobile Money)
export async function initierTransfert({ telephone, montant, description }) {
  const token              = await getToken();
  const external_reference = `RETRAIT-SUPERADMIN-${Date.now()}`;

  const res = await axios.post(
    `${BASE_URL}transfer/`,
    {
      amount:             montant,
      currency:           "XAF",
      to:                 telephone,         // Format: 237XXXXXXXXX
      description:        description || "Retrait super admin - eVote",
      external_reference,
    },
    { headers: { Authorization: `Token ${token}` } }
  );

  return {
    campay_reference:    res.data.reference,
    external_reference,
    montant,
  };
}