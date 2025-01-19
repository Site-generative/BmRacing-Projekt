import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import RaceResponseModel, PostResponseModel, RaceDetailResponseModel, DeleteResponseModel
from utilities import formatting
import service.auth as auth

router = APIRouter()

@router.get("/get/get-all-races", response_model=List[RaceResponseModel])
async def all_races(api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vrátí všechny závody.
    """
    try:
        db_connection = prioritized_get_db_connection(priority="low")
        cursor = db_connection.cursor(dictionary=True)

        command = """
            SELECT e.id, e.name, e.number_of_laps, e.date, e.location, e.start_coordinates, e.end_coordinates, e.image, ep.phase_name, s.name as series_name
            FROM event_phase ep
            JOIN event e ON e.event_phase_id = ep.id
            JOIN series s ON e.series_id = s.id
            ORDER BY date DESC;
        """
        cursor.execute(command)
        races = cursor.fetchall()

        # Převod date na řetězec
        for race in races:
            if race['date']:
                race['date'] = race['date'].strftime('%Y-%m-%d')

        return JSONResponse(content={"data": races})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching races: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event/detail/{id}/", response_model=RaceDetailResponseModel)
async def get_event_detail(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací detail závodu podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """
            SELECT e.id, e.name, e.number_of_laps, e.date, e.location, e.start_coordinates, e.end_coordinates, e.image, e.event_phase_id, e.series_id
            FROM event e
            WHERE e.id = %s;
        """
        cursor.execute(command, (id,))
        race = cursor.fetchone()

        if not race:
            raise HTTPException(status_code=404, detail="Závod nenalezen")

        # Převod date na řetězec
        if race['date']:
            race['date'] = race['date'].strftime('%Y-%m-%d')
        return JSONResponse(content={"data": race})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event detail: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/create/event", response_model=PostResponseModel)
async def create_event(
        name: str = Form(...),
        number_of_laps: int = Form(...),
        date: str = Form(...),
        location: str = Form(...),
        start_coordinates: str = Form(...),
        end_coordinates: str = Form(...),
        image: UploadFile = File(None),
        event_phase_id: int = Form(...),
        series_id: int = Form(...),
        api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vytvoří nový závod.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """INSERT INTO event
                    (name, number_of_laps, date, location, start_coordinates, end_coordinates, image, event_phase_id, series_id) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);"""
        values = (
            name, number_of_laps, date, location, start_coordinates, end_coordinates, None, event_phase_id, series_id
        )

        cursor.execute(command, values)
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Event created successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating event: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/event/{id}", response_model=PostResponseModel)
async def update_event(id: int,
                       name: str = Form(...),
                       number_of_laps: int = Form(...),
                       date: str = Form(...),
                       location: str = Form(...),
                       start_coordinates: str = Form(...),
                       end_coordinates: str = Form(...),
                       image: UploadFile = File(None),
                       event_phase_id: int = Form(...),
                       series_id: int = Form(...),
                       api_key: APIKey = Depends(auth.get_api_key)):
    """
    Aktualizuje závod v databázi podle jeho ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """
            UPDATE event
            SET name = %s,
                number_of_laps = %s,
                date = %s,
                location = %s,
                start_coordinates = %s,
                end_coordinates = %s,
                image = %s,
                event_phase_id = %s,
                series_id = %s
            WHERE id = %s;
        """
        values = (
            name, number_of_laps, date, location, start_coordinates, end_coordinates, None, event_phase_id, series_id, id
        )

        cursor.execute(command, values)
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Event updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating event: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/event/{id}", response_model=DeleteResponseModel)
async def delete_event(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
    Smaže závod podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = "DELETE FROM event WHERE id = %s;"
        cursor.execute(command, (id,))

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")

        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Event deleted successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting event: {e}")
    finally:
        cursor.close()
        db_connection.close()
