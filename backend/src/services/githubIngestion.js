const crypto = require('crypto');
const { pool } = require('../config/database');
const { getGitHubClient } = require('../config/github');
const DiffParser = require('./diffParser');

/**
 * Orchestrates remote connection layers, downloading history streams securely.
 */
class GitHubIngestionService {
  /**
   * Pulls structural changes down to local schemas, tracking timelines natively.
   * @param {string} repoUrl - Absolute remote layout address
   * @param {string} tenantId - Context boundary tag
   */
  static async ingestRepository(repoUrl, tenantId) {
    const regex = /github\.com\/([^/]+)\/([^/.]+)/;
    const match = repoUrl.match(regex);
    if (!match) throw new Error('Invalid GitHub Repository URL Format');

    const [_, owner, repoName] = match;
    const octokit = getGitHubClient();

    // 1. Resolve Remote Core Repository Data
    const { data: remoteRepo } = await octokit.repos.get({ owner, repo: repoName });

    const dbRepoRes = await pool.query(
      `INSERT INTO repos (github_repo_id, owner_login, name, full_name, primary_language, created_at, last_pushed_at, scan_status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing', $8)
       ON CONFLICT (github_repo_id) DO UPDATE SET last_pushed_at = $7, scan_status = 'processing'
       RETURNING *`,
      [remoteRepo.id, remoteRepo.owner.login, remoteRepo.name, remoteRepo.full_name, remoteRepo.language, remoteRepo.created_at, remoteRepo.pushed_at, tenantId]
    );
    const repoRecord = dbRepoRes.rows[0];

    // 2. Extract Direct Contributor and Commit Chronologies (pulling a clean sampling frame)
    const { data: commitList } = await octokit.repos.listCommits({ owner, repo: repoName, per_page: 30 });

    for (const commitMeta of commitList) {
      if (!commitMeta.author) continue;

      const emailHash = crypto.createHash('sha256').update(commitMeta.commit.author.email || '').digest('hex');
      
      const userRes = await pool.query(
        `INSERT INTO contributors (github_user_id, login, email_hash, account_age_days)
         VALUES ($1, $2, $3, 365) ON CONFLICT (github_user_id) DO UPDATE SET login = $2 RETURNING *`,
        [commitMeta.author.id, commitMeta.author.login, emailHash]
      );
      const contributor = userRes.rows[0];

      await pool.query(
        `INSERT INTO repo_contributors (repo_id, contributor_id, total_commits)
         VALUES ($1, $2, 1) ON CONFLICT (repo_id, contributor_id) DO UPDATE SET total_commits = repo_contributors.total_commits + 1`,
        [repoRecord.id, contributor.id]
      );

      // Fetch unified commit diff through direct formats to bypass major parsing blocks
      let parsedDiffs = [];
      try {
        const { data: rawDiff } = await octokit.repos.getCommit({
          owner,
          repo: repoName,
          ref: commitMeta.sha,
          mediaType: { format: 'diff' }
        });
        parsedDiffs = DiffParser.parseUnifiedDiff(rawDiff);
      } catch (diffErr) {
        // Fallback catch block for anomalous unreadable commits
      }

      let totalAdded = 0;
      let totalRemoved = 0;
      parsedDiffs.forEach(f => {
        totalAdded += f.addedLines.length;
        totalRemoved += f.removedLines.length;
      });

      const commitRes = await pool.query(
        `INSERT INTO commits (sha, repo_id, contributor_id, authored_at, committed_at, message, files_changed, lines_added, lines_removed, timezone_offset)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0) ON CONFLICT (sha) DO NOTHING RETURNING id`,
        [commitMeta.sha, repoRecord.id, contributor.id, commitMeta.commit.author.date, commitMeta.commit.committer.date, commitMeta.commit.message, parsedDiffs.length, totalAdded, totalRemoved]
      );

      // Mutate historical data object inline safely to seed deep workers downstream
      commitMeta.extractedDiffs = parsedDiffs;
      commitMeta.dbCommitId = commitRes.rows[0]?.id;
    }

    return { repoRecord, commitList };
  }
}

module.exports = GitHubIngestionService;