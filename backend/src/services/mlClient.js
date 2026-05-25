const axios = require('axios');

/**
 * Interface layer to securely pipe features over to Python ML inference nodes.
 */
class MLClient {
  /**
   * Dispatches unified payload slices for structural text checking and anomaly sweeps.
   * @param {Object} payload - Quantized code signatures and metadata mappings
   * @returns {Promise<Object>} Synthesized machine learning signal matrices
   */
  static async requestInferenceAnalysis(payload) {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/api/v1/analyze';
    try {
      const response = await axios.post(mlUrl, payload, { timeout: 30000 });
      return response.data;
    } catch (err) {
      throw new Error(`ML Engine Connection Aborted: ${err.message}`);
    }
  }
}

module.exports = MLClient;