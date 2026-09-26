"""
Canonical Seed Data for PRANA: 3 Competition Scenarios
- PR-8492: Trauma / Road Accident (Rahul Verma)
- PR-7104: Snakebite / Envenomation (Sunita Gowda)
- PR-9521: Poisoning / Toxicology (Manoj Kumar)
"""

SCENARIOS = {
    "PR-8492": {
        "id": "PR-8492",
        "domain": "TRAUMA",
        "status": "IN_TRANSIT",
        "scenario_title": "Simulated hemodynamic deterioration pattern",
        "conduit_step": 2,
        "patient": {
            "id": "PT-391",
            "name": "Rahul Verma",
            "age": 34,
            "sex": "Male",
            "incident_type": "High-Velocity Motor Vehicle Collision",
            "chief_complaint": "Blunt chest/abdominal impact, persistent dizziness, pale diaphoresis",
            "conscious_state": "Alert",
            "gcs_score": 14,
            "reported_blood_loss": "Significant"
        },
        "ambulance": {
            "id": "AMB-ECHO4",
            "call_sign": "Echo-4",
            "crew_lead": "Paramedic A. Kumar",
            "current_speed_kmh": 48.0,
            "base_eta_minutes": 14,
            "traffic_delay_minutes": 0,
            "is_traffic_delayed": False,
            "assigned_hospital": "Manipal Hospital (Level-1 Trauma)",
            "lat": 12.9716,
            "lng": 77.5946
        },
        "vitals": [
            {"timestamp": "09:36:00", "heart_rate": 88, "spo2": 98, "systolic_bp": 124, "diastolic_bp": 78, "respiratory_rate": 16, "temperature_c": 36.9, "is_abnormal": False},
            {"timestamp": "09:38:00", "heart_rate": 94, "spo2": 97, "systolic_bp": 116, "diastolic_bp": 74, "respiratory_rate": 18, "temperature_c": 36.9, "is_abnormal": False},
            {"timestamp": "09:40:00", "heart_rate": 104, "spo2": 95, "systolic_bp": 106, "diastolic_bp": 68, "respiratory_rate": 20, "temperature_c": 36.8, "is_abnormal": False},
            {"timestamp": "09:42:15", "heart_rate": 112, "spo2": 93, "systolic_bp": 98, "diastolic_bp": 64, "respiratory_rate": 22, "temperature_c": 36.8, "is_abnormal": False}
        ],
        "facilities": [
            {
                "id": "cand-1",
                "facility_id": "HOSP-MANIPAL",
                "name": "Manipal Hospital Old Airport Rd",
                "trauma_level": "Level-1 Trauma Suite",
                "distance_km": 7.2,
                "eta_minutes": 14,
                "match_score": 94,
                "clinical_fit_score": 98,
                "availability_score": 95,
                "eta_score": 88,
                "is_primary": True,
                "specialty_fit": "Trauma Surgery + Interventional Radiology",
                "availability": "Red Bay 1 sterile · CT Scanner clear",
                "rationale": "Top match: 14 min ETA along arterial corridor with verified open resuscitation bay and on-call trauma surgeon."
            },
            {
                "id": "cand-2",
                "facility_id": "HOSP-APOLLO",
                "name": "Apollo Hospital Bannerghatta",
                "trauma_level": "Level-1 Trauma Suite",
                "distance_km": 11.4,
                "eta_minutes": 22,
                "match_score": 78,
                "clinical_fit_score": 98,
                "availability_score": 20,
                "eta_score": 60,
                "is_primary": False,
                "specialty_fit": "Comprehensive Trauma + Neurosurgery",
                "availability": "Bay busy · Diversion advisory warning",
                "rationale": "+8 min additional transport transit risk in peak corridor traffic; resuscitation bay currently at high capacity."
            },
            {
                "id": "cand-3",
                "facility_id": "HOSP-COLUMBIA",
                "name": "Columbia Asia Referral Hospital",
                "trauma_level": "Level-2 Trauma Center",
                "distance_km": 5.1,
                "eta_minutes": 11,
                "match_score": 63,
                "clinical_fit_score": 50,
                "availability_score": 85,
                "eta_score": 92,
                "is_primary": False,
                "specialty_fit": "General Emergency + Orthopedics",
                "availability": "Emergency bay open",
                "rationale": "Closer distance (-3 min ETA) but lacks active 24/7 angio-embolization and dedicated massive transfusion protocol."
            }
        ],
        "readiness": {
            "id": "read-1",
            "status": "ACCEPTED",
            "assigned_bay": "Trauma Bay 1 (Red Zone)",
            "bed_number": "ICU-B3",
            "is_pre_alert_dispatched": True,
            "is_pre_alert_acknowledged": True,
            "acknowledged_at": "09:37:00",
            "confirmed_by": "Sister Philomina, RN · Charge Nurse",
            "resources_ready": ["CT Scanner Hot Standby", "O-Negative Blood Thawed", "Trauma Team Alerted"]
        },
        "endorsement": {
            "status": "PENDING",
            "clinician_name": "Dr. Sunita Rao, MD",
            "clinician_id": "DOC-482"
        },
        "timeline": [
            {
                "id": "evt-1",
                "event_id": "evt-1",
                "timestamp": "09:32:10",
                "category": "SYSTEM",
                "title": "Emergency Incident Created",
                "detail": "108 Dispatch logged multi-vehicle collision at Ring Road Junction 4.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-2",
                "event_id": "evt-2",
                "timestamp": "09:34:25",
                "category": "SYSTEM",
                "title": "Ambulance Echo-4 Dispatched",
                "detail": "Unit assigned with Advanced Life Support equipment.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-3",
                "event_id": "evt-3",
                "timestamp": "09:39:40",
                "category": "CLINICAL",
                "title": "Patient Secured Onboard",
                "detail": "C-spine collar applied, vacuum splint secured, 18G IV established in left forearm.",
                "actor": "FIELD MEDIC",
                "status": "SUCCESS"
            },
            {
                "id": "evt-4",
                "event_id": "evt-4",
                "timestamp": "09:40:30",
                "category": "CLINICAL",
                "title": "Initial Telemetry Stream Active",
                "detail": "Multiparameter monitor streaming HR 104, SpO2 95%, NIBP 106/68.",
                "actor": "FIELD MEDIC",
                "status": "INFO"
            },
            {
                "id": "evt-5",
                "event_id": "evt-5",
                "timestamp": "09:42:15",
                "category": "CLINICAL",
                "title": "Observation Recorded",
                "detail": "Heart rate trending upward (112 bpm), pulse pressure narrowing (34 mmHg).",
                "actor": "FIELD MEDIC",
                "status": "WARNING"
            }
        ]
    },
    "PR-7104": {
        "id": "PR-7104",
        "domain": "SNAKEBITE",
        "status": "IN_TRANSIT",
        "scenario_title": "Suspected Russell's viper envenomation",
        "conduit_step": 2,
        "patient": {
            "id": "PT-502",
            "name": "Sunita Gowda",
            "age": 28,
            "sex": "Female",
            "incident_type": "Agricultural Envenomation — Viperid Bite",
            "chief_complaint": "Severe swelling and pain right lower limb, persistent bleeding from fang puncture marks",
            "conscious_state": "Alert",
            "gcs_score": 15,
            "reported_blood_loss": "Moderate"
        },
        "ambulance": {
            "id": "AMB-ECHO7",
            "call_sign": "Echo-7",
            "crew_lead": "Paramedic M. Patel",
            "current_speed_kmh": 42.0,
            "base_eta_minutes": 18,
            "traffic_delay_minutes": 0,
            "is_traffic_delayed": False,
            "assigned_hospital": "Victoria Hospital (Regional Toxicology Center)",
            "lat": 12.9634,
            "lng": 77.5738
        },
        "vitals": [
            {"timestamp": "09:48:00", "heart_rate": 84, "spo2": 99, "systolic_bp": 122, "diastolic_bp": 78, "respiratory_rate": 16, "temperature_c": 37.1, "is_abnormal": False},
            {"timestamp": "09:50:00", "heart_rate": 92, "spo2": 98, "systolic_bp": 118, "diastolic_bp": 76, "respiratory_rate": 18, "temperature_c": 37.1, "is_abnormal": False},
            {"timestamp": "09:52:00", "heart_rate": 102, "spo2": 97, "systolic_bp": 112, "diastolic_bp": 72, "respiratory_rate": 20, "temperature_c": 37.0, "is_abnormal": False},
            {"timestamp": "09:54:10", "heart_rate": 108, "spo2": 96, "systolic_bp": 108, "diastolic_bp": 68, "respiratory_rate": 20, "temperature_c": 37.0, "is_abnormal": False}
        ],
        "facilities": [
            {
                "id": "cand-vic",
                "facility_id": "HOSP-VICTORIA",
                "name": "Victoria Hospital Toxicology Unit",
                "trauma_level": "Regional Antivenom Center",
                "distance_km": 9.4,
                "eta_minutes": 18,
                "match_score": 96,
                "clinical_fit_score": 98,
                "availability_score": 95,
                "eta_score": 85,
                "is_primary": True,
                "specialty_fit": "Dedicated Antivenom Stocks + Dialysis Standby",
                "availability": "Toxicology bed available · ASV cold chain verified",
                "rationale": "Designated apex venom center with 40+ vials polyvalent ASV on hand and 24/7 nephrology support."
            },
            {
                "id": "cand-bow",
                "facility_id": "HOSP-BOWRING",
                "name": "Bowring & Lady Curzon Hospital",
                "trauma_level": "District Emergency Center",
                "distance_km": 6.8,
                "eta_minutes": 13,
                "match_score": 74,
                "clinical_fit_score": 75,
                "availability_score": 85,
                "eta_score": 90,
                "is_primary": False,
                "specialty_fit": "General Emergency + Basic ASV Stock",
                "availability": "Emergency ward active · Limited ASV (4 vials)",
                "rationale": "Closer facility (-5 min ETA) but insufficient antivenom reserve for confirmed hemotoxic Russell's bite."
            }
        ],
        "readiness": {
            "id": "read-2",
            "status": "ACCEPTED",
            "assigned_bay": "Toxicology Resuscitation Bed 2",
            "bed_number": "TOX-02",
            "is_pre_alert_dispatched": True,
            "is_pre_alert_acknowledged": True,
            "acknowledged_at": "09:51:00",
            "confirmed_by": "Dr. Ramesh, MD · Toxicologist",
            "resources_ready": ["Polyvalent ASV Cold-Box Thawed", "Whole Blood Clotting Test Tubes Ready", "Nephrology On-Call"]
        },
        "endorsement": {
            "status": "PENDING",
            "clinician_name": "Dr. Sunita Rao, MD",
            "clinician_id": "DOC-482"
        },
        "timeline": [
            {
                "id": "evt-s1",
                "event_id": "evt-s1",
                "timestamp": "09:44:10",
                "category": "SYSTEM",
                "title": "Emergency Incident Created",
                "detail": "Snakebite emergency reported at Sarjapur rural farm cluster.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-s2",
                "event_id": "evt-s2",
                "timestamp": "09:46:30",
                "category": "SYSTEM",
                "title": "Ambulance Echo-7 Dispatched",
                "detail": "ALS unit equipped with pressure immobilization splints and toxicology pack.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-s3",
                "event_id": "evt-s3",
                "timestamp": "09:49:15",
                "category": "CLINICAL",
                "title": "Patient Secured Onboard",
                "detail": "Right leg immobilized at heart level. Bite margin demarcated with marker. Tourniquet avoided.",
                "actor": "FIELD MEDIC",
                "status": "SUCCESS"
            },
            {
                "id": "evt-s4",
                "event_id": "evt-s4",
                "timestamp": "09:51:00",
                "category": "CLINICAL",
                "title": "Initial Telemetry Stream Active",
                "detail": "Telemetry streaming HR 92, SpO2 98%, BP 118/76.",
                "actor": "FIELD MEDIC",
                "status": "INFO"
            }
        ]
    },
    "PR-9521": {
        "id": "PR-9521",
        "domain": "POISONING",
        "status": "IN_TRANSIT",
        "scenario_title": "Organophosphate pesticide inhalation crisis",
        "conduit_step": 2,
        "patient": {
            "id": "PT-714",
            "name": "Manoj Kumar",
            "age": 45,
            "sex": "Male",
            "incident_type": "Industrial / Agricultural Chemical Exposure",
            "chief_complaint": "Acute organophosphate poisoning with copious oral secretions, bronchorrhea, and bradycardia",
            "conscious_state": "Voice",
            "gcs_score": 11,
            "reported_blood_loss": "None"
        },
        "ambulance": {
            "id": "AMB-ECHO9",
            "call_sign": "Echo-9",
            "crew_lead": "Paramedic V. Sharma",
            "current_speed_kmh": 46.0,
            "base_eta_minutes": 16,
            "traffic_delay_minutes": 0,
            "is_traffic_delayed": False,
            "assigned_hospital": "MS Ramaiah Medical Center (Toxicology ICU)",
            "lat": 13.0308,
            "lng": 77.5649
        },
        "vitals": [
            {"timestamp": "10:10:00", "heart_rate": 62, "spo2": 95, "systolic_bp": 110, "diastolic_bp": 70, "respiratory_rate": 20, "temperature_c": 36.6, "is_abnormal": False},
            {"timestamp": "10:12:00", "heart_rate": 54, "spo2": 92, "systolic_bp": 104, "diastolic_bp": 64, "respiratory_rate": 22, "temperature_c": 36.5, "is_abnormal": True},
            {"timestamp": "10:14:00", "heart_rate": 48, "spo2": 89, "systolic_bp": 98, "diastolic_bp": 60, "respiratory_rate": 26, "temperature_c": 36.5, "is_abnormal": True},
            {"timestamp": "10:15:30", "heart_rate": 42, "spo2": 84, "systolic_bp": 92, "diastolic_bp": 54, "respiratory_rate": 28, "temperature_c": 36.4, "is_abnormal": True}
        ],
        "facilities": [
            {
                "id": "cand-ram",
                "facility_id": "HOSP-RAMAIAH",
                "name": "MS Ramaiah Medical Center",
                "trauma_level": "Specialized Toxicology ICU",
                "distance_km": 8.1,
                "eta_minutes": 16,
                "match_score": 97,
                "clinical_fit_score": 98,
                "availability_score": 95,
                "eta_score": 88,
                "is_primary": True,
                "specialty_fit": "Dedicated Toxicology ICU + Mechanical Ventilation",
                "availability": "Isolated decontamination bay ready · Atropine infusion stocked",
                "rationale": "Primary destination: isolated chemical decontamination suite with full toxicology critical care team."
            },
            {
                "id": "cand-kc",
                "facility_id": "HOSP-KC",
                "name": "KC General Hospital",
                "trauma_level": "General Emergency Ward",
                "distance_km": 4.6,
                "eta_minutes": 10,
                "match_score": 68,
                "clinical_fit_score": 55,
                "availability_score": 85,
                "eta_score": 95,
                "is_primary": False,
                "specialty_fit": "General Resuscitation",
                "availability": "Open bed in emergency room",
                "rationale": "Closest hospital (-6 min ETA) but lacks dedicated chemical wash isolation bay and advanced toxicology ICU."
            }
        ],
        "readiness": {
            "id": "read-3",
            "status": "ACCEPTED",
            "assigned_bay": "Chemical Decontamination Bay 1",
            "bed_number": "TOX-ICU-1",
            "is_pre_alert_dispatched": True,
            "is_pre_alert_acknowledged": True,
            "acknowledged_at": "10:13:00",
            "confirmed_by": "Dr. Pradeep, MD · Critical Care Toxicology",
            "resources_ready": ["Decontamination Wash Activated", "High-Dose Atropine Ready", "Mechanical Ventilator Staged"]
        },
        "endorsement": {
            "status": "PENDING",
            "clinician_name": "Dr. Sunita Rao, MD",
            "clinician_id": "DOC-482"
        },
        "timeline": [
            {
                "id": "evt-p1",
                "event_id": "evt-p1",
                "timestamp": "10:08:15",
                "category": "SYSTEM",
                "title": "Emergency Incident Created",
                "detail": "Severe organophosphate pesticide poisoning reported at warehouse.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-p2",
                "event_id": "evt-p2",
                "timestamp": "10:09:40",
                "category": "SYSTEM",
                "title": "Ambulance Echo-9 Dispatched",
                "detail": "ALS unit mobilized with HazMat chemical personal protective equipment.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-p3",
                "event_id": "evt-p3",
                "timestamp": "10:11:50",
                "category": "CLINICAL",
                "title": "Patient Secured Onboard",
                "detail": "Contaminated outer clothing excised; continuous airway suctioning initiated.",
                "actor": "FIELD MEDIC",
                "status": "SUCCESS"
            },
            {
                "id": "evt-p4",
                "event_id": "evt-p4",
                "timestamp": "10:13:20",
                "category": "CLINICAL",
                "title": "Initial Telemetry Stream Active",
                "detail": "Telemetry online: HR 54 bpm (vagal bradycardia), SpO2 92%, copious oral secretions.",
                "actor": "FIELD MEDIC",
                "status": "WARNING"
            }
        ]
    },
    "PR-4018": {
        "id": "PR-4018",
        "domain": "RESPIRATORY_DISTRESS",
        "status": "IN_TRANSIT",
        "scenario_title": "Simulated acute respiratory compromise & hypoxia pattern",
        "conduit_step": 2,
        "patient": {
            "id": "PT-401",
            "name": "Radha Sharma",
            "age": 52,
            "sex": "Female",
            "incident_type": "Acute Severe Bronchospasm & Respiratory Exhaustion",
            "chief_complaint": "Severe breathlessness, rapid shallow breathing, unable to complete sentences",
            "conscious_state": "Alert",
            "gcs_score": 14,
            "reported_blood_loss": "None"
        },
        "ambulance": {
            "id": "AMB-SIERRA3",
            "call_sign": "Sierra-3",
            "crew_lead": "Paramedic P. Das",
            "current_speed_kmh": 50.0,
            "base_eta_minutes": 11,
            "traffic_delay_minutes": 0,
            "is_traffic_delayed": False,
            "assigned_hospital": "Manipal Hospital Whitefield (Pulmonary ICU · Bay 2)",
            "lat": 12.9840,
            "lng": 77.7280
        },
        "vitals": [
            {"timestamp": "11:20:00", "heart_rate": 108, "spo2": 90, "systolic_bp": 142, "diastolic_bp": 90, "respiratory_rate": 28, "temperature_c": 37.1, "is_abnormal": True},
            {"timestamp": "11:22:00", "heart_rate": 114, "spo2": 88, "systolic_bp": 140, "diastolic_bp": 88, "respiratory_rate": 30, "temperature_c": 37.1, "is_abnormal": True},
            {"timestamp": "11:24:10", "heart_rate": 122, "spo2": 85, "systolic_bp": 136, "diastolic_bp": 86, "respiratory_rate": 34, "temperature_c": 37.2, "is_abnormal": True}
        ],
        "facilities": [
            {
                "id": "cand-resp-1",
                "facility_id": "HOSP-MANIPAL-WF",
                "name": "Manipal Hospital Whitefield",
                "trauma_level": "Tertiary Care & Pulmonology Suite",
                "distance_km": 5.4,
                "eta_minutes": 11,
                "match_score": 95,
                "clinical_fit_score": 98,
                "availability_score": 92,
                "eta_score": 95,
                "is_primary": True,
                "specialty_fit": "Dedicated Pulmonary ICU & Non-Invasive Ventilation",
                "availability": "Pulmonary Bay 2 Ready · NIV Circuit Primed",
                "rationale": "Direct corridor alignment with specialized respiratory intensive care capability."
            },
            {
                "id": "cand-resp-2",
                "facility_id": "HOSP-VYDEHI",
                "name": "Vydehi Institute of Medical Sciences",
                "trauma_level": "Level-2 Center",
                "distance_km": 8.0,
                "eta_minutes": 16,
                "match_score": 83,
                "clinical_fit_score": 82,
                "availability_score": 88,
                "eta_score": 80,
                "is_primary": False,
                "specialty_fit": "General ICU & Respiratory Care",
                "availability": "1 Bay Available",
                "rationale": "Secondary receiving facility with ventilator capacity."
            }
        ],
        "readiness": {
            "id": "read-resp",
            "status": "PRE_ALERT_TRANSMITTED",
            "assigned_bay": "Pulmonary Resuscitation Bay 2",
            "bed_number": "PULM-B2",
            "confirmed_by": None,
            "timestamp": "11:22:30",
            "is_pre_alert_dispatched": True,
            "is_pre_alert_acknowledged": False,
            "resources_ready": ["High-Flow Nasal Cannula", "Mechanical Ventilator", "Inhaled Bronchodilator"]
        },
        "endorsement": {
            "status": "PENDING",
            "clinician_name": "Dr. Sunita Rao, MD",
            "clinician_id": "DOC-482"
        },
        "timeline": [
            {
                "id": "evt-r1",
                "event_id": "evt-r1",
                "timestamp": "11:18:15",
                "category": "SYSTEM",
                "title": "Emergency Incident Created",
                "detail": "Acute respiratory distress and severe hypoxia reported at residence.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-r2",
                "event_id": "evt-r2",
                "timestamp": "11:19:40",
                "category": "SYSTEM",
                "title": "Ambulance Sierra-3 Dispatched",
                "detail": "ALS unit mobilized with high-flow oxygen and nebulization kit.",
                "actor": "SYSTEM",
                "status": "INFO"
            },
            {
                "id": "evt-r3",
                "event_id": "evt-r3",
                "timestamp": "11:21:50",
                "category": "CLINICAL",
                "title": "Patient Secured Onboard",
                "detail": "High-flow oxygen (15 L/min via NRB) and continuous pulse oximetry initiated.",
                "actor": "FIELD MEDIC",
                "status": "SUCCESS"
            },
            {
                "id": "evt-r4",
                "event_id": "evt-r4",
                "timestamp": "11:24:10",
                "category": "CLINICAL",
                "title": "Initial Telemetry Stream Active",
                "detail": "Telemetry online: HR 122 bpm, SpO2 85%, RR 34/min, marked wheezing.",
                "actor": "FIELD MEDIC",
                "status": "WARNING"
            }
        ]
    }
}
