from typing import List

from click import command
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Depends, Body
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import get_db_connection, prioritized_get_db_connection
from passlib.hash import sha256_crypt
from response_models.response_models import DriverResponseModel, PostResponseModel, DriverRacesResponseModel, GroupedSeriesEventResponseModel, PostResponseReturnIdModel, DeleteResponseModel
from response_models.commonTypes import DriverRegistration, DriverUpdate, DriverEventStateModel
import service.auth as auth
import re

router = APIRouter()


@router.post("/create/driver", response_model=PostResponseReturnIdModel)
async def create_driver(data: DriverRegistration, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Zaregistruje řidiče do databáze.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor()

    try:
        hashed_password = sha256_crypt.hash(data.web_password)
        command = """insert into driver (name, surname, city, street, postcode, birth_date, phone, email, number, web_user, web_password, racebox_id) 
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"""
        values = (
            data.name, data.surname, data.city, data.street, data.postcode, data.birth_date, data.phone, data.email,
            data.number, data.web_user, hashed_password, None)

        cursor.execute(command, values)

        command = """SELECT id FROM driver WHERE web_user = %s order by id desc limit 1;"""
        cursor.execute(command, (data.web_user,))
        driver_id = cursor.fetchone()[0]
        if not driver_id:
            raise HTTPException(status_code=404, detail="Driver not found")

        db_connection.commit()

        return JSONResponse(content={"status": "success", "message": "Driver created successfully", "id": driver_id})
        # return JSONResponse(content={"status": "success", "message": "Driver created successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error while creating driver: " + str(e))
    finally:
        cursor.close()
        db_connection.close()


@router.get("/get/driver/{id}", response_model=DriverResponseModel)
async def get_driver(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí řidiče podle jeho ID.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT id, name, surname, city, street, postcode, birth_date, phone, email, number, web_user, racebox_id FROM driver WHERE id = %s;"""
        cursor.execute(command, (id,))
        result = cursor.fetchone()

        result['birth_date'] = result['birth_date'].strftime('%Y-%m-%d')

        if result:
            return JSONResponse(content={"data": result})
        else:
            raise HTTPException(status_code=404, detail="Driver not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/driver/app/{web_user}", response_model=DriverResponseModel)
async def get_driver(web_user: str, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí řidiče podle jeho ID.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT id, name, surname, city, street, postcode, birth_date, phone, email, number, web_user, racebox_id FROM driver WHERE web_user = %s;"""
        cursor.execute(command, (web_user,))
        result = cursor.fetchone()

        result['birth_date'] = result['birth_date'].strftime('%Y-%m-%d')

        if result:
            return result
        else:
            raise HTTPException(status_code=404, detail="Driver not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()


@router.get("/get/drivers", response_model=List[DriverResponseModel])
async def get_drivers(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí všechny řidiče.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """SELECT id, name, surname, city, street, postcode, birth_date, phone, email, number, web_user, racebox_id FROM driver""")
        drivers = cursor.fetchall()
        for birth_date in drivers:
            birth_date['birth_date'] = birth_date['birth_date'].strftime('%Y-%m-%d')
        return JSONResponse(content={"data": drivers})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drivers: {e}")
    finally:
        cursor.close()
        db_connection.close()


@router.get("/drivers/{web_user}/races", response_model=List[DriverRacesResponseModel])
async def get_races_for_driver(web_user: str, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací závody spojené s řidičem na základě jeho uživatelského jména.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT e.id, e.name, e.number_of_laps, e.date, e.location, e.event_phase_id, er.dnf, er.finished
            FROM event_registration er
            JOIN event e ON er.event_id = e.id
            JOIN driver d ON er.driver_id = d.id
            WHERE d.web_user = %s AND e.event_phase_id NOT IN (4, 5)
        """
        cursor.execute(query, (web_user,))
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="No races found for the driver")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"General error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/all/{web_user}/races", response_model=List[DriverRacesResponseModel])
async def get_all_races_for_driver(web_user: str, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací závody spojené s řidičem na základě jeho uživatelského jména.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT e.id, e.name, e.number_of_laps, e.date, e.location, e.event_phase_id, er.dnf, er.finished
            FROM event_registration er
            JOIN event e ON er.event_id = e.id
            JOIN driver d ON er.driver_id = d.id
            WHERE d.web_user = %s AND e.event_phase_id NOT IN (4)
        """
        cursor.execute(query, (web_user,))
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="No races found for the driver")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"General error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/grouped/series/events", response_model=List[GroupedSeriesEventResponseModel])
async def get_grouped_series_events(api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """
            SELECT 
                s.id as series_id, s.name as series_name, s.year, 
                e.id as event_id, e.name as event_name, e.date, e.location
            FROM series s
            JOIN event e ON s.id = e.series_id
            GROUP BY s.id, e.id
            ORDER BY s.id DESC, e.date DESC;
        """
        cursor.execute(command)
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="No events found for the series")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching events: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/grouped/series/events/driver", response_model=List[GroupedSeriesEventResponseModel])
async def get_grouped_series_events_event(
    web_user: str,
    api_key: APIKey = Depends(auth.get_api_key)
):
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """
            SELECT 
                s.id AS series_id,
                s.name AS series_name,
                s.year,
                e.id AS event_id,
                e.name AS event_name,
                e.date,
                e.location
            FROM series s
            JOIN event e
                ON s.id = e.series_id
            JOIN event_registration er
                ON er.event_id = e.id
            JOIN driver d
                ON d.id = er.driver_id
            WHERE d.web_user = %s
            GROUP BY s.id, e.id
            ORDER BY s.id DESC, e.date DESC;
        """
        cursor.execute(command, (web_user,))
        result = cursor.fetchall()

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Žádné závody pro daného uživatele nebyly nalezeny."
            )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Nastala chyba při načítání: {e}"
        )
    finally:
        cursor.close()
        db_connection.close()


