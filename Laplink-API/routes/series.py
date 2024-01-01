from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import SeriesResponseModel, PostResponseModel, DeleteResponseModel
from response_models.commonTypes import CreateSeries, UpdateSerie
import service.auth as auth

router = APIRouter()

@router.post("/create/series", response_model=PostResponseModel)
async def create_series(
        data: CreateSeries,
        api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vytvoří novou sérii.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()
    try:
        convert_year = int(data.year)
        command = """INSERT INTO series (name, year) VALUES (%s, %s);"""
        values = (data.name, convert_year)
        cursor.execute(command, values)
        db_connection.commit()
        return JSONResponse(content={"status": "success", "message": "Series created successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating series: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/series/{id}", response_model=DeleteResponseModel)
async def delete_series(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        cursor.execute("""CALL DeleteSeries(%s)""", (id,))
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Series not found")

        return JSONResponse(content={"status": "success", "message": "Series and related events deleted successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting series: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/series/{id}", response_model=PostResponseModel)
async def update_series(id: int, data: UpdateSerie, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Aktualizuje sérii podle jejího ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """UPDATE series SET name = %s, year = %s WHERE id = %s;"""
        values = (data.name, data.year, id)
        cursor.execute(command, values)
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Series not found or no changes made")

        return JSONResponse(content={"status": "success", "message": "Series updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating series: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/series", response_model=List[SeriesResponseModel])
async def get_series(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí všechny série.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM series")
        series = cursor.fetchall()
        return JSONResponse(content={"data": series})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching series: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/series/{id}", response_model=SeriesResponseModel)
async def get_series(id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrátí sérii podle jejího ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM series WHERE id = %s", (id,))
        series = cursor.fetchone()

        if not series:
            raise HTTPException(status_code=404, detail="Series not found")

        return JSONResponse(content={"data": series})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching series: {e}")
    finally:
        cursor.close()
        db_connection.close()
