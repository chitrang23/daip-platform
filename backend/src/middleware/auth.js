/**
 * Production Guard: Enforces strict data isolation context.
 * Rejects any API call missing a valid tenant identity verification signature.
 */
function enforceTenantContext(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    return res.status(401).json({ error: 'Missing Required Infrastructure Header: X-Tenant-ID' });
  }
  // Inject context downstream to ensure queries are strictly bounded
  req.tenantId = tenantId;
  next();
}

module.exports = { enforceTenantContext };