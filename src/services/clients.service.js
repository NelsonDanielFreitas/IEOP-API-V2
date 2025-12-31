const { env } = require("../config/env");
const BASE_URL_VENDUS = "https://www.vendus.pt/ws/v1.1/clients";

function buildVendusRequest() {
  if (!env.vendusApiKey) {
    const err = new Error("Missing VENDUS_API_KEY");
    err.status = 500;
    err.code = "CONFIG_MISSING";
    throw err;
  }

  const url = new URL(BASE_URL_VENDUS);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${env.vendusApiKey}`,
  };

  return { url, headers };
}

async function createClientInVendus(clientData) {
  const { headers } = buildVendusRequest();

  if (!clientData?.name) {
    const err = new Error("Missing client name");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    err.details = { field: "name" };
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const payload = {
    email: clientData.email,
    name: clientData.name,
    phone: clientData.phone,
  };

  try {
    const response = await fetch(BASE_URL_VENDUS, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    const body = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const err = new Error(
        `Falha ao criar cliente no Vendus (${response.status})`
      );
      err.status = response.status;
      err.code = "VENDUS_CREATE_FAILED";
      err.details = body;
      throw err;
    }

    return body;
  } catch (error) {
    if (error?.name === "AbortError") {
      const err = new Error("Vendus request timeout");
      err.status = 504;
      err.code = "VENDUS_TIMEOUT";
      throw err;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

module.exports = {
  createClientInVendus,
};
