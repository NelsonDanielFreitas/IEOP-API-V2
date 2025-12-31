function errorHandler(err, req, res, next) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const details = err?.details;
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
    error:
      err?.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR"),
    details: status >= 500 ? undefined : details,
  });
}

module.exports = { errorHandler };
