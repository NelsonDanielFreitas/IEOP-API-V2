function errorHandler(err, req, res, next) {
  const status = typeof err?.status === "number" ? err.status : 500;

  const isInvalidJsonBody =
    status === 400 &&
    (err?.type === "entity.parse.failed" ||
      (err instanceof SyntaxError &&
        typeof err?.message === "string" &&
        err.message.toLowerCase().includes("json")));

  const code = isInvalidJsonBody
    ? "INVALID_JSON"
    : err?.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR");

  const details = isInvalidJsonBody
    ? {
        message: "Request body is not valid JSON.",
        hint: "Use double quotes for property names/strings and remove trailing commas.",
      }
    : err?.details;
  const detailsLog =
    typeof details === "string" ? details : JSON.stringify(details);

  // eslint-disable-next-line no-console
  console.error("[api:error]", {
    message: err?.message,
    status,
    code: err?.code,
    details: detailsLog,
  });
  if (err?.stack) {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }

  return res.status(status).json({
    ok: false,
    error: code,
    details: status >= 500 ? undefined : details,
  });
}

module.exports = { errorHandler };
