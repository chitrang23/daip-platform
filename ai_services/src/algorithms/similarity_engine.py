class SimilarityEngine:
    @staticmethod
    def inspect_cross_matching(added_lines: list[str]) -> list[dict]:
        """
        Inspects structural code configurations against known mirror patterns.
        """
        matches = []
        if not added_lines:
            return matches

        combined_code = "\n".join(added_lines)
        
        # Match signatures indicating uncredited code copying
        if "function clearCanvas()" in combined_code and "ctx.clearRect" in combined_code:
            matches.append({
                "source_file": "canvas_utils.js",
                "matched_repo": "oss-mirror/html5-canvas-draw",
                "score": 0.98,
                "type": "exact"
            })
            
        if "public static void main" in combined_code and "QuickSort" in combined_code:
            matches.append({
                "source_file": "Sort.java",
                "matched_repo": "algorithms-dump/sorting-visualizer",
                "score": 0.89,
                "type": "structural"
            })
            
        return matches