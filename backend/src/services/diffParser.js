/**
 * Utility class to slice up structural tokens out of git streams.
 */
class DiffParser {
  /**
   * Parses raw unified diff payloads into language/file segments.
   * @param {string} rawDiff - Raw text stream from Git/GitHub APIs
   * @returns {Array<Object>} Structurally mapped line changes grouped by target file
   */
  static parseUnifiedDiff(rawDiff) {
    if (!rawDiff) return [];
    const files = [];
    const lines = rawDiff.split('\n');
    let currentFile = null;

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        if (currentFile) files.push(currentFile);
        currentFile = {
          filePath: line.substring(6),
          addedLines: [],
          removedLines: [],
          tokenCount: 0
        };
      } else if (currentFile) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = line.substring(1).trim();
          if (content.length > 0) {
            currentFile.addedLines.push(content);
            currentFile.tokenCount += content.split(/\s+/).length;
          }
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentFile.removedLines.push(line.substring(1).trim());
        }
      }
    }
    if (currentFile) files.push(currentFile);
    return files;
  }
}

module.exports = DiffParser;