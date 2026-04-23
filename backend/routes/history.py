import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models import Analysis

router = APIRouter(prefix="/api/history", tags=["history"])


class HistoryItem(BaseModel):
    id: uuid.UUID
    timestamp: datetime
    summary: str
    severity: str


class HistoryDetail(BaseModel):
    id: uuid.UUID
    log_text: str
    root_cause: str | None = None
    error_chain: str | None = None
    affected_services: str | None = None
    severity: str
    suggested_fix: str | None = None
    raw_response: str | None = None
    created_at: datetime


@router.get("", response_model=list[HistoryItem])
async def list_history(session: AsyncSession = Depends(get_session)) -> list[HistoryItem]:
    query = select(Analysis).order_by(desc(Analysis.created_at))
    result = await session.execute(query)
    analyses = result.scalars().all()

    return [
        HistoryItem(
            id=a.id,
            timestamp=a.created_at,
            summary=(a.root_cause or "Analysis pending...")[:160],
            severity=a.severity or "info",
        )
        for a in analyses
    ]


@router.get("/{analysis_id}", response_model=HistoryDetail)
async def get_history_detail(analysis_id: uuid.UUID, session: AsyncSession = Depends(get_session)) -> HistoryDetail:
    query = select(Analysis).where(Analysis.id == analysis_id)
    result = await session.execute(query)
    analysis = result.scalar_one_or_none()

    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return HistoryDetail(
        id=analysis.id,
        log_text=analysis.log_text,
        root_cause=analysis.root_cause,
        error_chain=analysis.error_chain,
        affected_services=analysis.affected_services,
        severity=analysis.severity,
        suggested_fix=analysis.suggested_fix,
        raw_response=analysis.raw_response,
        created_at=analysis.created_at,
    )
