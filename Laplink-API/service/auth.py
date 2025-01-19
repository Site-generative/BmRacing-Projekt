from fastapi.security.api_key import APIKeyHeader
from fastapi import Security, HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED
import os

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header is None:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Access token is missing")
    if api_key_header != os.getenv("API_KEY"):
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid API Key")
    return api_key_header