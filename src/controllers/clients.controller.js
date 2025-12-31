const clientsService = require("../services/clients.service");

function normalizeClientData(body) {
  if (!body) {
    return body;
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  if ("name" in body || "email" in body || "phone" in body) {
    return body;
  }

  for (const value of Object.values(body)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("name" in value || "email" in value || "phone" in value)
    ) {
      return value;
    }
  }

  return body;
}

exports.createClientInVendus = async (req, res, next) => {
  try {
    const clientData = normalizeClientData(req.body);

    if (!clientData || typeof clientData !== "object") {
      const err = new Error("Missing or invalid request body");
      err.status = 400;
      err.code = "INVALID_BODY";
      err.details = { expected: "JSON object with name/email/phone" };
      throw err;
    }

    const newClient = await clientsService.createClientInVendus(clientData);
    return res.status(201).json({ ok: true, data: newClient });
  } catch (error) {
    return next(error);
  }
};
