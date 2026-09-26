import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.init_db import init_db
from app.core.security import create_access_token

from app.database import SessionLocal

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    return TestClient(app)


def make_token(user_id: str, email: str, role: str, name: str, expires_delta=None) -> str:
    return create_access_token(
        subject=email,
        role=role,
        user_id=user_id,
        display_name=name,
        expires_delta=expires_delta
    )

@pytest.fixture
def medic_token():
    return make_token("usr-medic-102", "medic@demo.prana", "FIELD_MEDIC", "Paramedic Rajesh Kumar")

@pytest.fixture
def clinician_token():
    return make_token("usr-clinician-482", "clinician@demo.prana", "REMOTE_CLINICIAN", "Dr. Sunita Rao, MD")

@pytest.fixture
def hospital_token():
    return make_token("usr-hospital-704", "hospital@demo.prana", "HOSPITAL_COMMAND", "Sister Philomina, RN")

@pytest.fixture
def readiness_token():
    return make_token("usr-readiness-301", "readiness@demo.prana", "READINESS", "Officer Anil Deshmukh")

@pytest.fixture
def admin_token():
    return make_token("usr-admin-001", "admin@demo.prana", "PORTAL_ADMIN", "Director Vikram Sharma")

@pytest.fixture
def unassigned_token():
    return make_token("usr-medic-999", "unassigned@demo.prana", "FIELD_MEDIC", "Paramedic Unassigned")

@pytest.fixture
def medic_headers(medic_token):
    return {"Authorization": f"Bearer {medic_token}"}

@pytest.fixture
def clinician_headers(clinician_token):
    return {"Authorization": f"Bearer {clinician_token}"}

@pytest.fixture
def hospital_headers(hospital_token):
    return {"Authorization": f"Bearer {hospital_token}"}

@pytest.fixture
def readiness_headers(readiness_token):
    return {"Authorization": f"Bearer {readiness_token}"}

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def unassigned_headers(unassigned_token):
    return {"Authorization": f"Bearer {unassigned_token}"}
