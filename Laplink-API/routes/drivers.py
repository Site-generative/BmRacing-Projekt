from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from passlib.hash import sha256_crypt
from db.connection import prioritized_get_db_connection
from utilities import formatting
from response_models.response_models import DriverResponseModel, PostResponseModel, DriverRacesResponseModel, PostResponseReturnIdModel
from response_models.commonTypes import DriverRegistration, DriverUpdate, DriverEventState
import service.auth as auth

router = APIRouter()

@router.post("/create/driver", response_model=PostResponseReturnIdModel)
async def create_driver(data: DriverRegistration, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Zaregistruje řidiče do databáze.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        hashed_password = sha256_crypt.hash(data.web_password)
        command = """INSERT INTO driver (name, surname, city, street, postcode, birth_date, phone, email, number, web_user, web_password, racebox_id) \
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"""
        values = (
            data.name, data.surname, data.city, data.street, data.postcode, data.birth_date, data.phone, data.email,
            data.number, data.web_user, hashed_password, None
        )

        cursor.execute(command, values)

        command = """SELECT LAST_INSERT_ID();"""
        cursor.execute(command)
        driver_id = cursor.fetchone()[0]

        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Driver created successfully", "id": driver_id})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error while creating driver: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/driver/{id}", response_model=DriverResponseModel)
async def get_driver(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí řidiče podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT id, name, surname, city, street, postcode, birth_date, phone, email, number, racebox_id FROM driver WHERE id = %s;"""
        cursor.execute(command, (id,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Driver not found")

        # Převod date na řetězec
        if result['birth_date']:
            result['birth_date'] = result['birth_date'].strftime('%Y-%m-%d')

        return JSONResponse(content={"data": result})
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
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """SELECT id, name, surname, city, street, postcode, birth_date, phone, email, number, racebox_id FROM driver;"""
        cursor.execute(command)
        drivers = cursor.fetchall()

        # Převod date na řetězec pro každého řidiče
        for driver in drivers:
            if driver['birth_date']:
                driver['birth_date'] = driver['birth_date'].strftime('%Y-%m-%d')

        return JSONResponse(content={"data": drivers})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drivers: {e}")
    finally:
        cursor.close()
        db_connection.close()
@router.get("/get/{web_user}", response_model=DriverResponseModel)
async def get_driver_web_user(web_user: str, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí řidiče podle jeho uživatelského jména.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        command = """Select id, name, surname, city, street, postcode, birth_date, phone, email, number, racebox_id FROM driver WHERE web_user = %s;"""
        values = (web_user,)
        cursor.execute(command, values)
        driver = cursor.fetchone()
        print(driver)
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

        # Převod date na řetězec pro každého řidiče
        if driver['birth_date']:
            driver['birth_date'] = driver['birth_date'].strftime('%Y-%m-%d')

        return driver
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
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        query = """
            SELECT e.id, e.name, e.number_of_laps, e.date, e.location, e.event_phase_id, er.dnf, er.finished
            FROM event_registration er
            JOIN event e ON er.event_id = e.id
            JOIN driver d ON er.driver_id = d.id
            WHERE d.web_user = %s AND e.event_phase_id NOT IN (4, 5);
        """
        cursor.execute(query, (web_user,))
        races = cursor.fetchall()

        if not races:
            raise HTTPException(status_code=404, detail="No races found for the driver")

        # Převod date na řetězec
        for race in races:
            if race['date']:
                race['date'] = race['date'].strftime('%Y-%m-%d')

        return JSONResponse(content={"data": races})
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
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """
            UPDATE driver 
            SET name = %s, surname = %s, city = %s, street = %s, postcode = %s, 
                birth_date = %s, phone = %s, email = %s, number = %s, racebox_id = %s
            WHERE id = %s;
        """
        values = (
            driver_data.name, driver_data.surname, driver_data.city, driver_data.street, driver_data.postcode,
            driver_data.birth_date, driver_data.phone, driver_data.email, driver_data.number, driver_data.racebox_id,
            driver_id
        )

        cursor.execute(command, values)
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found or no changes made")

        return JSONResponse(content={"status": "success", "message": "Driver updated successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/event/driver/state/{web_user}", response_model=PostResponseModel)
async def set_driver_event_state(
    web_user: str,
    race_data: DriverEventState,
    api_key: APIKey = Depends(auth.get_api_key)
):
    '''
    Po odjetí nebo diskvalifikaci závodu nastaví stav řidiče v db.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """
            UPDATE event_registration
            SET dnf = %s, finished = %s
            WHERE driver_id = (SELECT id FROM driver WHERE web_user = %s)
            AND event_id = %s;
        """
        cursor.execute(command, (race_data.dnf, race_data.finished, web_user, race_data.event_id))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="No matching record found for the given web_user and event_id."
            )

        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Driver event state updated successfully."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()