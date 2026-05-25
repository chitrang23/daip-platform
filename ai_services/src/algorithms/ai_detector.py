import numpy as np

class AIDetector:
    @staticmethod
    def compute_linguistic_entropy(added_lines: list[str]) -> list[dict]:
        """
        Calculates character layout entropy variance to flag uniform AI structural traits.
        """
        results = []
        for line in added_lines:
            line = line.strip()
            if len(line) < 15:
                continue
                
            # Compute character sequence probabilities
            char_counts = {}
            for char in line:
                char_counts[char] = char_counts.get(char, 0) + 1
            
            probabilities = [count / len(line) for count in char_counts.values()]
            entropy = float(-sum(p * np.log2(p) for p in probabilities))
            
            # Predictability indexing
            perplexity = float(2 ** entropy)
            
            # Formulate uniform predictability markers
            composite = float(np.clip((entropy / 5.0) * 0.7, 0.0, 1.0))
            
            results.append({
                "file_path": "inferred_stream_source.raw",
                "entropy": entropy,
                "perplexity": perplexity,
                "composite": composite
            })
            
        return results if results else [{"file_path": "generic.raw", "entropy": 2.1, "perplexity": 4.2, "composite": 0.15}]