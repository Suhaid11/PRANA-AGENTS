"""
PRANA — Unified Case Ingestion Service (Phase 23)
Convergence point for Voice, Text, JSON, FHIR, CSV, and Document inputs.
All sources initially produce an unconfirmed CaseDraft with cryptographic provenance.
Only explicit human confirmation mutates the authoritative EmergencyCase model.
"""

import os
import csv
import io
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.domain.models import (
    CaseDraftModel,
    EmergencyCaseModel,
    PatientModel,
    AmbulanceModel,
    VitalSnapshotModel,
    FacilityCandidateModel,
    FacilityReadinessModel,
    CaseParticipantModel,
    UserModel,
    TimelineEventModel
)
from app.domain.schemas import (
    CaseDraftSchema,
    CaseDraftDataSchema,
    CaseDraftConfirmRequest,
    DraftCandidateField,
    DraftFieldProvenanceSchema,
    EmergencyCaseDetailSchema,
)
from app.services.stt_service import get_stt_provider, validate_audio_file
from app.services.extraction_service import extract_case_candidates
from app.services.event_service import append_event
from app.services.case_service import build_case_snapshot
from app.realtime.broadcaster import dispatch_event_nowait

# Maximum file upload size: 10 MB for non-audio documents
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
SUPPORTED_DOC_EXTS = {".json", ".csv", ".txt", ".md"}


def calculate_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


