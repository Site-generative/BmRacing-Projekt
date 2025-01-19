from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from fastapi.responses import JSONResponse
from db.connection import prioritized_get_db_connection
from response_models.response_models import PointsDefinitionResponseModel, PostResponseModel, PointsDefinition
import service.auth as auth

router = APIRouter()

@router.get("/get/points-definitions", response_model=List[PointsDefinitionResponseModel])
async def get_all_points_definitions(api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vrací všechny definice bodů.
    """
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM points_definition")
        points_definitions = cursor.fetchall()

        if not points_definitions:
            raise HTTPException(status_code=404, detail="No points definitions found")

        return JSONResponse(content={"data": points_definitions})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/points-definitions/{points_definition_id}", response_model=PointsDefinitionResponseModel)
async def get_points_definition(points_definition_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Vrací definici bodů podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM points_definition WHERE id = %s", (points_definition_id,))
        points_definition = cursor.fetchone()

        if not points_definition:
            raise HTTPException(status_code=404, detail="Points definition not found")

        return JSONResponse(content={"data": points_definition})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/points-definitions/{points_definition_id}", response_model=PostResponseModel)
async def update_points_definition(points_definition_id: int, points_definition_data: PointsDefinition, api_key: APIKey = Depends(auth.get_api_key)):
    """
        Aktualizuje definici bodů podle jejího ID.
    """
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    try:
        command = """
            UPDATE points_definition 
            SET position = %s, points = %s
            WHERE id = %s;
        """
        cursor.execute(command, (
            points_definition_data.position, points_definition_data.points, points_definition_id
        ))

        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Points definition not found or no changes made")

        return JSONResponse(content={"status": "success", "message": "Points definition updated successfully"})
    except Exception as e:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        db_connection.close()
