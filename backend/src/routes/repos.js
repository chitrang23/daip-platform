const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/**
 * GET /api/v1/repos/:owner/:name/scores
 * Pulls down the active authenticity profiles for all repository contributors.
 */
router.get('/:owner/:name/scores', async (req, res, next) => {
  const targetName = `${req.params.owner}/${req.params.name}`;
  try {
    const scoresQuery = `
      SELECT c.login, cs.contribution_score, cs.authenticity_score, cs.copy_risk_flag, cs.ai_risk_flag, cs.explanation_json
      FROM contributor_scores cs
      JOIN repo_contributors rc ON cs.repo_contributor_id = rc.id
      JOIN repos r ON rc.repo_id = r.id
      JOIN contributors c ON rc.contributor_id = c.id
      WHERE r.full_name = $1 AND cs.is_superseded = FALSE AND r.tenant_id = $2
    `;
    const result = await pool.query(scoresQuery, [targetName, req.tenantId]);
    res.json({ repository: targetName, metrics: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;