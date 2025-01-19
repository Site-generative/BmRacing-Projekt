from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import RaceboxResponseModel, DeleteResponseModel, PostResponseModel
import service.auth as auth

router = APIRouter()

@router.get("/get/raceboxes", response_model=List[RaceboxResponseModel])
async def get_all_raceboxes(api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vrací všechny raceboxy.
    """
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM racebox")
        raceboxes = cursor.fetchall()

        if not raceboxes:
            raise HTTPException(status_code=404, detail="No raceboxes found")

        return JSONResponse(content={"data": raceboxes})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/raceboxes/{racebox_id}", response_model=RaceboxResponseModel)
async def get_racebox(racebox_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vrací racebox podle jeho ID.
    """
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM racebox WHERE id = %s", (racebox_id,))
        racebox = cursor.fetchone()

        if not racebox:
            raise HTTPException(status_code=404, detail="Racebox not found")

        return JSONResponse(content={"data": racebox})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/raceboxes/{racebox_id}", response_model=RaceboxResponseModel)
async def update_racebox(id: int, device_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Aktualizuje racebox podle jeho ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        cursor.execute("""
            UPDATE racebox 
            SET device_id = %s
            WHERE id = %s;
        """, (device_id ,id))

        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Racebox not found or no changes made")

        return JSONResponse(content={"status": "success", "message": "Racebox updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/raceboxes/{racebox_id}", response_model=DeleteResponseModel)
async def delete_racebox(racebox_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Smaže racebox podle jeho ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        cursor.execute("DELETE FROM racebox WHERE id = %s", (racebox_id,))
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Racebox not found")

        return JSONResponse(content={"status": "success", "message": "Racebox deleted successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/create/racebox", response_model=PostResponseModel)
async def add_racebox(device_id: str, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vytvoří nový racebox.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        cursor.execute("INSERT INTO racebox (device_id) VALUES (%s)", (device_id,))
        db_connection.commit()

        return JSONResponse(content={"status": "success", "message": "Racebox created successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()
