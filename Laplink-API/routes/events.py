import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from db.connection import prioritized_get_db_connection
from response_models.response_models import RaceResponseModel, PostResponseModel, RaceDetailResponseModel, DeleteResponseModel
import service.auth as auth
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

router = APIRouter()

job_last_update = {}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

class EventUpdateRequest(BaseModel):
    name: str
    number_of_laps: int
    date: str
    location: str
    start_coordinates: str
    end_coordinates: str
    event_phase_id: int
    series_id: int

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
async def update_event(
    id: int,
    event_data: EventUpdateRequest,
    api_key: APIKey = Depends(auth.get_api_key)
):
    """
    Aktualizuje event v databázi podle jeho ID.
    Pokud se změní event_phase_id a nová hodnota je v aktivních závodních fázích (1,2,3),
    starý job se odstraní a vytvoří se nový, který volá update_interim_results.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor(dictionary=True)

    try:
        print("Id 1:", id)
        cursor.execute("SELECT event_phase_id FROM event WHERE id = %s", (id,))
        current_event = cursor.fetchone()
        if not current_event:
            raise HTTPException(status_code=404, detail="Závod nenalezen")
        old_phase_id = current_event["event_phase_id"]
        print("Id 2:", id)
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
                event_data.name, event_data.number_of_laps, event_data.date, event_data.location,
                event_data.start_coordinates, event_data.end_coordinates, None,
                event_data.event_phase_id, event_data.series_id, id
            )
            for x in values:
                print("Typ", x, ":", type(x))
            print(command, values)
            cursor.execute(command, values)

            print("Id 3:", id)
            db_connection.commit()
        except Exception as e:
            db_connection.rollback()
            raise HTTPException(status_code=533, detail=f"Error updating event -asfdjasdashd: {e}")

        if old_phase_id != event_data.event_phase_id:
            old_job_id = f"interim_results_event_{id}_phase_{old_phase_id}"
            if scheduler.get_job(old_job_id):
                scheduler.remove_job(old_job_id)
                logger.info(f"Odstraněn starý job: {old_job_id}")

            if event_data.event_phase_id in [1, 2, 3]:
                new_job_id = f"interim_results_event_{id}_phase_{event_data.event_phase_id}"
                if not scheduler.running:
                    scheduler.start()
                scheduler.add_job(
                    update_interim_results,
                    trigger=IntervalTrigger(seconds=15),
                    args=[id, event_data.event_phase_id],
                    id=new_job_id,
                    name=f"Interim results for event {id} phase {event_data.event_phase_id}",
                    replace_existing=True,
                )
                logger.info(f"Spuštěn nový job: {new_job_id}")
            else:
                logger.info(f"Job pro event_phase_id {event_data.event_phase_id} se nespouští, protože není aktivní závodní fází.")

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
        command = "Call DeleteEvent(%s);"
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

def update_interim_results(event_id: int, event_phase_id: int):
    """
    Aktualizuje průběžné výsledky a kontroluje, zda nedošlo k nečinnosti.
    Pokud se výsledky nezmění 1,5 hodiny, odstraní job a nastaví event do fáze 5.
    """
    job_id = f"interim_results_event_{event_id}_phase_{event_phase_id}"
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()
    try:
        cursor.callproc("UpdateActiveEventPhaseResults", (event_id, event_phase_id))
        db_connection.commit()

        rows_updated = cursor.rowcount
        logger.info(f"Interim results updated for event_id={event_id}, event_phase_id={event_phase_id}, rows_updated={rows_updated}")

        now = datetime.now()
        if rows_updated > 0:
            job_last_update[job_id] = now
        else:
            last_update = job_last_update.get(job_id, now)
            if now - last_update > timedelta(hours=1, minutes=30):
                if scheduler.get_job(job_id):
                    scheduler.remove_job(job_id)
                    logger.info(f"Job {job_id} removed due to 1.5 hours of inactivity")

                try:
                    upd_conn = prioritized_get_db_connection(priority="high")
                    upd_cursor = upd_conn.cursor()
                    upd_cursor.execute("UPDATE event SET event_phase_id = %s WHERE id = %s", (5, event_id))
                    upd_conn.commit()
                    logger.info(f"Event {event_id} switched to phase 5 due to inactivity in results update")
                except Exception as upd_e:
                    logger.error(f"Error updating event phase to 5 for event_id={event_id}: {upd_e}")
                finally:
                    upd_cursor.close()
                    upd_conn.close()
    except Exception as e:
        db_connection.rollback()
        logger.error(f"Error updating interim results for event_id={event_id}, event_phase_id={event_phase_id}: {e}")
    finally:
        cursor.close()
        db_connection.close()