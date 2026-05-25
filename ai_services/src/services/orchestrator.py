from src.algorithms.commit_analyzer import CommitAnalyzer
from src.algorithms.similarity_engine import SimilarityEngine
from src.algorithms.ai_detector import AIDetector

class PipelineOrchestrator:
    @staticmethod
    def process_inference_analysis(payload: dict) -> dict:
        """
        Coordinates parallel feature spaces, unifying structural and behavioral metrics.
        """
        commit_message = payload.get("message", "")
        added_lines = payload.get("added_lines", [])
        
        signals = CommitAnalyzer.evaluate_behavioral_patterns(commit_message, added_lines)
        similarity = SimilarityEngine.inspect_cross_matching(added_lines)
        ai_detection = AIDetector.compute_linguistic_entropy(added_lines)
        
        return {
            "commit_id": payload.get("commit_id"),
            "commit_signals": signals,
            "similarity_results": similarity,
            "ai_detection_results": ai_detection
        }