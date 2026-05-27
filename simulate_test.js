const axios = require('axios');
require('dotenv').config();

// Define execution tracking scope
const targetUser = "chitrang23";                     
const gitPass = process.env.GITHUB_TOKEN; 

async function runLifetimeContributionAudit() {
  console.log(`\n🚀 Starting Total Lifetime Contribution Audit for User: [${targetUser}]`);
  console.log("📡 Aggregating full collaborative histories across environments...");
  console.log("-------------------------------------------------------------------\n");
  
  try {
    // Base configuration headers to maintain a stable handshake with the REST gateway
    const apiConfig = { 
      headers: {
        'Authorization': `Bearer ${gitPass}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DAIP-Lifetime-Agent'
      }
    };
    
    // Step 1: Map all associated repositories (owned, shared, and org-affiliated)
    const discoveryEndpoint = `https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member&sort=updated`;
    const discoveryResponse = await axios.get(discoveryEndpoint, apiConfig);
    const scannedItems = discoveryResponse.data;
    
    console.log(`✅ Indexed ${scannedItems.length} spaces. Calculating total contributions...\n`);

    for (let idx = 0; idx < scannedItems.length; idx++) {
      const repoItem = scannedItems[idx];
      const repoName = repoItem.name;
      const creatorLogin = repoItem.owner.login;
      const unifiedPath = `${creatorLogin}/${repoName}`;

      try {
        // Step 2: Query historical commits targeted explicitly to our author token
        const commitHistoryPath = `https://api.github.com/repos/${creatorLogin}/${repoName}/commits?author=${targetUser}&per_page=50`;
        const historyResponse = await axios.get(commitHistoryPath, apiConfig);
        const logHistory = historyResponse.data || [];

        // Catch inactive project stubs instantly
        if (logHistory.length === 0) {
          console.log(`┌────────────────────────────────────────────────────────┐`);
          console.log(`│ 🔍  DAIP LIFETIME CONTRIBUTION METRICS  [${String(idx + 1).padStart(2, '0')}/${String(scannedItems.length).padStart(2, '0')}]     │`);
          console.log(`├────────────────────────────────────────────────────────┤`);
          console.log(`│ 📌 Scope Path:   ${unifiedPath.toUpperCase().padEnd(37)} │`);
          console.log(`│ ℹ️  Contributions: 0 commits found (Inactive Collaborator) │`);
          console.log(`└────────────────────────────────────────────────────────┘\n`);
          continue;
        }

        let deltaCodeBuffer = [];
        let trackedCommitMessages = [];

        // Step 3: Dig into each individual save point to pull patch deltas
        for (const singleCommit of logHistory) {
          const detailEndpoint = `https://api.github.com/repos/${creatorLogin}/${repoName}/commits/${singleCommit.sha}`;
          const detailedFetch = await axios.get(detailEndpoint, apiConfig);
          
          if (detailedFetch.data.commit?.message) {
            trackedCommitMessages.push(detailedFetch.data.commit.message.split('\n')[0]);
          }

          const modifiedFiles = detailedFetch.data.files || [];
          for (const diffFile of modifiedFiles) {
            if (diffFile.patch) {
              const brokenPatchLines = diffFile.patch.split('\n');
              
              for (const codeRow of brokenPatchLines) {
                // Ensure we only collect additions, ignoring meta tracking boundaries
                if (codeRow.startsWith('+') && !codeRow.startsWith('+++')) {
                  deltaCodeBuffer.push(codeRow.substring(1).trim());
                }
              }
            }
          }
        }

        // Operational backup buffer in case the history consists purely of file updates or deletes
        if (deltaCodeBuffer.length === 0) {
          deltaCodeBuffer = ["// Structural alignment tracking sync"];
        }

        // Step 4: Bundle the full history and stream to our analytical microservice
        const mlPayloadFrame = {
          commit_id: logHistory[0].sha.substring(0, 10),
          message: `Aggregated audit of ${logHistory.length} contributions`,
          added_lines: deltaCodeBuffer.slice(0, 50) 
        };

        const postToAnalytics = await axios.post('http://localhost:8000/api/v1/analyze', mlPayloadFrame);
        const payloadMetrics = postToAnalytics.data;

        const evaluatedAIRisk = payloadMetrics.ai_detection_results[0]?.composite || 0.15;
        const mappedPlagScore = payloadMetrics.similarity_results[0]?.score || 0.0;
        
        // Final authenticity grade standardization calculation
        const compiledGrade = Math.min(100, Math.max(0, 100 - (evaluatedAIRisk * 100) - (mappedPlagScore * 100)));

        // Output formatting visualization engine
        console.log(`┌────────────────────────────────────────────────────────┐`);
        console.log(`│ 🔍  DAIP LIFETIME CONTRIBUTION METRICS  [${String(idx + 1).padStart(2, '0')}/${String(scannedItems.length).padStart(2, '0')}]     │`);
        console.log(`├────────────────────────────────────────────────────────┤`);
        console.log(`│ 📌 Scope Path:   ${unifiedPath.toUpperCase().padEnd(37)} │`);
        console.log(`│ 📊 Total Volume: ${String(logHistory.length).padStart(2, '0')} Commits | ${String(deltaCodeBuffer.length).padStart(4, '0')} Custom Lines Added │`);
        console.log(`├────────────────────────────────────────────────────────┤`);
        console.log(`│ 🛡️  Rolling Authenticity Score: [ ${compiledGrade.toFixed(1).padStart(5, ' ')} / 100 ]     │`);
        console.log(`│                                                        │`);
        console.log(`│ 🤖 Overall AI Risk:    ${(evaluatedAIRisk * 100).toFixed(1).padStart(5, ' ')}% match -> ${evaluatedAIRisk > 0.5 ? '🚨 HIGH RISK ' : '✅ LOW RISK  '} │`);
        console.log(`│ 📝 Plagiarism Status:                 -> ${mappedPlagScore > 0.5 ? '🚨 FLAGGED   ' : '✅ CLEAN     '} │`);
        console.log(`└────────────────────────────────────────────────────────┘\n`);

      } catch (innerRepoException) {
        const structuralAlert = innerRepoException.response ? `Status ${innerRepoException.response.status}` : innerRepoException.message;
        
        console.log(`┌────────────────────────────────────────────────────────┐`);
        console.log(`│ ⚠️  DAIP AUDIT PIPELINE ERROR            [${String(idx + 1).padStart(2, '0')}/${String(scannedItems.length).padStart(2, '0')}]     │`);
        console.log(`├────────────────────────────────────────────────────────┤`);
        console.log(`│ 📌 Scope Path:   ${unifiedPath.toUpperCase().padEnd(37)} │`);
        console.log(`│ ❌ System Alert:  ${structuralAlert.padEnd(36)} │`);
        console.log(`└────────────────────────────────────────────────────────┘\n`);
      }
    }

    console.log("=======================================================");
    console.log("🎉 SUCCESS: LIFETIME AGGREGATE PROFILE COMPLETE!");
    console.log("=======================================================");

  } catch (globalFaultException) {
    console.error("❌ Fatal Tracking Interruption:", globalFaultException.message);
  }
}

runLifetimeContributionAudit();