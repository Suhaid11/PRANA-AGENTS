import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.models import UserModel, HandoverPackageModel
from app.domain.schemas import (
    PrehospitalHandoverPackageSchema,
    HandoverAcknowledgeRequest,
    HandoverVerifyResponse,
    HandoverSummarySchema,
    EmergencyCaseDetailSchema,
    UserRoleEnum
)
from app.services.case_service import get_case_or_404, build_case_snapshot
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait
from app.services.handover_service import (
    generate_and_persist_handover,
    acknowledge_handover_package,
    verify_handover_package_integrity,
    export_handover_fhir_r4
)
from app.api.deps import get_current_user, check_case_access, require_role

router = APIRouter(prefix="/cases/{case_id}/handover", tags=["Prehospital Handover"])


@router.post("/generate", response_model=PrehospitalHandoverPackageSchema)
def generate_handover(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an authoritative, immutable prehospital handover snapshot for the emergency case.
    Derives all patient, transit, telemetry, observation, intervention, and clinical review data.
    Computes a canonical SHA-256 integrity digest, logs an audit event, and broadcasts over WebSocket.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    package_model = generate_and_persist_handover(db, case, current_user)
    return package_model.package_data


@router.get("", response_model=PrehospitalHandoverPackageSchema)
def get_latest_handover(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the most recent prehospital handover package for this case.
    If no package has been generated yet, automatically generates an initial draft snapshot.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    latest_package = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.case_id == case.id
    ).order_by(HandoverPackageModel.created_at.desc()).first()

    if not latest_package:
        # Generate initial handover package
        latest_package = generate_and_persist_handover(db, case, current_user)

    return latest_package.package_data


@router.get("/list", response_model=list[HandoverSummarySchema])
def list_handover_versions(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all historical immutable handover package versions for audit comparison.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    packages = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.case_id == case.id
    ).order_by(HandoverPackageModel.case_version.desc()).all()

    return [
        HandoverSummarySchema(
            packageId=p.id,
            caseId=p.case_id,
            caseVersion=p.case_version,
            status=p.status,
            generatedAt=p.created_at.isoformat(),
            generatedByName=p.generated_by_name,
            completenessStatus=p.completeness_status,
            integrityHash=p.integrity_hash
        )
        for p in packages
    ]


@router.get("/{package_id}", response_model=PrehospitalHandoverPackageSchema)
def get_handover_by_id(
    case_id: str,
    package_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific version of a prehospital handover package by ID.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    package = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.id == package_id,
        HandoverPackageModel.case_id == case.id
    ).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover package '{package_id}' not found for case '{case_id}'"
        )

    return package.package_data


