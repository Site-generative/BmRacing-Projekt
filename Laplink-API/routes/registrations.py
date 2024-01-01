from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import GetAllEventRegistrations, DeleteResponseModel,PostResponseModel, EventRegistrationFillData, EventRegistrationResponseModel, EventRegistrationsResponseModel, GetAllEventRegistrationsWithIds
from response_models.commonTypes import RegisterDriverToEvent
import service.auth as auth
from decimal import Decimal

router = APIRouter()

@router.post("/event/register/driver", response_model=PostResponseModel)
async def register_driver_to_event(data: RegisterDriverToEvent, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Zaregistruje řidiče na závod v tabulce event_registration.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """INSERT INTO event_registration (driver_id, car_id, car_category_id, car_configuration_id, event_id) 
                     VALUES (%s, %s, %s, %s, %s);"""
        cursor.execute(command, (data.driver_id, data.car_id, data.car_category_id, data.car_configuration_id, data.event_id))
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Driver registered to event successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error registering driver: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event/registrations", response_model=List[EventRegistrationResponseModel])
async def get_event_registrations(event_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny registrace na závod podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM event_registration WHERE event_id = %s", (event_id,))
        event_registrations = cursor.fetchall()
        formatted_event_registrations = event_registrations
        return JSONResponse(content={"data": formatted_event_registrations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event registrations: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/registrations", response_model=List[GetAllEventRegistrations])
async def get_registrations(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny závodní registrace.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM event_registration")
        event_registrations = cursor.fetchall()
        return JSONResponse(content={"data": event_registrations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching registrations: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event-registrations/{event_id}", response_model=List[EventRegistrationsResponseModel])
async def get_event_registrations(event_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny registrace na závod podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT 
                er.id AS event_registration_id,
                d.name AS driver_name,
                d.surname AS driver_surname,
                c.maker AS car_maker,
                c.type AS car_type,
                er.car_configuration_id,
                cc.power_weight_ratio AS power_weight_ratio,
                cat.name AS category_name,
                SUM(cc.aero_upgrade + cc.excessive_chamber + cc.widebody + 
                    cc.street_legal_tires + cc.wide_tires + cc.seat + cc.seatbelt) * 1000 
                    AS excessive_modifications,
                CASE 
                    WHEN cc.id IS NOT NULL THEN 'ANO'
                    ELSE 'NE'
                END AS configuration_status
            FROM 
                event_registration er
            JOIN driver d ON er.driver_id = d.id
            JOIN car c ON er.car_id = c.id
            LEFT JOIN car_configuration cc ON er.car_configuration_id = cc.id
            LEFT JOIN car_category cat ON er.car_category_id = cat.id
            WHERE 
                er.event_id = %s
             group by er.id;
        """

        cursor.execute(query, (event_id,))
        event_registrations = cursor.fetchall()

        for reg in event_registrations:
            if isinstance(reg.get("power_weight_ratio"), Decimal):
                reg["power_weight_ratio"] = float(reg["power_weight_ratio"])
            if isinstance(reg.get("excessive_modifications"), Decimal):
                reg["excessive_modifications"] = float(reg["excessive_modifications"])

        return JSONResponse(content={"data": event_registrations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event registrations: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/event-registrations/{event_registration_id}", response_model=PostResponseModel)
async def update_event_registration(event_registration_id: int, event_registration_data: EventRegistrationFillData, api_key: APIKey = Depends(auth.get_api_key)):
    '''
    Aktualizuje registraci na závod podle jejího ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """UPDATE event_registration 
                     SET driver_id = %s, car_id = %s, car_category_id = %s, car_configuration_id = %s, event_id = %s, dnf = %s, finished = %s
                     WHERE id = %s;"""
        values = (
            event_registration_data.driver_id, event_registration_data.car_id,
            event_registration_data.car_category_id, event_registration_data.car_configuration_id,
            event_registration_data.event_id, event_registration_data.dnf, event_registration_data.finished, event_registration_id
        )

        cursor.execute(command, values)
        db_connection.commit()

        return JSONResponse(content={"status": "success", "message": "Event registration updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating registration: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/event-registration/{event_registration_id}", response_model=GetAllEventRegistrations)
async def get_event_registration(event_registration_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací registraci na závod podle jejího ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM event_registration WHERE id = %s", (event_registration_id,))
        event_registration = cursor.fetchone()

        if not event_registration:
            raise HTTPException(status_code=404, detail="Event registration not found.")

        return event_registration
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event registration: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/event-registrations/return_ids/{event_id}", response_model=List[GetAllEventRegistrationsWithIds])
async def get_event_registrations_with_ids(event_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny registrace na závod podle jeho ID.
    '''

    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("""SELECT * FROM event_registration WHERE event_id = %s""", (event_id,))
        event_registrations = cursor.fetchall()
        return event_registrations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event registrations: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/event-registration/{registration_id}", response_model=DeleteResponseModel)
async def delete_event_registration(registration_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor()

    try:
        command = "CALL DeleteEventRegistration(%s);"
        cursor.execute(command, (registration_id,))

        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Event registration deleted successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting event registration: {e}")
    finally:
        cursor.close()
        db_connection.close()