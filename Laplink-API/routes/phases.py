from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import PhaseNameResponseModel, EventPhaseResponseModel, PostResponseModel
from response_models.commonTypes import CreateEventPhase, UpdateEventPhase
import service.auth as auth

router = APIRouter()

@router.get("/get/phase_name/{id}", response_model=PhaseNameResponseModel)
async def get_phase_name(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací název fáze podle jejího ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT phase_name FROM event_phase WHERE id = %s;"""
        cursor.execute(command, (id,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Phase not found")

        return JSONResponse(content={"data": {"name": result["phase_name"]}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching phase name: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/phases/", response_model=List[EventPhaseResponseModel])
async def get_phases(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny fáze.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT * FROM event_phase;"""
        cursor.execute(command)
        result = cursor.fetchall()

        return JSONResponse(content={"data": result})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching phases: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event/phase/{id}", response_model=PhaseNameResponseModel)
async def get_event_phase(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací fázi závodu podle ID závodu.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT phase_name FROM event_phase WHERE id = (SELECT event_phase_id FROM event WHERE id = %s);"""
        cursor.execute(command, (id,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Event phase not found")

        return JSONResponse(content={"data": {"name": result["phase_name"]}})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching event phase: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/event/phase/{id}", response_model=PostResponseModel)
async def update_event_phase(data: UpdateEventPhase, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Aktualizuje fázi závodu podle ID závodu.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """UPDATE event SET event_phase_id = %s WHERE id = %s;"""
        cursor.execute(command, (data.phase_id, data.id))
        db_connection.commit()

        return JSONResponse(content={"status": "success", "message": "Event phase updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating event phase: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/create/event/phase", response_model=PostResponseModel)
async def create_event_phase(
        data: CreateEventPhase,
        api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vytvoří novou fázi závodu.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """INSERT INTO event_phase (phase_name, result_type) VALUES (%s, %s);"""
        cursor.execute(command, (data.phase_name, data.result_type))
        db_connection.commit()

        return JSONResponse(content={"status": "success", "message": "Event phase created successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating event phase: {e}")
    finally:
        cursor.close()
        db_connection.close()