@router.post("/{package_id}/acknowledge", response_model=PrehospitalHandoverPackageSchema)
def acknowledge_handover(
    case_id: str,
    package_id: str,
    ack_req: HandoverAcknowledgeRequest,
    current_user: UserModel = Depends(require_role(UserRoleEnum.HOSPITAL_COMMAND.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Receiving Emergency Department confirms receipt and review of the prehospital handover.
    Restricted to HOSPITAL_COMMAND or PORTAL_ADMIN role.
    Appends an immutable HANDOVER_ACKNOWLEDGED event to the Care Rail and broadcasts.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    package = acknowledge_handover_package(db, case, package_id, current_user, ack_req.notes)
    return package.package_data


@router.get("/{package_id}/verify", response_model=HandoverVerifyResponse)
def verify_handover_integrity(
    case_id: str,
    package_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Independent cryptographic integrity verification endpoint.
    Recalculates the SHA-256 hash of the stored canonical package payload
    and compares it directly against the stored provenance digest.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    package = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.id == package_id,
        HandoverPackageModel.case_id == case.id
    ).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover package '{package_id}' not found for case '{case_id}'"
        )

    return verify_handover_package_integrity(package)


@router.get("/{package_id}/export")
def export_handover(
    case_id: str,
    package_id: str,
    format: str = Query(default="json", pattern="^(json|fhir)$"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export the Prehospital Handover Package as structured, machine-readable JSON or FHIR R4 Bundle.
    Enforces case authorization and sets appropriate Content-Disposition headers.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    package = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.id == package_id,
        HandoverPackageModel.case_id == case.id
    ).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover package '{package_id}' not found for case '{case_id}'"
        )

    pkg_data = package.package_data

    if format == "fhir":
        fhir_bundle = export_handover_fhir_r4(pkg_data)
        filename = f"PRANA_Handover_{case_id}_{package_id}_FHIR_R4.json"
        content_str = json.dumps(fhir_bundle, indent=2)
        return Response(
            content=content_str,
            media_type="application/fhir+json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        filename = f"PRANA_Handover_{case_id}_{package_id}.json"
        content_str = json.dumps(pkg_data, indent=2)
        return Response(
            content=content_str,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )


class PatientHandoverInitiateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    notes: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/initiate", response_model=EmergencyCaseDetailSchema)
def initiate_patient_handover(
    case_id: str,
    handover_req: Optional[PatientHandoverInitiateRequest] = None,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Field Paramedic initiates formal transfer-of-care patient handover at receiving facility.
    Advances conduit step to 7 (HANDOVER), appends audit event, and broadcasts PATIENT_HANDOVER_INITIATED.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    now_ts = (handover_req.timestamp if handover_req and handover_req.timestamp else None) or datetime.now(timezone.utc).strftime("%H:%M:%S")
    notes = handover_req.notes if handover_req else None

    case.conduit_step = max(case.conduit_step, 7)

    detail_str = f"Paramedic ({current_user.display_name}) initiated formal transfer of care to receiving emergency team."
    if notes:
        detail_str += f" Notes: {notes}"

    evt = append_event(
        db,
        case_id=case.id,
        title="Prehospital Handover Initiated",
        detail=detail_str,
        actor=current_user.display_name,
        category="CLINICAL",
        status="INFO",
        timestamp=now_ts,
        payload={"initiatedBy": current_user.display_name, "notes": notes, "conduitStep": 7}
    )

    db.commit()

    dispatch_event_nowait(
        case_id=case.id,
        event_type="PATIENT_HANDOVER_INITIATED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="FIELD_MEDIC",
        actor_id=current_user.id,
        user_id=current_user.id,
        role=current_user.role,
        payload={
            "initiatedBy": current_user.display_name,
            "notes": notes,
            "conduitStep": 7
        }
    )

    return build_case_snapshot(case)


class PatientHandoverAcceptRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    notes: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/accept", response_model=EmergencyCaseDetailSchema)
def accept_patient_handover(
    case_id: str,
    accept_req: Optional[PatientHandoverAcceptRequest] = None,
    current_user: UserModel = Depends(require_role(UserRoleEnum.HOSPITAL_COMMAND.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Receiving Emergency Department accepts formal clinical transfer of care.
    Concludes the prehospital transit episode, transitions case status to TRANSFER_COMPLETED,
    advances conduit step to 8 (COMPLETED), appends audit events, and broadcasts TRANSFER_COMPLETED.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    now_ts = (accept_req.timestamp if accept_req and accept_req.timestamp else None) or datetime.now(timezone.utc).strftime("%H:%M:%S")
    notes = accept_req.notes if accept_req else None
    hospital_name = case.ambulance.assigned_hospital if case.ambulance else "Receiving Emergency Department"

    case.status = "TRANSFER_COMPLETED"
    case.conduit_step = max(case.conduit_step, 8)

    evt1 = append_event(
        db,
        case_id=case.id,
        title="Prehospital Transfer of Care Accepted",
        detail=f"Receiving Emergency Department ({current_user.display_name}) accepted full patient care handover.",
        actor=current_user.display_name,
        category="CLINICAL",
        status="SUCCESS",
        timestamp=now_ts,
        payload={"acceptedBy": current_user.display_name, "notes": notes, "conduitStep": 8}
    )

    evt2 = append_event(
        db,
        case_id=case.id,
        title="Transfer of Care Completed",
        detail=f"Prehospital transport mission closed. Patient care successfully transitioned to {hospital_name}.",
        actor="RECEIVING ED",
        category="SYSTEM",
        status="SUCCESS",
        timestamp=now_ts,
        payload={"facility": hospital_name, "completedAt": now_ts, "status": "TRANSFER_COMPLETED", "conduitStep": 8}
    )

    db.commit()

    dispatch_event_nowait(
        case_id=case.id,
        event_type="PATIENT_HANDOVER_ACKNOWLEDGED",
        version=evt1.version,
        event_id=evt1.event_id,
        timestamp=evt1.timestamp,
        actor_type="RECEIVING ED",
        actor_id=current_user.id,
        user_id=current_user.id,
        role=current_user.role,
        payload={
            "acceptedBy": current_user.display_name,
            "notes": notes,
            "status": "TRANSFER_COMPLETED",
            "conduitStep": 8
        }
    )

    dispatch_event_nowait(
        case_id=case.id,
        event_type="TRANSFER_COMPLETED",
        version=evt2.version,
        event_id=evt2.event_id,
        timestamp=evt2.timestamp,
        actor_type="RECEIVING ED",
        actor_id=current_user.id,
        user_id=current_user.id,
        role=current_user.role,
        payload={
            "facility": hospital_name,
            "completedAt": now_ts,
            "status": "TRANSFER_COMPLETED",
            "conduitStep": 8
        }
    )

    return build_case_snapshot(case)
