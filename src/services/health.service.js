function getHealthStatus() {
  return {
    ok: true,
    service: "ieop-api-v2",
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealthStatus };
