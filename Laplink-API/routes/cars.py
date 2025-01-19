import decimal
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from decimal import Decimal

from db.connection import prioritized_get_db_connection
from response_models.response_models import CarResponseModel, CarConfigurationResponseModel, PostResponseModel, \
    PostResponseReturnIdModel, CarModel, PutResponseModel, CarConfiguration
from response_models.commonTypes import CreateCar, CreateCarConfiguration
import service.auth as auth
from utilities import formatting

router = APIRouter()

@router.post("/create/car", response_model=PostResponseReturnIdModel)
async def create_car(data: CreateCar, api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vytvoří nové auto.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """INSERT INTO car (maker, type, note, default_driver_id) VALUES (%s, %s, %s, %s);"""
        cursor.execute(command, (data.maker, data.type, data.note, data.default_driver_id))

        command = """SELECT LAST_INSERT_ID();"""
        cursor.execute(command)
        car_id = cursor.fetchone()[0]

        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Car created successfully", "car_id": car_id})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()

@router.post("/create/car/configuration", response_model=PostResponseReturnIdModel)
async def create_car_configuration(data: CreateCarConfiguration, api_key: APIKey = Depends(auth.get_api_key)):
    """
    Vytvoří konfiguraci auta.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        data.power_weight_ratio = Decimal(f"{data.power_weight_ratio:.3f}")

        command = """
            INSERT INTO car_configuration 
            (note, power, weight, power_weight_ratio, aero_upgrade, excessive_modifications, excessive_chamber, 
            liquid_leakage, rear_lights, safe, street_legal_tires, seat_seatbelt_cage, widebody, wide_tires) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(command, (
            data.note, data.power, data.weight, data.power_weight_ratio, data.aero_upgrade,
            data.excessive_modifications, data.excessive_chamber, data.liquid_leakage, data.rear_lights,
            data.safe, data.street_legal_tires, data.seat_seatbelt_cage, data.widebody, data.wide_tires
        ))

        command = """SELECT LAST_INSERT_ID();"""
        cursor.execute(command)
        car_configuration_id = cursor.fetchone()[0]

        db_connection.commit()
        return JSONResponse(content={
            "status": "success",
            "message": "Car configuration created successfully",
            "car_configuration_id": car_configuration_id
        })
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/car/configurations", response_model=List[CarConfigurationResponseModel])
async def get_car_configurations(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny konfigurace aut.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM car_configuration")
        car_configurations = cursor.fetchall()
        # Převod Decimal na float
        formatted_car_configurations = [
            {key: float(value) if isinstance(value, decimal.Decimal) else value for key, value in row.items()}
            for row in car_configurations
        ]
        return JSONResponse(content={"data": formatted_car_configurations})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching car configurations: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/car/configuration/{id}", response_model=CarConfigurationResponseModel)
async def get_car_configuration(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací konfiguraci auta podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM car_configuration WHERE id = %s", (id,))
        car_configuration = cursor.fetchone()
        if car_configuration:
            # Převod Decimal na float
            formatted_car_configuration = {key: float(value) if isinstance(value, decimal.Decimal) else value for key, value in car_configuration.items()}
            return JSONResponse(content={"data": formatted_car_configuration})
        else:
            raise HTTPException(status_code=404, detail="Car configuration not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching car configuration: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/cars", response_model=List[CarResponseModel])
async def get_cars(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechna auta.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM car")
        cars = cursor.fetchall()
        return JSONResponse(content={"data": cars})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cars: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/cars/{car_id}", response_model=CarResponseModel)
async def get_car(car_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací auto podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM car WHERE id = %s", (car_id,))
        car = cursor.fetchone()
        if not car:
            raise HTTPException(status_code=404, detail="Car not found")
        return JSONResponse(content={"data": car})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching car: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/cars/{car_id}", response_model=PutResponseModel)
async def update_car(car_id: int, car_data: CarModel, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Aktualizuje auto podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """UPDATE car 
                     SET maker = %s, type = %s, note = %s, default_driver_id = %s
                     WHERE id = %s
                  """
        cursor.execute(command, (car_data.maker, car_data.type, car_data.note, car_data.default_driver_id, car_id))
        db_connection.commit()

        return {"status": "success", "message": "Car updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/car-configurations/{car_configuration_id}", response_model=PostResponseModel)
async def update_car_configuration(car_configuration_id: int, car_configuration_data: CarConfiguration, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Aktualizuje konfiguraci auta podle jejího ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """UPDATE car_configuration 
                     set note = %s, power = %s, weight = %s, power_weight_ratio = %s, aero_upgrade = %s, excessive_modifications = %s, excessive_chamber = %s, liquid_leakage = %s, rear_lights = %s, safe = %s, street_legal_tires = %s, seat_seatbelt_cage = %s, widebody = %s, wide_tires = %s where id = %s"""
        values=(car_configuration_data.note, car_configuration_data.power, car_configuration_data.weight, car_configuration_data.power_weight_ratio, car_configuration_data.aero_upgrade, car_configuration_data.excessive_modifications, car_configuration_data.excessive_chamber, car_configuration_data.liquid_leakage, car_configuration_data.rear_lights, car_configuration_data.safe, car_configuration_data.street_legal_tires, car_configuration_data.seat_seatbelt_cage, car_configuration_data.widebody, car_configuration_data.wide_tires, car_configuration_id)
        cursor.execute(command, values)
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Car configuration not found or no changes made")

        return JSONResponse(content={"status": "success", "message": "Car configuration updated successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()
