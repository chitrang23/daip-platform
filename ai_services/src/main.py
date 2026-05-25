import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from src.services.orchestrator import PipelineOrchestrator

app = FastAPI(title="DAIP Compute Cluster Endpoint Layer")

class AnalysisRequestPayload(BaseModel):
    commit_id: str
    message: str
    added_lines: list[str]

@app.post("/api/v1/analyze")
def handle_analysis_request(payload: AnalysisRequestPayload):
    """
    HTTP route receiving structural changes for analysis.
    """
    try:
        results = PipelineOrchestrator.process_inference_analysis(payload.model_dump())
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Analysis Compute Error: {str(e)}")
if __name__ == "__main__":
    # Point uvicorn to the absolute module path: src.main
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=False)

