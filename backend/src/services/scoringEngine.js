const { pool } = require('../config/database');

/**
 * Aggregates multi-dimensional feature variables into normalized trust bands.
 */
class ScoringEngineService {
  /**
   * Consolidates atomic commit indices, running evaluation equations per developer.
   * @param {string} repoId - Local reference identifier keys
   */
  static async consolidateScores(repoId) {
    const contributorsRes = await pool.query(
      `SELECT rc.id as repo_contributor_id, rc.contributor_id, c.id as commit_id
       FROM repo_contributors rc
       JOIN commits c ON c.repo_id = rc.repo_id AND c.contributor_id = rc.contributor_id
       WHERE rc.repo_id = $1`,
      [repoId]
    );

    for (const row of contributorsRes.rows) {
      const signalsRes = await pool.query(
        `SELECT cs.*, ad.composite_ai_score, sr.similarity_score
         FROM commit_signals cs
         LEFT JOIN ai_detection_results ad ON ad.commit_id = cs.commit_id
         LEFT JOIN similarity_results sr ON sr.commit_id = cs.commit_id
         WHERE cs.commit_id = $1`,
        [row.commit_id]
      );

      let totalCommits = signalsRes.rowCount;
      if (totalCommits === 0) continue;

      let aggregateBurst = 0, aggregateCoherence = 0, aggregateAI = 0, aggregateCopy = 0;
      signalsRes.rows.forEach(sig => {
        aggregateBurst += sig.burst_score;
        aggregateCoherence += sig.evolution_coherence;
        aggregateAI += sig.composite_ai_score || 0;
        aggregateCopy += sig.similarity_score || 0;
      });

      const avgBurst = aggregateBurst / totalCommits;
      const avgCoherence = aggregateCoherence / totalCommits;
      const avgAI = aggregateAI / totalCommits;
      const avgCopy = aggregateCopy / totalCommits;

      // Deterministic Scoring Normalization Equations
      const contributionScore = Math.min(100, Math.max(0, (avgCoherence * 60) + ((1 - avgBurst) * 40)));
      const authenticityScore = Math.min(100, Math.max(0, 100 - (avgAI * 50) - (avgCopy * 50)));

      const aiRisk = avgAI > 0.6 ? 'high' : avgAI > 0.35 ? 'medium' : 'low';
      const copyRisk = avgCopy > 0.7 ? 'high' : avgCopy > 0.4 ? 'medium' : 'none';
      const effortRisk = avgCoherence < 0.3 ? 'high' : 'none';

      // Mark stale rows to maintain historical lineage audit trails without duplicate processing conflicts
      await pool.query(
        `UPDATE contributor_scores SET is_superseded = TRUE WHERE repo_contributor_id = $1`,
        [row.repo_contributor_id]
      );

      await pool.query(
        `INSERT INTO contributor_scores (
          repo_contributor_id, contribution_score, authenticity_score,
          copy_risk_flag, ai_risk_flag, low_effort_risk_flag, score_version, explanation_json
         ) VALUES ($1, $2, $3, $4, $5, $6, '2.0.0', $7)`,
        [
          row.repo_contributor_id, contributionScore, authenticityScore,
          copyRisk, aiRisk, effortRisk,
          JSON.stringify({
            metrics: { avgBurst, avgCoherence, avgAI, avgCopy },
            rationale: "Automated verification utilizing localized token structures and linguistic heuristics."
          })
        ]
      );
    }
  }
}

module.exports = ScoringEngineService;