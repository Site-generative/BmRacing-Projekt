from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security.api_key import APIKey
from passlib.hash import sha256_crypt

from db.connection import prioritized_get_db_connection
from response_models.response_models import WebLoginResponseModel, WebRegisterResponseModel, AppLoginResponseModel, \
    UserResponseModel, DeleteResponseModel, PostResponseModel, User
import service.auth as auth
from response_models.commonTypes import UserCreate, UserAuthenticate, AppUserAuthenticate

router = APIRouter()

@router.post("/register", response_model=WebRegisterResponseModel)
async def register_user(user: UserCreate, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Zaregistruje nového uživatele do databáze.
    '''
    hashed_password = sha256_crypt.hash(user.password)

    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()
    try:
        cursor.execute("""INSERT INTO users (username, password) VALUES (%s, %s)""", (user.username, hashed_password))
        db_connection.commit()
        return {"message": "User registered successfully"}
    except Exception as err:
        db_connection.rollback()
        raise HTTPException(status_code=400, detail=f"Error registering user: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/login", response_model=WebLoginResponseModel)
async def authenticate_user(user: UserAuthenticate, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Autentizuje uživatele podle jména a hesla.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor()
    try:
        cursor.execute("""SELECT password FROM users WHERE username = %s""", (user.username,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        stored_password = result[0]

        if not sha256_crypt.verify(user.password, stored_password):
            raise HTTPException(status_code=400, detail="Invalid username or password")

        return {"message": "Authentication successful"}
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Error authenticating user: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.post("/app/login", response_model=AppLoginResponseModel)
async def authenticate_app_user(user: AppUserAuthenticate, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Endpoint pro authentifikaci uživatele v aplikaci.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor()
    try:
        cursor.execute("""SELECT web_password FROM driver WHERE web_user = %s""", (user.web_user,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        stored_password = result[0]

        if not sha256_crypt.verify(user.web_password, stored_password):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        return {"message": "Authentication successful"}
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Error authenticating app user: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/users", response_model=List[UserResponseModel])
async def get_all_users(api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací všechny uživatele.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        cursor.execute("""SELECT * FROM users""")
        users = cursor.fetchall()

        if not users:
            raise HTTPException(status_code=404, detail="No users found")
        print(users)
        return users
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.get("/get/users/{user_id}", response_model=UserResponseModel)
async def get_user(user_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Vrací uživatele podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="low")
    cursor = db_connection.cursor(dictionary=True)
    try:
        cursor.execute("""SELECT * FROM users WHERE id = %s""", (user_id,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/update/users/{user_id}", response_model=PostResponseModel)
async def update_user(user_id: int, user_data: User, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Aktualizuje uživatele podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    hashed_password = sha256_crypt.hash(user_data.password)
    try:
        command = """
            UPDATE users 
           set username = %s, password = %s
            WHERE id = %s
        """
        values = (
            user_data.username, hashed_password, user_id
        )

        cursor.execute(command, values)
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found or no changes made")

        return {"status": "User updated successfully", "message": f"User with ID {user_id} updated"}
    except Exception as err:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.delete("/delete/users/{user_id}", response_model=DeleteResponseModel)
async def delete_user(user_id: int, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Smaže uživatele podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()
    try:
        cursor.execute("""DELETE FROM users WHERE id = %s""", (user_id,))
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"status": "User deleted successfully", "message": f"User with ID {user_id} deleted"}
    except Exception as err:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {err}")
    finally:
        cursor.close()
        db_connection.close()

@router.put("/change/driver/password/", response_model=PostResponseModel)
async def change_driver_password(driver_id: int, password: str, api_key: APIKey = Depends(auth.get_api_key)):
    '''
        Změní heslo uživatele podle jeho ID.
    '''
    db_connection = prioritized_get_db_connection(priority="high")
    cursor = db_connection.cursor()

    hashed_password = sha256_crypt.hash(password)
    try:
        command = """
            UPDATE driver
            SET web_password = %s
            WHERE id = %s
        """
        values = (
            hashed_password, driver_id
        )

        cursor.execute(command, values)
        db_connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found or no changes made")

        return {"status": "Password changed successfully", "message": f"Driver with ID {driver_id} password changed"}
    except Exception as err:
        db_connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error changing driver password: {err}")
    finally:
        cursor.close()
        db_connection.close()