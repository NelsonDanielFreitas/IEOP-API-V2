function notFoundHandler(req, res) {
  return res.status(404).json({
    ok: false,
    error: "NOT_FOUND",
    path: req.originalUrl,
  });
}

module.exports = { notFoundHandler };
