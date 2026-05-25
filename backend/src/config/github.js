const { Octokit } = require('@octokit/rest');

/**
 * Instantiates an authenticated GitHub API client wrapper.
 * Generates an automated connection layer using short-lived tokens or application presets.
 * @param {string} [token] - Optional user OAuth or short-lived application token
 */
function getGitHubClient(token) {
  return new Octokit({
    auth: token || process.env.GITHUB_APP_TOKEN,
    request: {
      timeout: 10000 // Prevents blocking the pipeline on stalled network queries
    }
  });
}

module.exports = { getGitHubClient };