class CaseIngestionService:
    """
    Central case ingestion service implementing multi-adapter ingestion.
    """

    # ------------------------------------------------------------------
    # 1. VOICE INTAKE ADAPTER
    # ------------------------------------------------------------------
    @classmethod
    def ingest_voice(
        cls,
        db: Session,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        current_user: UserModel,
        client_transcript: Optional[str] = None,
        language: str = "en"
    ) -> CaseDraftModel:
        validate_audio_file(filename, content_type, len(audio_bytes))
        source_hash = calculate_hash(audio_bytes)

        # Transcribe with active STT provider
        stt_provider = get_stt_provider()
        transcript_res = stt_provider.transcribe(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language=language,
            client_transcript=client_transcript
        )

        raw_transcript = transcript_res.transcript
        if not raw_transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Transcription yielded empty content. Please speak clearly or retry."
            )

        # Extract candidates
        candidates = extract_case_candidates(
            raw_text=raw_transcript,
            source_type="VOICE",
            source_id=f"voice-{source_hash[:12]}"
        )

        draft_id = f"dft-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"
        draft = CaseDraftModel(
            id=draft_id,
            importer_id=current_user.id,
            importer_name=current_user.display_name,
            source_type="VOICE",
            source_hash=source_hash,
            raw_content=raw_transcript,
            draft_status="DRAFT",
            draft_data_json=json.dumps(candidates.model_dump(by_alias=True)),
            created_at=datetime.now(timezone.utc)
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return draft

    # ------------------------------------------------------------------
    # 2. TEXT INTAKE ADAPTER
    # ------------------------------------------------------------------
    @classmethod
    def ingest_text(
        cls,
        db: Session,
        text: str,
        current_user: UserModel,
        source_name: str = "Field Medic Notes"
    ) -> CaseDraftModel:
        clean_text = text.strip()
        if len(clean_text) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content too short to extract emergency case data."
            )

        source_bytes = clean_text.encode("utf-8")
        source_hash = calculate_hash(source_bytes)

        candidates = extract_case_candidates(
            raw_text=clean_text,
            source_type="TEXT",
            source_id=f"text-{source_hash[:12]}"
        )

        draft_id = f"dft-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"
        draft = CaseDraftModel(
            id=draft_id,
            importer_id=current_user.id,
            importer_name=current_user.display_name,
            source_type="TEXT",
            source_hash=source_hash,
            raw_content=clean_text,
            draft_status="DRAFT",
            draft_data_json=json.dumps(candidates.model_dump(by_alias=True)),
            created_at=datetime.now(timezone.utc)
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return draft

    # ------------------------------------------------------------------
    # 3. FILE INTAKE ADAPTER (JSON / FHIR / CSV / TXT / MD)
    # ------------------------------------------------------------------
    @classmethod
    def ingest_file(
        cls,
        db: Session,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        current_user: UserModel
    ) -> CaseDraftModel:
        if len(file_bytes) > MAX_DOCUMENT_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_DOCUMENT_BYTES // (1024 * 1024)}MB."
            )

        ext = os.path.splitext(filename.lower())[1]
        if ext not in SUPPORTED_DOC_EXTS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(SUPPORTED_DOC_EXTS))}"
            )

        source_hash = calculate_hash(file_bytes)
        source_id = f"file-{source_hash[:12]}"

        try:
            text_content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must be UTF-8 encoded plain text, JSON, or CSV."
            )

        # 3A. JSON / FHIR Handler
        if ext == ".json":
            try:
                parsed_json = json.loads(text_content)
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Malformed JSON: {exc}"
                )

            # Check if HL7 FHIR Bundle
            if isinstance(parsed_json, dict) and parsed_json.get("resourceType") in ("Bundle", "Patient", "Encounter"):
                candidates = cls._parse_fhir(parsed_json, source_id)
                source_type = "FHIR"
            else:
                candidates = cls._parse_structured_json(parsed_json, source_id)
                source_type = "JSON"

        # 3B. CSV Handler
        elif ext == ".csv":
            candidates = cls._parse_csv(text_content, source_id)
            source_type = "CSV"

        # 3C. TXT / MD Handler
        else:
            candidates = extract_case_candidates(text_content, source_type="TEXT", source_id=source_id)
            source_type = "TEXT"

        draft_id = f"dft-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"
        draft = CaseDraftModel(
            id=draft_id,
            importer_id=current_user.id,
            importer_name=current_user.display_name,
            source_type=source_type,
            source_hash=source_hash,
            raw_content=text_content[:20000],
            draft_status="DRAFT",
            draft_data_json=json.dumps(candidates.model_dump(by_alias=True)),
            created_at=datetime.now(timezone.utc)
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return draft

    # ------------------------------------------------------------------
    # HELPER: PARSE STRUCTURED JSON
    # ------------------------------------------------------------------
    @classmethod
    def _parse_structured_json(cls, data: dict, source_id: str) -> CaseDraftDataSchema:
        now_iso = datetime.now(timezone.utc).isoformat()

        def make_field(name: str, val: Any, unit: Optional[str] = None):
            if val is None:
                return None
            return DraftCandidateField(
                fieldName=name,
                value=val,
                unit=unit,
                provenance=DraftFieldProvenanceSchema(
                    source="JSON",
                    sourceId=source_id,
                    sourceTimestamp=now_iso,
                    extractionMethod="PARSED",
                    confidence=1.0,
                    status="UNCONFIRMED"
                )
            )

        p = data.get("patient", {})
        amb = data.get("ambulance", {})
        vitals_raw = data.get("vitals", {}) or data.get("currentVitals", {})

        vitals_dict = {}
        for key in ("heartRate", "spo2", "systolicBp", "diastolicBp", "respiratoryRate", "temperatureC"):
            if key in vitals_raw and vitals_raw[key] is not None:
                vitals_dict[key] = make_field(key, vitals_raw[key])

        return CaseDraftDataSchema(
            patientName=make_field("patientName", p.get("name")),
            approximateAge=make_field("approximateAge", p.get("age"), unit="years"),
            sex=make_field("sex", p.get("sex")),
            incidentType=make_field("incidentType", p.get("incidentType") or data.get("incidentType")),
            chiefComplaint=make_field("chiefComplaint", p.get("chiefComplaint") or data.get("chiefComplaint")),
            consciousState=make_field("consciousState", p.get("consciousState")),
            gcsScore=make_field("gcsScore", p.get("gcsScore"), unit="/15"),
            reportedBloodLoss=make_field("reportedBloodLoss", p.get("reportedBloodLoss")),
            vitals=vitals_dict,
            etaMinutes=make_field("etaMinutes", amb.get("baseEtaMinutes") or data.get("etaMinutes"), unit="mins"),
            domainHint=data.get("domain") or "GENERAL_EMERGENCY"
        )

    # ------------------------------------------------------------------
    # HELPER: PARSE FHIR R4 BUNDLE
    # ------------------------------------------------------------------
    @classmethod
    def _parse_fhir(cls, bundle: dict, source_id: str) -> CaseDraftDataSchema:
        now_iso = datetime.now(timezone.utc).isoformat()
        entries = bundle.get("entry", []) if bundle.get("resourceType") == "Bundle" else [{"resource": bundle}]

        name = None
        age = None
        sex = None
        vitals_dict = {}
        chief_complaint = None

        def make_field(f_name: str, val: Any, unit: Optional[str] = None):
            return DraftCandidateField(
                fieldName=f_name,
                value=val,
                unit=unit,
                provenance=DraftFieldProvenanceSchema(
                    source="FHIR",
                    sourceId=source_id,
                    sourceTimestamp=now_iso,
                    extractionMethod="PARSED",
                    confidence=1.0,
                    status="UNCONFIRMED"
                )
            )

        for entry in entries:
            res = entry.get("resource", {})
            rtype = res.get("resourceType")

            if rtype == "Patient":
                # Names
                names = res.get("name", [])
                if names:
                    family = names[0].get("family", "")
                    given = " ".join(names[0].get("given", []))
                    name = f"{given} {family}".strip()
                # Gender
                gender = res.get("gender")
                if gender:
                    sex = "Male" if gender.lower() == "male" else "Female" if gender.lower() == "female" else "Other"
                # BirthDate -> approx age
                bdate = res.get("birthDate")
                if bdate:
                    try:
                        birth_year = int(bdate.split("-")[0])
                        age = datetime.now().year - birth_year
                    except Exception:
                        pass

            elif rtype == "Observation":
                code_coding = res.get("code", {}).get("coding", [])
                code_str = " ".join([c.get("code", "") + " " + c.get("display", "") for c in code_coding]).lower()
                val_quant = res.get("valueQuantity", {})
                num_val = val_quant.get("value")

                if "heart rate" in code_str or "8867-4" in code_str:
                    vitals_dict["heartRate"] = make_field("heartRate", int(num_val), "bpm")
                elif "oxygen saturation" in code_str or "spo2" in code_str or "2708-6" in code_str:
                    vitals_dict["spo2"] = make_field("spo2", int(num_val), "%")
                elif "respiratory rate" in code_str or "9279-1" in code_str:
                    vitals_dict["respiratoryRate"] = make_field("respiratoryRate", int(num_val), "/min")
                elif "temperature" in code_str or "8310-5" in code_str:
                    vitals_dict["temperatureC"] = make_field("temperatureC", float(num_val), "°C")

            elif rtype == "Encounter":
                reasons = res.get("reasonCode", [])
                if reasons:
                    chief_complaint = reasons[0].get("text")

        return CaseDraftDataSchema(
            patientName=make_field("patientName", name) if name else None,
            approximateAge=make_field("approximateAge", age, unit="years") if age else None,
            sex=make_field("sex", sex) if sex else None,
            incidentType=make_field("incidentType", "FHIR Clinical Encounter"),
            chiefComplaint=make_field("chiefComplaint", chief_complaint or "Imported via FHIR R4 Bundle"),
            vitals=vitals_dict,
            domainHint="GENERAL_EMERGENCY"
        )

    # ------------------------------------------------------------------
    # HELPER: PARSE CSV
    # ------------------------------------------------------------------
    @classmethod
    def _parse_csv(cls, csv_text: str, source_id: str) -> CaseDraftDataSchema:
        now_iso = datetime.now(timezone.utc).isoformat()
        reader = csv.reader(io.StringIO(csv_text))
        rows = [r for r in reader if r]

        data_dict = {}
        for row in rows:
            if len(row) >= 2:
                key = row[0].strip().lower().replace(" ", "_")
                val = row[1].strip()
                data_dict[key] = val

        def make_field(name: str, val: Any, unit: Optional[str] = None):
            if val is None:
                return None
            return DraftCandidateField(
                fieldName=name,
                value=val,
                unit=unit,
                provenance=DraftFieldProvenanceSchema(
                    source="CSV",
                    sourceId=source_id,
                    sourceTimestamp=now_iso,
                    extractionMethod="PARSED",
                    confidence=1.0,
                    status="UNCONFIRMED"
                )
            )

        vitals_dict = {}
        if "heart_rate" in data_dict:
            try:
                vitals_dict["heartRate"] = make_field("heartRate", int(data_dict["heart_rate"]), "bpm")
            except ValueError:
                pass
        if "spo2" in data_dict:
            try:
                vitals_dict["spo2"] = make_field("spo2", int(data_dict["spo2"]), "%")
            except ValueError:
                pass
        if "systolic_bp" in data_dict:
            try:
                vitals_dict["systolicBp"] = make_field("systolicBp", int(data_dict["systolic_bp"]), "mmHg")
            except ValueError:
                pass
        if "diastolic_bp" in data_dict:
            try:
                vitals_dict["diastolicBp"] = make_field("diastolicBp", int(data_dict["diastolic_bp"]), "mmHg")
            except ValueError:
                pass

        age_val = None
        if "age" in data_dict:
            try:
                age_val = int(data_dict["age"])
            except ValueError:
                pass

        return CaseDraftDataSchema(
            patientName=make_field("patientName", data_dict.get("name")),
            approximateAge=make_field("approximateAge", age_val, "years") if age_val else None,
            sex=make_field("sex", data_dict.get("sex", "").capitalize() or None),
            incidentType=make_field("incidentType", data_dict.get("incident_type") or "CSV Recorded Incident"),
            chiefComplaint=make_field("chiefComplaint", data_dict.get("chief_complaint") or "Clinical signs reported in CSV"),
            vitals=vitals_dict,
            domainHint=data_dict.get("domain", "GENERAL_EMERGENCY")
        )

    # ------------------------------------------------------------------
    # 4. FIELD EDITING WITH MANUAL OVERRIDE PROVENANCE
    # ------------------------------------------------------------------
    @classmethod
    def update_draft_field(
        cls,
        db: Session,
        draft_id: str,
        field_name: str,
        new_value: Any,
        current_user: UserModel,
        unit: Optional[str] = None,
        resolve_ambiguity: bool = False
    ) -> CaseDraftModel:
        draft = db.query(CaseDraftModel).filter(CaseDraftModel.id == draft_id).first()
        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

        if draft.draft_status == "CONFIRMED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot edit an already confirmed case draft."
            )

        data = draft.candidate_data
        now_iso = datetime.now(timezone.utc).isoformat()

        # Map snake_case to canonical camelCase
        field_alias_map = {
            "heart_rate": "heartRate",
            "systolic_bp": "systolicBp",
            "diastolic_bp": "diastolicBp",
            "respiratory_rate": "respiratoryRate",
            "temperature_c": "temperatureC",
            "patient_name": "patientName",
            "approximate_age": "approximateAge",
            "incident_type": "incidentType",
            "incident_location": "incidentLocation",
            "chief_complaint": "chiefComplaint",
            "eta_minutes": "etaMinutes",
        }
        canonical_name = field_alias_map.get(field_name, field_name)

        # Update vitals or top-level fields
        if canonical_name in ("heartRate", "spo2", "systolicBp", "diastolicBp", "respiratoryRate", "temperatureC"):
            vitals = data.get("vitals", {})
            existing = vitals.get(canonical_name) or vitals.get(field_name) or {}
            orig_val = existing.get("value") if isinstance(existing, dict) else None
            field_entry = {
                "fieldName": canonical_name,
                "value": new_value,
                "unit": unit or (existing.get("unit") if isinstance(existing, dict) else None),
                "provenance": {
                    "source": "MANUAL",
                    "sourceId": f"usr-{current_user.id}",
                    "sourceTimestamp": now_iso,
                    "extractionMethod": "MANUAL_OVERRIDE",
                    "confidence": 1.0,
                    "status": "CONFIRMED",
                    "originalValue": orig_val,
                    "isApproximate": False,
                    "isAmbiguous": False,
                    "ambiguousOptions": []
                }
            }
            vitals[canonical_name] = field_entry
            vitals[field_name] = field_entry
            data["vitals"] = vitals
        else:
            existing = data.get(canonical_name) or data.get(field_name) or {}
            orig_val = existing.get("value") if isinstance(existing, dict) else None
            field_entry = {
                "fieldName": canonical_name,
                "value": new_value,
                "unit": unit or (existing.get("unit") if isinstance(existing, dict) else None),
                "provenance": {
                    "source": "MANUAL",
                    "sourceId": f"usr-{current_user.id}",
                    "sourceTimestamp": now_iso,
                    "extractionMethod": "MANUAL_OVERRIDE",
                    "confidence": 1.0,
                    "status": "CONFIRMED",
                    "originalValue": orig_val,
                    "isApproximate": False,
                    "isAmbiguous": False,
                    "ambiguousOptions": []
                }
            }
            data[canonical_name] = field_entry
            data[field_name] = field_entry

        draft.candidate_data = data
        draft.updated_at = datetime.now(timezone.utc)
        db.add(draft)
        db.commit()
        db.refresh(draft)
        return draft

    # ------------------------------------------------------------------
    # 5. DRAFT CONFIRMATION -> AUTHORITATIVE EMERGENCY CASE MUTATION
    # ------------------------------------------------------------------
    @classmethod
    def confirm_draft_to_case(
        cls,
        db: Session,
        draft_id: str,
        current_user: UserModel,
        options: Optional[CaseDraftConfirmRequest] = None
    ) -> EmergencyCaseDetailSchema:
        draft = db.query(CaseDraftModel).filter(CaseDraftModel.id == draft_id).first()
        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

        if draft.draft_status == "CONFIRMED" and draft.confirmed_case_id:
            existing_case = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == draft.confirmed_case_id).first()
            if existing_case:
                return build_case_snapshot(existing_case)

        candidate = draft.candidate_data
        vitals_cands = candidate.get("vitals", {})

        # Generate unique case ID e.g. PR-XXXX
        case_id = f"PR-{uuid.uuid4().int % 9000 + 1000}"
        while db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first():
            case_id = f"PR-{uuid.uuid4().int % 9000 + 1000}"

        domain_val = (options.domain if options and options.domain else candidate.get("domainHint", "TRAUMA")).upper()
        if domain_val not in ("TRAUMA", "SNAKEBITE", "POISONING", "RESPIRATORY_DISTRESS", "CARDIAC", "GENERAL_EMERGENCY"):
            domain_val = "TRAUMA"

        # 1. Create EmergencyCaseModel
        now = datetime.now(timezone.utc)
        scenario_title = (
            candidate.get("incidentType", {}).get("value")
            if isinstance(candidate.get("incidentType"), dict)
            else "Prehospital Emergency Transit"
        )
        case = EmergencyCaseModel(
            id=case_id,
            domain=domain_val,
            status="IN_TRANSIT",
            scenario_title=scenario_title or "Active Emergency Transit",
            conduit_step=2,
            current_version=1,
            created_at=now
        )
        db.add(case)

        # 2. Patient Profile
        def get_val(key, default):
            snake_key = "".join(["_" + c.lower() if c.isupper() else c for c in key]).lstrip("_")
            item = candidate.get(key)
            if item is None:
                item = candidate.get(snake_key)
            if isinstance(item, dict) and "value" in item and item["value"] is not None:
                return item["value"]
            elif item is not None and not isinstance(item, dict):
                return item
            return default

        p_name = get_val("patientName", "Unidentified Patient")
        p_age = get_val("approximateAge", 35)
        p_sex = get_val("sex", "Male")
        p_incident = get_val("incidentType", "Prehospital Emergency")
        p_complaint = get_val("chiefComplaint", "Acute physiological distress requiring emergency transit")
        p_conscious = get_val("consciousState", "Alert")
        p_gcs = get_val("gcsScore", 15)
        p_blood_loss = get_val("reportedBloodLoss", "None")

        patient = PatientModel(
            id=f"pat-{case_id}",
            case_id=case_id,
            name=p_name,
            age=int(p_age) if str(p_age).isdigit() else 35,
            sex=p_sex if p_sex in ("Male", "Female", "Other") else "Male",
            incident_type=p_incident,
            chief_complaint=p_complaint,
            conscious_state=p_conscious if p_conscious in ("Alert", "Voice", "Pain", "Unresponsive") else "Alert",
            gcs_score=int(p_gcs) if str(p_gcs).isdigit() and 3 <= int(p_gcs) <= 15 else 15,
            reported_blood_loss=p_blood_loss if p_blood_loss in ("None", "Minimal", "Moderate", "Significant") else "None",
            created_at=now
        )
        db.add(patient)

        # 3. Ambulance Unit
        call_sign = (options.ambulance_call_sign if options and options.ambulance_call_sign else "Echo-4")
        crew_lead = (options.crew_lead if options and options.crew_lead else current_user.display_name)
        eta = get_val("etaMinutes", 12)
        assigned_hosp = (options.assigned_hospital if options and options.assigned_hospital else "Manipal Hospital (Level-1 Trauma Suite)")

        ambulance = AmbulanceModel(
            id=f"amb-{case_id}",
            case_id=case_id,
            call_sign=call_sign,
            crew_lead=crew_lead,
            current_speed_kmh=48.0,
            base_eta_minutes=int(eta) if str(eta).isdigit() else 12,
            traffic_delay_minutes=0,
            is_traffic_delayed=False,
            assigned_hospital=assigned_hosp,
            lat=12.9716,
            lng=77.5946,
            created_at=now
        )
        db.add(ambulance)

        # 4. Initial Vitals Snapshot
        def get_vital(k, def_val):
            snake_k = "".join(["_" + c.lower() if c.isupper() else c for c in k]).lstrip("_")
            item = (
                vitals_cands.get(k)
                or vitals_cands.get(snake_k)
                or candidate.get(k)
                or candidate.get(snake_k)
            )
            if isinstance(item, dict) and "value" in item and item["value"] is not None:
                try:
                    return int(item["value"])
                except Exception:
                    pass
            elif item is not None and str(item).isdigit():
                return int(item)
            return def_val

        v_hr = get_vital("heartRate", 88)
        v_spo2 = get_vital("spo2", 97)
        v_sbp = get_vital("systolicBp", 120)
        v_dbp = get_vital("diastolicBp", 80)
        v_rr = get_vital("respiratoryRate", 18)
        v_temp = 37.0

        vital_snap = VitalSnapshotModel(
            id=f"vit-{case_id}-1",
            case_id=case_id,
            timestamp=now.strftime("%H:%M:%S"),
            heart_rate=v_hr,
            spo2=v_spo2,
            systolic_bp=v_sbp,
            diastolic_bp=v_dbp,
            respiratory_rate=v_rr,
            temperature_c=v_temp,
            is_abnormal=(v_hr > 105 or v_hr < 55 or v_spo2 < 93 or v_sbp < 95),
            created_at=now
        )
        db.add(vital_snap)

        # 5. Facility Candidates & Readiness
        facilities = [
            FacilityCandidateModel(
                id=f"fac-{case_id}-1",
                case_id=case_id,
                facility_id="HOSP-MANIPAL",
                name="Manipal Hospital (Level-1 Trauma Suite)",
                trauma_level="Certified Level-1 Trauma Suite",
                distance_km=4.8,
                eta_minutes=int(eta) if str(eta).isdigit() else 12,
                match_score=94,
                clinical_fit_score=96,
                availability_score=90,
                eta_score=95,
                is_primary=True,
                specialty_fit="24/7 Angio-Embolization & Neurotrauma",
                availability="Red Bay Available",
                rationale="Highest clinical fit and dedicated emergency capabilities.",
                created_at=now
            ),
            FacilityCandidateModel(
                id=f"fac-{case_id}-2",
                case_id=case_id,
                facility_id="HOSP-VICTORIA",
                name="Victoria Hospital",
                trauma_level="Level-2 Center",
                distance_km=7.2,
                eta_minutes=18,
                match_score=82,
                clinical_fit_score=80,
                availability_score=85,
                eta_score=80,
                is_primary=False,
                specialty_fit="General Emergency & Resuscitation",
                availability="1 Bay Available",
                rationale="Secondary receiving emergency department.",
                created_at=now
            )
        ]
        for f in facilities:
            db.add(f)

        readiness = FacilityReadinessModel(
            id=f"read-{case_id}",
            case_id=case_id,
            status="PRE_ALERT_TRANSMITTED",
            assigned_bay="Resuscitation Bay 1",
            confirmed_by=None,
            timestamp=now.strftime("%H:%M:%S"),
            is_pre_alert_dispatched=True,
            is_pre_alert_acknowledged=False,
            resources_ready_json=json.dumps(["Level-1 Trauma Team", "Rapid Infuser", "Bedside Ultrasound"]),
            created_at=now
        )
        db.add(readiness)

        # 6. Case Participant Assignment
        participant = CaseParticipantModel(
            id=f"part-{case_id}-{current_user.id}",
            case_id=case_id,
            user_id=current_user.id,
            role=current_user.role,
            assigned_at=now,
            active=True
        )
        db.add(participant)

        # 7. Immutable Timeline Events with Provenance Chain
        append_event(
            db=db,
            case_id=case_id,
            title="Emergency Case Ingestion Started",
            detail=f"Case intake initiated via {draft.source_type} by {current_user.display_name}. Source SHA-256: {draft.source_hash[:16]}...",
            actor=current_user.role,
            category="SYSTEM",
            status="INFO",
            timestamp=now.strftime("%H:%M:%S"),
            payload={"sourceType": draft.source_type, "sourceHash": draft.source_hash, "draftId": draft_id}
        )

        if draft.source_type == "VOICE":
            append_event(
                db=db,
                case_id=case_id,
                title="Voice Transcription Immutable Record Created",
                detail=f"Transcript: \"{draft.raw_content[:140]}...\"",
                actor="AI SUPPORT",
                category="SYSTEM",
                status="INFO",
                timestamp=now.strftime("%H:%M:%S"),
                payload={"transcriptSnippet": draft.raw_content[:200]}
            )

        append_event(
            db=db,
            case_id=case_id,
            title="Candidate Clinical Extraction Completed",
            detail=f"Extracted demographics, vitals (HR {v_hr}, SpO2 {v_spo2}%), and initial incident context.",
            actor="AI SUPPORT",
            category="CLINICAL",
            status="INFO",
            timestamp=now.strftime("%H:%M:%S"),
            payload={"extractedFieldsCount": len(candidate)}
        )

        append_event(
            db=db,
            case_id=case_id,
            title="Case Import Confirmed & Authoritative Record Activated",
            detail=f"Operator {current_user.display_name} verified extracted facts and confirmed case activation into prehospital corridor.",
            actor=current_user.role,
            category="CLINICAL",
            status="SUCCESS",
            timestamp=now.strftime("%H:%M:%S"),
            payload={"confirmedBy": current_user.display_name, "caseId": case_id}
        )

        # 8. Mark Draft as CONFIRMED
        draft.draft_status = "CONFIRMED"
        draft.confirmed_case_id = case_id
        draft.updated_at = now
        db.add(draft)

        db.commit()

        # 9. Realtime WebSocket Broadcast: CASE_CREATED
        dispatch_event_nowait(
            case_id=case_id,
            event_type="CASE_CREATED",
            version=1,
            event_id=f"evt-created-{case_id}",
            timestamp=now.strftime("%H:%M:%S"),
            actor_type="FIELD_MEDIC",
            actor_id=current_user.id,
            user_id=current_user.id,
            role=current_user.role,
            payload={"caseId": case_id, "domain": domain_val, "patientName": p_name}
        )

        # 10. Trigger AgentOrchestrator for downstream clinical decision support
        try:
            from app.ai.orchestrator import AgentOrchestrator
            orch = AgentOrchestrator(db, case_id)
            orch.run_agent_task()
        except Exception as exc:
            import logging
            logging.getLogger("prana.intake").warning("Initial agent orchestration task warning: %s", exc)

        refreshed_case = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
        return build_case_snapshot(refreshed_case)
