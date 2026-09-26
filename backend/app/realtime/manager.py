import asyncio
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket

logger = logging.getLogger("prana.realtime")

class ConnectionManager:
    def __init__(self):
        # case_id -> set of active WebSocket instances
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # websocket -> connection metadata dict (case_id, client_id, role)
        self.connection_meta: Dict[WebSocket, dict] = {}
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(
        self,
        websocket: WebSocket,
        case_id: str,
        client_id: str = "anon",
        role: str = "FIELD_MEDIC",
        current_version: int = 1,
        already_accepted: bool = False
    ):
        if not self.loop:
            try:
                self.loop = asyncio.get_running_loop()
            except RuntimeError:
                pass

        if not already_accepted:
            await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = set()
        
        self.active_connections[case_id].add(websocket)
        self.connection_meta[websocket] = {
            "case_id": case_id,
            "client_id": client_id,
            "role": role
        }

        # Send immediate connection handshake confirmation
        handshake = {
            "type": "CONNECTED",
            "caseId": case_id,
            "currentVersion": current_version,
            "clientId": client_id,
            "role": role,
            "timestamp": None
        }
        try:
            await websocket.send_json(handshake)
        except Exception as e:
            logger.warning(f"[Realtime] Failed to send handshake to {client_id}: {e}")

        logger.info(
            f"[Realtime] Client '{client_id}' ({role}) connected to case '{case_id}'. "
            f"Active connections for case: {len(self.active_connections[case_id])}"
        )

    def disconnect(self, websocket: WebSocket):
        meta = self.connection_meta.pop(websocket, None)
        if meta:
            case_id = meta.get("case_id")
            client_id = meta.get("client_id")
            if case_id and case_id in self.active_connections:
                self.active_connections[case_id].discard(websocket)
                if not self.active_connections[case_id]:
                    del self.active_connections[case_id]
            logger.info(f"[Realtime] Client '{client_id}' disconnected from case '{case_id}'")

    async def broadcast_to_case(self, case_id: str, message: dict):
        """
        Broadcast a real-time event envelope to all clients subscribed to case_id.
        Strict case isolation: clients in other cases never receive this message.
        """
        if case_id not in self.active_connections:
            return

        dead_sockets = set()
        for connection in list(self.active_connections[case_id]):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"[Realtime] Error broadcasting to client in case {case_id}: {e}")
                dead_sockets.add(connection)

        for dead in dead_sockets:
            self.disconnect(dead)

    def get_connection_count(self, case_id: Optional[str] = None) -> int:
        if case_id:
            return len(self.active_connections.get(case_id, set()))
        return sum(len(conns) for conns in self.active_connections.values())

    def get_active_cases(self) -> list[str]:
        return list(self.active_connections.keys())


realtime_manager = ConnectionManager()
