import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.models import UserModel, HandoverPackageModel
from app.domain.schemas import (
    PrehospitalHandoverPackageSchema,
    HandoverAcknowledgeRequest,
    HandoverVerifyResponse,
    HandoverSummarySchema,
    UserRoleEnum
)
from app.services.case_service import get_case_or_404
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
