const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/v1/contributors/:id/report
 * Generates an end-to-end explainability audit sheet for a specific author.
 */
router.get('/:id/report', async (req, res, next) => {
  try {
    const reportQuery = `
      SELECT c.login, r.full_name as repo, cs.contribution_score, cs.authenticity_score, cs.copy_risk_flag, cs.ai_risk_flag, cs.explanation_json
      FROM contributor_scores cs
      JOIN repo_contributors rc ON cs.repo_contributor_id = rc.id
      JOIN repos r ON rc.repo_id = r.id
      JOIN contributors c ON rc.contributor_id = c.id
      WHERE c.id = $1 AND cs.is_superseded = FALSE AND r.tenant_id = $2
    `;
    const result = await pool.query(reportQuery, [req.params.id, req.tenantId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Contributor Profiling Trace Absent' });
    res.json({ contributor_id: req.params.id, profiles: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;