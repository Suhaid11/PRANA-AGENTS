from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

class RealtimeActor(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    type: str # FIELD_MEDIC, REMOTE_CLINICIAN, RECEIVING_ED, SYSTEM, AI_SUPPORT
    id: Optional[str] = None
    name: Optional[str] = None

class RealtimeEventEnvelope(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    event_id: str = Field(alias="eventId")
    case_id: str = Field(alias="caseId")
    event_type: str = Field(alias="eventType")
    version: int
    timestamp: str
    actor: RealtimeActor
    payload: dict = Field(default_factory=dict)

class RealtimeConnectionMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: Literal["CONNECTED", "SUBSCRIBED", "PONG", "ERROR"] = "CONNECTED"
    case_id: str = Field(alias="caseId")
    current_version: int = Field(default=1, alias="currentVersion")
    client_id: Optional[str] = Field(default=None, alias="clientId")
    role: Optional[str] = None
    message: Optional[str] = None
