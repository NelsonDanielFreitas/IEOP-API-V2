const { env } = require("../config/env");

const BASE_URL_VENDUS = "https://www.vendus.pt/ws/v1.1/documents";

function safeJsonParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildVendusRequest() {
  if (!env.vendusApiKey) {
    const err = new Error("Missing VENDUS_API_KEY");
    err.status = 500;
    err.code = "CONFIG_MISSING";
    throw err;
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${env.vendusApiKey}`,
  };

  return { headers };
}

async function getAllDocumentsVendus() {
  const { headers } = buildVendusRequest();
  const response = await fetch(BASE_URL_VENDUS, {
    method: "GET",
    headers: { ...headers },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const err = new Error(
      `Failed to fetch documents from Vendus (${response.status})`
    );
    err.status = response.status;
    err.code = "VENDUS_FETCH_FAILED";
    err.details = body;
    throw err;
  }
  return body;
}

async function createDocumentInVendus(documentData) {
  const { headers } = buildVendusRequest();

  if (!env.vendusRegisterId) {
    const err = new Error("Missing VENDUS_REGISTER_ID");
    err.status = 500;
    err.code = "CONFIG_MISSING";
    throw err;
  }

  const clientEmail = documentData?.ClientEmail;
  if (!clientEmail || typeof clientEmail !== "string") {
    const err = new Error("Missing client email");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    err.details = { field: "ClientEmail" };
    throw err;
  }

  const itemId = documentData?.ItemId;
  if (itemId === undefined || itemId === null) {
    const err = new Error("Missing item id");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    err.details = { field: "ItemId" };
    throw err;
  }

  const grossPrice = documentData?.GrossPrice;
  if (grossPrice === undefined || grossPrice === null) {
    const err = new Error("Missing gross price");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    err.details = { field: "GrossPrice" };
    throw err;
  }

  const clientVendusId = await getClientVendusId(clientEmail);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const payload = {
    register_id: Number(env.vendusRegisterId),
    items: [
      {
        id: itemId,
        qty: 1,
        gross_price: grossPrice,
      },
    ],
    client: {
      id: clientVendusId.id,
      name: clientVendusId.client_name,
      email: clientVendusId.email,
    },
    mode: "normal",
    payments: [
      {
        id: 295779699,
      },
    ],
    notes: documentData.Notes || "",
  };

  let response;
  try {
    response = await fetch(BASE_URL_VENDUS, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error("Timeout ao comunicar com o Vendus");
      err.status = 504;
      err.code = "VENDUS_TIMEOUT";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const rawText = await response.text();
  const parsed = safeJsonParse(rawText);

  if (!response.ok) {
    let errorMessage = `Falha ao criar documento no Vendus (${response.status})`;
    let errorCode = "VENDUS_DOCUMENT_CREATION_FAILED";

    const firstError = parsed?.errors?.[0];
    if (firstError?.code === "A001") {
      if (firstError?.message?.type === "COMPANY_TRIAL_REACHED_LIMIT") {
        errorMessage =
          "Limite de documentos atingido no período experimental do Vendus";
        errorCode = "VENDUS_TRIAL_LIMIT_REACHED";
      } else {
        errorMessage =
          "Configuração necessária no Vendus: cria um registo do tipo 'API' no backoffice e configura VENDUS_REGISTER_ID";
        errorCode = "VENDUS_REGISTER_NOT_CONFIGURED";
      }
    } else if (firstError?.message) {
      errorMessage =
        typeof firstError.message === "string"
          ? firstError.message
          : firstError.message.message || errorMessage;
    }

    const err = new Error(errorMessage);
    err.status = response.status;
    err.code = errorCode;
    err.details = parsed || rawText;
    throw err;
  }

  const vendusDocument = parsed;
  return {
    id: vendusDocument?.id,
    type: vendusDocument?.type,
    number: vendusDocument?.number,
    date: vendusDocument?.date,
    amount_gross: vendusDocument?.amount_gross,
    amount_net: vendusDocument?.amount_net,
    hash: vendusDocument?.hash,
    atcud: vendusDocument?.atcud,
    qrcode: vendusDocument?.qrcode,
    output: vendusDocument?.output,
    output_data: vendusDocument?.output_data,
  };
}

// Ir buscar o id do cliente no Vendus através do email
async function getClientVendusId(clientEmail) {
  const { headers } = buildVendusRequest();
  const url =
    "https://www.vendus.pt/ws/v1.1/clients?email=" +
    encodeURIComponent(clientEmail);

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const err = new Error(`Falha ao obter clientes (${res.status})`);
    err.status = res.status;
    err.code = "VENDUS_CLIENTS_FAILED";
    throw err;
  }

  const clients = await res.json();
  const found = clients.find(
    (u) => u.email.toLowerCase() === clientEmail.toLowerCase()
  );

  if (!found) {
    const err = new Error(`Cliente '${clientEmail}' não encontrado no Vendus`);
    err.status = 404;
    err.code = "CLIENT_NOT_FOUND";
    err.details = { available: clients.map((u) => u.email) };
    throw err;
  }

  return found;
}

module.exports = {
  getAllDocumentsVendus,
  createDocumentInVendus,
};
