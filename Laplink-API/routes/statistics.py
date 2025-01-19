from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from db.connection import prioritized_get_db_connection
from response_models.response_models import EventAverageRacePhaseResponseModel, \
    EventResultCategoryRacePhaseResponseModel
import service.auth as auth
import re

router = APIRouter()

@router.get("/get/event/phase/statistics/{event_id}", response_model=List[EventAverageRacePhaseResponseModel])
async def get_event_phase_average_statistics(event_id: int, event_phase_id: int,
                                             api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        if not event_id or not event_phase_id:
            raise HTTPException(status_code=400, detail="Invalid parameters: event_id or event_phase_id is missing")

        cursor.execute(f"""
            SELECT 
                COUNT(er.id) AS total_racers, 
                CONCAT(
                    TIME_FORMAT(SEC_TO_TIME(FLOOR(AVG(TIME_TO_SEC(er.total_time)))), '%H:%i:%s'), '.', 
                    LPAD(ROUND(MOD(AVG(TIME_TO_SEC(er.total_time)), 1), 3) * 1000, 3, '0')
                ) AS average_time, 
                CONCAT(
                    TIME_FORMAT(SEC_TO_TIME(FLOOR(MIN(TIME_TO_SEC(er.total_time)))), '%H:%i:%s'), '.', 
                    LPAD(ROUND(MOD(MIN(TIME_TO_SEC(er.total_time)), 1), 3) * 1000, 3, '0')
                ) AS fastest_time, 
                CONCAT(
                    TIME_FORMAT(SEC_TO_TIME(FLOOR(MAX(TIME_TO_SEC(er.total_time)))), '%H:%i:%s'), '.', 
                    LPAD(ROUND(MOD(MAX(TIME_TO_SEC(er.total_time)), 1), 3) * 1000, 3, '0')
                ) AS slowest_time
            FROM 
                event_result er 
            INNER JOIN 
                event_registration reg ON er.event_registration_id = reg.id 
            WHERE 
                er.event_phase_id = {event_phase_id} AND reg.event_id = {event_id}
        """)

        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="Event results not found")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event results: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/event/phase/statistics/categories/{event_id}", response_model=List[EventResultCategoryRacePhaseResponseModel])
async def get_event_phase_average_statistics(event_id: int, event_phase_id: int,
                                             api_key: APIKey = Depends(auth.api_key_header)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute(f"""
            SELECT 
                reg.car_category_id,
                cc.name AS category_name,
                COUNT(er.id) AS total_racers,
                CONCAT(
                    TIME_FORMAT(SEC_TO_TIME(FLOOR(AVG(TIME_TO_SEC(er.total_time)))), '%H:%i:%s'), '.',
                    LPAD(ROUND(MOD(AVG(TIME_TO_SEC(er.total_time)), 1), 3) * 1000, 3, '0')
                ) AS average_time,
                CONCAT(
                    TIME_FORMAT(SEC_TO_TIME(FLOOR(MIN(TIME_TO_SEC(er.total_time)))), '%H:%i:%s'), '.',
                    LPAD(ROUND(MOD(MIN(TIME_TO_SEC(er.total_time)), 1), 3) * 1000, 3, '0')
                ) AS fastest_time,
                CONCAT(
                    TIME_FORMAT(SEC_TO_TIME(FLOOR(MAX(TIME_TO_SEC(er.total_time)))), '%H:%i:%s'), '.',
                    LPAD(ROUND(MOD(MAX(TIME_TO_SEC(er.total_time)), 1), 3) * 1000, 3, '0')
                ) AS slowest_time,
                SUM(CASE WHEN reg.dnf = 1 THEN 1 ELSE 0 END) AS total_dnf
            FROM 
                event_result er
            INNER JOIN 
                event_registration reg ON er.event_registration_id = reg.id
            INNER JOIN 
                car_category cc ON reg.car_category_id = cc.id
            WHERE er.event_phase_id = {event_phase_id} AND reg.event_id = {event_id}
            GROUP BY 
                reg.car_category_id, cc.name
            ORDER BY 
                reg.car_category_id
        """)

        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="No result found for the driver")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"General error: {e}")
    finally:
        cursor.close()
        db_connection.close()