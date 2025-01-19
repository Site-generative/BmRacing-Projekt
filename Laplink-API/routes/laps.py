from typing import List
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import PostResponseModel, EventResultResponseModel, EventDriverEventResultsResponseModel
from response_models.commonTypes import PostLapData
import service.auth as auth
import re

router = APIRouter()

def validate_time(time_str: str) -> str:
    # Regex pro validaci formátu HH:MM:SS.mmm
    time_pattern = re.compile(r'^\d{2}:\d{2}:\d{2}\.\d{3}$')
    if not time_pattern.match(time_str):
        raise ValueError("Invalid time format. Expected format is HH:MM:SS.mmm")
    return time_str

@router.post("/event/lap/data", response_model=PostResponseModel)
async def post_lap_data(data: PostLapData, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Uloží data o kole.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()
    try:
        command = """CALL InsertLapTime(%s, %s, %s, %s);"""
        values = (data.web_user, int(data.event_id), validate_time(data.laptime), int(data.event_phase_id))
        cursor.execute(command, values)
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Lap data saved successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error saving lap data: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event/results", response_model=List[EventResultResponseModel])
async def get_event_results(event_id: int, event_phase_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrcí výsledky celého závodu se všemi kategoriemi, seřazené podle car_category.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command ="""SELECT 
            reg.car_category_id, 
            cc.name AS category_name, 
            er.id AS result_id, 
            er.event_phase_id, 
            er.event_registration_id, 
            er.total_time, 
            er.points, 
            er.position, 
            reg.dnf, 
            drv.name AS driver_name, 
            drv.surname AS driver_surname, 
            drv.email AS driver_email,
            drv.number, 
            ep.phase_name
        FROM 
            event_result er
        INNER JOIN 
            event_registration reg ON er.event_registration_id = reg.id
        INNER JOIN 
            car_category cc ON reg.car_category_id = cc.id
        INNER JOIN 
            driver drv ON reg.driver_id = drv.id
        INNER JOIN 
            event_phase ep ON er.event_phase_id = ep.id
        WHERE 
            er.event_phase_id = %s 
            AND reg.event_id = %s
        ORDER BY 
            reg.car_category_id, 
            er.position;
"""
        values = (event_phase_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event/results/{event_phase_id}", response_model=List[EventResultResponseModel])
async def get_event_results_for_category(event_phase_id: int, event_id: int, car_category_id,api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command = """SELECT 
            er.id AS result_id,
            er.event_phase_id,
            er.event_registration_id,
            reg.car_category_id,
            cc.name AS category_name,
            er.total_time,
            er.points,
            er.position,
            reg.dnf,
            drv.name AS driver_name,
            drv.surname AS driver_surname,
            drv.email AS driver_email,
            drv.number, 
            ep.phase_name
            FROM 
            event_result er
            INNER JOIN 
                event_registration reg ON er.event_registration_id = reg.id
            INNER JOIN 
                car_category cc ON reg.car_category_id = cc.id
            INNER JOIN 
                driver drv ON reg.driver_id = drv.id
            INNER JOIN 
                event_phase ep ON er.event_phase_id = ep.id
            WHERE 
                er.event_phase_id = %s
                AND reg.car_category_id = %s
                AND reg.event_id = %s
            ORDER BY 
                er.position;
    """
        values = (event_phase_id, car_category_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/dnf/{event_id}", response_model=List[EventResultResponseModel])
async def get_dnf(event_id: int, event_phase_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        command = """
            SELECT er.id AS result_id, er.event_phase_id, er.event_registration_id, reg.car_category_id, 
            cc.name AS category_name, er.total_time, er.points, er.position, reg.dnf, 
            drv.name AS driver_name, drv.email AS driver_email, drv.number, ep.phase_name, 
            drv.surname AS driver_surname, drv.email AS driver_email FROM event_result er 
            INNER JOIN event_registration reg ON er.event_registration_id = reg.id 
            INNER JOIN car_category cc ON reg.car_category_id = cc.id 
            INNER JOIN driver drv ON reg.driver_id = drv.id 
            INNER JOIN event_phase ep ON er.event_phase_id = ep.id 
            WHERE er.event_phase_id = %s AND reg.event_id = %s AND reg.dnf = 1 
            ORDER BY reg.car_category_id, er.position;
        """
        values = (event_phase_id, event_id)
        cursor.execute(command, values)
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="Event results not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/event/phase/driver/results", response_model=List[EventDriverEventResultsResponseModel])
async def get_user_phase_results(
    web_user: str = Query(..., description="Web user of the driver", example="dominik"),
    event_id: int = Query(..., description="ID of the event", example=13),
    event_phase_id: int = Query(..., description="ID of the event phase", example=1),
    api_key: APIKey = Depends(auth.get_api_key)
):
    '''
    Vrátí výsledky závodu pro daného řidiče, fázi a závod.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """
        SELECT 
            el.id, 
            el.laptime AS time
        FROM event_lap el
        JOIN event_registration er ON el.event_registration_id = er.id
        JOIN driver d ON er.driver_id = d.id
        JOIN event e ON er.event_id = e.id
        WHERE d.web_user = %s 
          AND er.event_id = %s 
          AND el.event_phase_id = %s
        ORDER BY el.id;
        """
        values = (web_user, event_id, event_phase_id)
        cursor.execute(command, values)
        results = cursor.fetchall()

        if not results:
            return []

        # Transformace výsledků do odpovídajícího modelu s číslem kola
        return [EventDriverEventResultsResponseModel(lap=index + 1, time=result['time']) for index, result in enumerate(results)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()