@router.get("/all/{web_user}/races/series", response_model=List[DriverRacesResponseModel])
async def get_all_races_for_driver_in_series(web_user: str, series_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací závody spojené s řidičem na základě jeho uživatelského jména.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT e.id, e.name, e.number_of_laps, e.date, e.location, e.event_phase_id, er.dnf, er.finished
            FROM event_registration er
            JOIN event e ON er.event_id = e.id
            JOIN driver d ON er.driver_id = d.id
            WHERE d.web_user = %s AND e.series_id = %s and e.event_phase_id NOT IN (4)
        """
        cursor.execute(query, (web_user, series_id))
        result = cursor.fetchall()

        if not result:
            raise HTTPException(status_code=404, detail="No races found for the driver")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"General error: {e}")
    finally:
        cursor.close()
        db_connection.close()


@router.put("/update/drivers/{driver_id}", response_model=PostResponseModel)
async def update_driver(driver_id: int, driver_data: DriverUpdate, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Aktualizuje řidiče podle jeho ID.
    '''
    db_connection = get_db_connection()
    cursor = db_connection.cursor()

    try:
        if driver_data.phone is not None:
            command = """
                UPDATE driver 
                SET name = %s, surname = %s, city = %s, street = %s, postcode = %s, 
                    birth_date = %s, phone = %s, email = %s, number = %s, racebox_id = %s
                WHERE id = %s
            """
            values = (
                driver_data.name, driver_data.surname, driver_data.city, driver_data.street, driver_data.postcode,
                driver_data.birth_date, driver_data.phone, driver_data.email, driver_data.number,
                driver_data.racebox_id,
                driver_id
            )
        else:
            command = """
                UPDATE driver 
                SET name = %s, surname = %s, city = %s, street = %s, postcode = %s, 
                    birth_date = %s, phone = null, email = %s, number = %s, racebox_id = %s
                WHERE id = %s
            """
            values = (
                driver_data.name, driver_data.surname, driver_data.city, driver_data.street, driver_data.postcode,
                driver_data.birth_date, driver_data.email, driver_data.number,
                driver_data.racebox_id,
                driver_id
            )

        cursor.execute(command, values)
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found or no changes made")

        return JSONResponse(content={"status": "success", "message": "Driver updated successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        db_connection.close()


@router.put("/event/driver/state/{web_user}", response_model=PostResponseModel)
async def set_driver_event_state(
        web_user: str,
        state: DriverEventStateModel = Body(...),
        api_key: APIKey = Depends(auth.get_api_key)
):
    event_id = state.event_id
    dnf = state.dnf
    finished = state.finished

    db_connection = get_db_connection()
    cursor = db_connection.cursor()

    try:
        cursor.execute(
            """
            UPDATE event_registration
            SET dnf = %s, finished = %s
            WHERE driver_id = (SELECT id FROM driver WHERE web_user = %s)
            AND event_id = %s
            """,
            (dnf, finished, web_user, event_id)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="No matching record found for the given web_user and event_id."
            )
        db_connection.commit()
        return {"status": "success", "message": "Změna stavu závodu pro uživatele byla úspěšná."}

    except ValueError as e:
        raise HTTPException(status_code=400, detail="Error while setting driver event state: " + str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/driver/{driver_id}", response_model=DeleteResponseModel)
async def delete_driver(driver_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor()

    try:
        command = "CALL DeleteDriver(%s);"
        cursor.execute(command, (driver_id,))

        db_connection.commit()

        return JSONResponse(content={"status": "success", "message": "Driver and all associated data deleted successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting driver: {e}")
    finally:
        cursor.close()
        db_connection.close()
