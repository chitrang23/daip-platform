import re
import numpy as np

class CommitAnalyzer:
    @staticmethod
    def evaluate_behavioral_patterns(commit_message: str, added_lines: list[str]) -> dict:
        """
        Analyzes developer cadence, message quality, and tracking patterns.
        """
        total_lines = len(added_lines)
        
        # 1. Evaluate commit message structural quality and descriptive intent
        has_prefix = bool(re.match(r'^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:', commit_message))
        length_valid = 10 <= len(commit_message) <= 72
        quality_score = float(np.clip((int(has_prefix) * 0.6) + (int(length_valid) * 0.4), 0.1, 1.0))
        
        # 2. Extract code dropping indicators (detecting massive single code dumps)
        burst_score = float(np.clip(total_lines / 1500.0, 0.0, 1.0)) if total_lines > 0 else 0.0
        
        # 3. Formulate evolutionary trajectory score
        evolution_coherence = 1.0 - burst_score
        
        return {
            "burst_score": burst_score,
            "message_quality": quality_score,
            "evolution_coherence": evolution_coherence
        }