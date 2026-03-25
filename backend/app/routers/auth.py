from fastapi import APIRouter, Depends

from app.auth import verify_token
from app.config import settings
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    valid = body.token == settings.AUTH_TOKEN
    message = "OK" if valid else "Invalid token"
    return LoginResponse(valid=valid, message=message)


@router.get("/verify", response_model=LoginResponse)
async def verify(_token: str = Depends(verify_token)) -> LoginResponse:
    return LoginResponse(valid=True, message="OK")
