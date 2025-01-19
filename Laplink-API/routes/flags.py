from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, Depends
from typing import List, Dict
from db.connection import prioritized_get_db_connection
from response_models.response_models import FlagCreate, PostResponseModel, PutResponseModel, FlagsResponseModel, DeleteResponseModel
import service.auth as auth

router = APIRouter()
active_connections: Dict[int, List[WebSocket]] = {}

@router.post("/create", response_model=PostResponseModel)
async def create_flag(flag: FlagCreate, api_key: str = Depends(auth.get_api_key)):
    """
    Vytvoří novou vlajku.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """INSERT INTO flags (name, note) VALUES (%s, %s);"""
        values = (flag.name, flag.note)
        cursor.execute(command, values)
        db_connection.commit()
        return {"status": "success", "message": "Flag created successfully"}
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating flag: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/{id}", response_model=PutResponseModel)
async def update_flag(id: int, flag: FlagCreate, api_key: str = Depends(auth.get_api_key)):
    """
    Aktualizuje vlajku v databázi podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """
        UPDATE flags
        SET name = %s, note = %s
        WHERE id = %s;
        """
        values = (flag.name, flag.note, id)
        cursor.execute(command, values)
        db_connection.commit()
        return {"status": "success", "message": "Flag updated successfully"}
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating flag: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/all", response_model=List[FlagsResponseModel])
async def get_all_flags(api_key: str = Depends(auth.get_api_key)):
    """
    Vrátí všechny vlajky.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM flags;")
        flags = cursor.fetchall()
        return flags
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting flags: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/{id}", response_model=FlagsResponseModel)
async def get_flag(id: int, api_key: str = Depends(auth.get_api_key)):
    """
    Vrátí vlajku podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM flags WHERE id = %s;", (id,))
        flag = cursor.fetchone()
        return flag
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting flag: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/{id}", response_model=DeleteResponseModel)
async def delete_flag(id: int, api_key: str = Depends(auth.get_api_key)):
    """
    Smaže vlajku podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        cursor.execute("DELETE FROM flags WHERE id = %s;", (id,))
        db_connection.commit()
        return {"status": "success", "message": "Flag deleted successfully"}
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting flag: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.put("/deactivate/{assignment_id}", response_model=PutResponseModel)
async def deactivate_flag(assignment_id: int, api_key: str = Depends(auth.get_api_key)):
    """
    Deaktivuje vlajku (nastaví ji jako neaktivní).
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """
            UPDATE flag_assignments
            SET is_active = FALSE
            WHERE id = %s;
        """
        cursor.execute(command, (assignment_id,))
        db_connection.commit()
        return {"status": "success", "message": "Flag deactivated successfully"}
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deactivating flag: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/assign", response_model=PostResponseModel)
async def assign_flag(
    flag_id: int,
    event_id: int,
    driver_id: int = None,  # Null = určeno všem
    api_key: str = Depends(auth.get_api_key)
):
    """
    Přiřadí vlajku k závodu (a případně konkrétnímu jezdci).
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor(dictionary=True)

    try:
        # Validace vstupů
        cursor.execute("SELECT id FROM flags WHERE id = %s;", (flag_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Flag not found")

        cursor.execute("SELECT id FROM event WHERE id = %s;", (event_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")

        if driver_id:
            cursor.execute("SELECT id FROM driver WHERE id = %s;", (driver_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Driver not found")

        # Přiřazení vlajky
        command = """
            INSERT INTO flag_assignments (flag_id, event_id, driver_id)
            VALUES (%s, %s, %s);
        """
        cursor.execute(command, (flag_id, event_id, driver_id))
        db_connection.commit()

        # Připrav data pro WebSocket
        cursor.execute("SELECT * FROM flags WHERE id = %s;", (flag_id,))
        flag_info = cursor.fetchone()
        flag_data = {
            "flag_id": flag_id,
            "event_id": event_id,
            "driver_id": driver_id,
            "flag_name": flag_info["name"],
            "flag_note": flag_info["note"],
        }

        # Odeslání přes WebSocket
        if driver_id is None:
            await notify_all(event_id, flag_data)
        else:
            await notify_driver(driver_id, flag_data)

        return {"status": "success", "message": "Flag assigned successfully"}
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error assigning flag: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.websocket("/flags/{event_id}/{driver_id}")
async def websocket_flags(websocket: WebSocket, event_id: int, driver_id: int = None):
    """
    WebSocket pro zasílání vlajek konkrétnímu řidiči nebo všem účastníkům závodu.
    """
    await websocket.accept()

    # Přidání připojení podle driver_id nebo event_id
    if driver_id:
        if driver_id not in active_connections:
            active_connections[driver_id] = []
        active_connections[driver_id].append(websocket)
    else:
        if event_id not in active_connections:
            active_connections[event_id] = []
        active_connections[event_id].append(websocket)

    try:
        # Přijme pouze jednu zprávu a ukončí spojení
        message = await websocket.receive_text()
        print(f"Přijatá zpráva: {message}")
        await websocket.send_text(f"Odpověď: {message}")
    except WebSocketDisconnect:
        print(f"Odpojeno: event_id={event_id}, driver_id={driver_id}")
    finally:
        # Vyčištění připojení
        if driver_id:
            active_connections[driver_id].remove(websocket)
            if not active_connections[driver_id]:
                del active_connections[driver_id]
        else:
            active_connections[event_id].remove(websocket)
            if not active_connections[event_id]:
                del active_connections[event_id]

async def notify_driver(driver_id: int, flag_data: dict):
    """Odesílá vlajku konkrétnímu řidiči."""
    if driver_id in active_connections and active_connections[driver_id]:
        for connection in active_connections[driver_id]:
            await connection.send_json(flag_data)

async def notify_all(event_id: int, flag_data: dict):
    """Odesílá vlajku všem účastníkům závodu."""
    if event_id in active_connections and active_connections[event_id]:
        for connection in active_connections[event_id]:
            await connection.send_json(flag_data)
