function errorHandler(err, req, res, next) {
  const status = typeof err?.status === "number" ? err.status : 500;

  // eslint-disable-next-line no-console
  console.error("[api:error]", err);

  return res.status(status).json({
    ok: false,
    error:
      err?.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR"),
    details: status >= 500 ? undefined : err?.details,
  });
}

module.exports = { errorHandler };
