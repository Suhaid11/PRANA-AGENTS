"""
PRANA — Case Intake API Router (Phase 23)
Exposes endpoints for Voice, Text, File Ingestion, Draft Inspection,
Field-Level Editing, and Authoritative Confirmation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.models import UserModel, CaseDraftModel
from app.domain.schemas import (
    UserRoleEnum,
    CaseDraftSchema,
    CaseDraftUpdateRequest,
    CaseDraftConfirmRequest,
    TextIntakeRequest,
    EmergencyCaseDetailSchema,
)
from app.api.deps import get_current_user, require_role
from app.services.case_ingestion_service import CaseIngestionService

router = APIRouter(prefix="/cases/intake", tags=["Case Intake & Ingestion"])


def _build_draft_schema(draft: CaseDraftModel) -> CaseDraftSchema:
    candidate_data = draft.candidate_data
    # Count fields marked as needing review (unconfirmed or ambiguous)
    needs_review = 0
    for k, v in candidate_data.items():
        if isinstance(v, dict):
            prov = v.get("provenance", {})
            if prov.get("status") == "UNCONFIRMED" or prov.get("isAmbiguous"):
                needs_review += 1
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    prov = item.get("provenance", {})
                    if prov.get("status") == "UNCONFIRMED" or prov.get("isAmbiguous"):
                        needs_review += 1

    return CaseDraftSchema(
        draftId=draft.id,
        sourceType=draft.source_type,
        sourceHash=draft.source_hash,
        rawContent=draft.raw_content,
        createdAt=draft.created_at.isoformat(),
        importerId=draft.importer_id,
        importerName=draft.importer_name,
        status=draft.draft_status,
        candidateData=candidate_data,
        needsReviewCount=needs_review,
        confirmedCaseId=draft.confirmed_case_id,
    )


@router.post("/voice", response_model=CaseDraftSchema, status_code=status.HTTP_201_CREATED)
async def intake_voice(
    file: UploadFile = File(...),
    clientTranscript: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Ingest voice emergency report.
    Transcribes audio using SpeechToTextProvider, extracts candidate clinical entities,
    and returns an unconfirmed CaseDraft.
    """
    audio_bytes = await file.read()
    draft = CaseIngestionService.ingest_voice(
        db=db,
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.wav",
        content_type=file.content_type or "audio/wav",
        current_user=current_user,
        client_transcript=clientTranscript,
        language=language or "en"
    )
    return _build_draft_schema(draft)


@router.post("/text", response_model=CaseDraftSchema, status_code=status.HTTP_201_CREATED)
def intake_text(
    payload: TextIntakeRequest,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Ingest raw text/dispatch notes.
    Extracts structured candidate data while preserving prompt injection defense boundaries.
    """
    draft = CaseIngestionService.ingest_text(
        db=db,
        text=payload.text,
        current_user=current_user,
        source_name=payload.source_name or "Field Medic Notes"
    )
    return _build_draft_schema(draft)


@router.post("/file", response_model=CaseDraftSchema, status_code=status.HTTP_201_CREATED)
async def intake_file(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Ingest structured JSON, HL7 FHIR Bundle, CSV, or Text file.
    Validates file MIME and extension, extracts candidate clinical data, and returns CaseDraft.
    """
    file_bytes = await file.read()
    draft = CaseIngestionService.ingest_file(
        db=db,
        file_bytes=file_bytes,
        filename=file.filename or "import.txt",
        content_type=file.content_type or "text/plain",
        current_user=current_user
    )
    return _build_draft_schema(draft)


@router.get("/{draft_id}", response_model=CaseDraftSchema)
def get_draft(
    draft_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific CaseDraft by ID for inspection or review.
    """
    draft = db.query(CaseDraftModel).filter(CaseDraftModel.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case draft '{draft_id}' not found")
    return _build_draft_schema(draft)


@router.patch("/{draft_id}", response_model=CaseDraftSchema)
def update_draft_field(
    draft_id: str,
    payload: CaseDraftUpdateRequest,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Manually override or update a candidate draft field before confirmation.
    Preserves auditability: records extractionMethod='MANUAL_OVERRIDE' and originalValue.
    """
    draft = CaseIngestionService.update_draft_field(
        db=db,
        draft_id=draft_id,
        field_name=payload.field_name,
        new_value=payload.new_value,
        current_user=current_user,
        unit=payload.unit,
        resolve_ambiguity=payload.resolve_ambiguity
    )
    return _build_draft_schema(draft)


@router.post("/{draft_id}/confirm", response_model=EmergencyCaseDetailSchema)
def confirm_draft(
    draft_id: str,
    payload: Optional[CaseDraftConfirmRequest] = None,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Explicit human confirmation gate.
    Converts CaseDraft into authoritative EmergencyCase state, initializes timeline,
    broadcasts real-time CASE_CREATED event, and triggers downstream AI assessment.
    """
    case_snapshot = CaseIngestionService.confirm_draft_to_case(
        db=db,
        draft_id=draft_id,
        current_user=current_user,
        options=payload
    )
    return case_snapshot
