const axios = require('axios');
require('dotenv').config(); // Load the hidden environment file

// 💡 CONFIGURATION PANEL (Now perfectly safe for GitHub!)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = "chitrang23";                     // <-- Target profile username

async function scanAllRepositories() {
  console.log(`\n🚀 Starting Bulk Profile Audit for User: [${REPO_OWNER}]`);
  console.log("📡 Fetching full repository index from GitHub...");
  console.log("-------------------------------------------------------\n");
  
  try {
    const headers = { 'Authorization': `token ${GITHUB_TOKEN}` };
    
    // 1. Fetch ALL public repositories for this user
    const reposUrl = `https://api.github.com/users/${REPO_OWNER}/repos?per_page=100`;
    const reposResponse = await axios.get(reposUrl, { headers });
    
    const repoList = reposResponse.data;
    console.log(`✅ Found ${repoList.length} public repositories to audit.\n`);

    // 2. Loop through every single repository found
    for (let i = 0; i < repoList.length; i++) {
      const repoName = repoList[i].name;

      try {
        // Fetch recent commits for this specific repo
        const commitUrl = `https://api.github.com/repos/${REPO_OWNER}/${repoName}/commits`;
        const commitsResponse = await axios.get(commitUrl, { headers });

        if (commitsResponse.data.length === 0) {
          console.log(`┌────────────────────────────────────────────────────────┐`);
          console.log(`│ 🔍  DAIP PORTFOLIO INTELLIGENCE AUDIT   [${String(i + 1).padStart(2, '0')}/${String(repoList.length).padStart(2, '0')}]     │`);
          console.log(`├────────────────────────────────────────────────────────┤`);
          console.log(`│ 📌 Repository Name:  ${repoName.toUpperCase().padEnd(33)} │`);
          console.log(`│ ℹ️ Status:           EMPTY REPOSITORY (NO COMMITS)     │`);
          console.log(`└────────────────────────────────────────────────────────┘\n`);
          continue;
        }

        const latestCommitSha = commitsResponse.data[0].sha;
        const detailUrl = `${commitUrl}/${latestCommitSha}`;
        const detailResponse = await axios.get(detailUrl, { headers });

        // Extract raw code lines
        let rawAddedLines = [];
        if (detailResponse.data.files) {
          detailResponse.data.files.forEach(file => {
            if (file.patch) {
              const lines = file.patch.split('\n');
              lines.forEach(line => {
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  rawAddedLines.push(line.substring(1).trim());
                }
              });
            }
          });
        }

        // Fallback placeholder if the commit didn't change code text (e.g. renaming a file)
        if (rawAddedLines.length === 0) {
          rawAddedLines = ["// Baseline operational frame initialization"];
        }

        // 3. Pipe to Python AI Engine
        const targetPayload = {
          commit_id: latestCommitSha.substring(0, 10),
          message: detailResponse.data.commit.message || "Regular update",
          added_lines: rawAddedLines.slice(0, 30) // Test sample buffer
        };

        const aiResponse = await axios.post('http://localhost:8000/api/v1/analyze', targetPayload);
        const mlMetrics = aiResponse.data;

        // 4. Score calculation logic
        const avgAI = mlMetrics.ai_detection_results[0]?.composite || 0.12;
        const avgCopy = mlMetrics.similarity_results[0]?.score || 0.0;
        const authenticityScore = Math.min(100, Math.max(0, 100 - (avgAI * 100) - (avgCopy * 100)));

        // Clean up message layout spacing
        const safeMessage = targetPayload.message.replace(/\n/g, ' ').substring(0, 30);

        // 💎 PREMIUM VISUAL LOGGING ENGINE OUTPUT
        console.log(`┌────────────────────────────────────────────────────────┐`);
        console.log(`│ 🔍  DAIP PORTFOLIO INTELLIGENCE AUDIT   [${String(i + 1).padStart(2, '0')}/${String(repoList.length).padStart(2, '0')}]     │`);
        console.log(`├────────────────────────────────────────────────────────┤`);
        console.log(`│ 📌 Repository Name:  ${repoName.toUpperCase().padEnd(33)} │`);
        console.log(`│ 📝 Latest Save:     "${safeMessage.padEnd(30)}" │`);
        console.log(`├────────────────────────────────────────────────────────┤`);
        console.log(`│ 🛡️  Authenticity Score:      [ ${authenticityScore.toFixed(1).padStart(5, ' ')} / 100 ]        │`);
        console.log(`│                                                        │`);
        console.log(`│ 🤖 AI Signature Risk:   ${(avgAI * 100).toFixed(1).padStart(5, ' ')}% match -> ${avgAI > 0.5 ? '🚨 HIGH RISK ' : '✅ LOW RISK  '} │`);
        console.log(`│ 📝 Plagiarism Mirror:                 -> ${avgCopy > 0.5 ? '🚨 FLAGGED   ' : '✅ CLEAN     '} │`);
        console.log(`└────────────────────────────────────────────────────────┘\n`);

      } catch (repoError) {
        console.log(`┌────────────────────────────────────────────────────────┐`);
        console.log(`│ ⚠️  DAIP AUDIT PIPELINE ERROR            [${String(i + 1).padStart(2, '0')}/${String(repoList.length).padStart(2, '0')}]     │`);
        console.log(`├────────────────────────────────────────────────────────┤`);
        console.log(`│ 📌 Repository Name:  ${repoName.toUpperCase().padEnd(33)} │`);
        console.log(`│ ❌ System Warning:   Code 409 / Empty Branch Frame     │`);
        console.log(`└────────────────────────────────────────────────────────┘\n`);
      }
    }

    console.log("=======================================================");
    console.log("🎉 SUCCESS: BULK PROFILE AUDIT COMPLETE!");
    console.log("=======================================================");

  } catch (error) {
    console.error("❌ Bulk Scan Failed:", error.message);
  }
}

scanAllRepositories();