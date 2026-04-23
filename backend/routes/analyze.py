import uuid

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, get_session
from models import Analysis
from services.openai_service import OpenAIService

router = APIRouter(tags=["analyze"])


class AnalyzeRequest(BaseModel):
    log_text: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    analysis_id: uuid.UUID


@router.post("/api/analyze", response_model=AnalyzeResponse)
async def create_analysis(payload: AnalyzeRequest, session: AsyncSession = Depends(get_session)) -> AnalyzeResponse:
    analysis = Analysis(log_text=payload.log_text, severity="info")
    session.add(analysis)
    await session.commit()
    await session.refresh(analysis)
    return AnalyzeResponse(analysis_id=analysis.id)


@router.websocket("/ws/analyze/{analysis_id}")
async def stream_analysis(websocket: WebSocket, analysis_id: uuid.UUID) -> None:
    await websocket.accept()
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Analysis).where(Analysis.id == analysis_id))
            analysis = result.scalar_one_or_none()
            if analysis is None:
                await websocket.send_json({"type": "error", "message": "Analysis not found"})
                await websocket.close(code=1008)
                return

            service = OpenAIService()
            full_response = ""

            try:
                async for token in service.stream_log_analysis(analysis.log_text):
                    full_response += token
                    await websocket.send_json({"type": "token", "content": token})
            except Exception as exc:
                await websocket.send_json({"type": "error", "message": f"AI streaming failed: {str(exc)}"})
                await websocket.close(code=1011)
                return

            parsed = service.parse_structured_response(full_response)
            analysis.root_cause = parsed["root_cause"]
            analysis.error_chain = parsed["error_chain"]
            analysis.affected_services = parsed["affected_services"]
            analysis.severity = parsed["severity"]
            analysis.suggested_fix = parsed["suggested_fix"]
            analysis.raw_response = full_response
            await session.commit()

            await websocket.send_json(
                {
                    "type": "complete",
                    "analysis": {
                        "id": str(analysis.id),
                        "root_cause": analysis.root_cause,
                        "error_chain": analysis.error_chain,
                        "affected_services": analysis.affected_services,
                        "severity": analysis.severity,
                        "suggested_fix": analysis.suggested_fix,
                        "raw_response": analysis.raw_response,
                    },
                }
            )
            await websocket.close(code=1000)
            return
    except WebSocketDisconnect:
        return
    except HTTPException as exc:
        await websocket.send_json({"type": "error", "message": exc.detail})
        await websocket.close(code=1008)
