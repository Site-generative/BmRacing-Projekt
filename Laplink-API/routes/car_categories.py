from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import PostResponseModel, CarCategoryResponseModel
from response_models.commonTypes import CreateCarCategory, CarCategory
import service.auth as auth

router = APIRouter()

@router.post("/create/car/category", response_model=PostResponseModel)
async def create_car_category(data: CreateCarCategory, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vytvoří novou kategorii aut.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """INSERT INTO car_category (name, description) VALUES (%s, %s);"""
        cursor.execute(command, (data.name, data.description))
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Car category created successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/car/categories", response_model=List[CarCategoryResponseModel])
async def get_car_categories(api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vrátí všechny kategorie aut.
    """
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM car_category;")
        result = cursor.fetchall()

        return JSONResponse(content={"data": result})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/car/category/{id}", response_model=PostResponseModel)
async def update_car_category(id: int, data: CarCategory, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Aktualizuje kategorii aut podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """UPDATE car_category SET name = %s, description = %s WHERE id = %s;"""
        cursor.execute(command, (data.name, data.description, id))
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Car category updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/car-categories/{car_category_id}", response_model=CarCategoryResponseModel)
async def get_car_category(car_category_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vrátí kategorii auta podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM car_category WHERE id = %s", (car_category_id,))
        car_category = cursor.fetchone()

        if not car_category:
            raise HTTPException(status_code=404, detail="Car category not found")

        return car_category
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        db_connection.close()
