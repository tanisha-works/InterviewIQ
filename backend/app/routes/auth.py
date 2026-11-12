import hmac

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_dependencies import AuthContext, get_auth_context
from app.config import settings
from app.database import get_db
from app.schemas import AuthTokenOut, LoginIn, SignupIn, UserOut
from app.services.auth_service import (
    authenticate_user,
    create_auth_session,
    create_user,
    revoke_refresh_session,
    rotate_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "interviewiq_refresh"
CSRF_COOKIE = "interviewiq_csrf"


def _validate_origin(request: Request) -> None:
    allowed = {origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()}
    if request.headers.get("origin") not in allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Request origin is not allowed.")


def _set_auth_cookies(response: Response, refresh_token: str, csrf_token: str) -> None:
    max_age = settings.refresh_token_days * 24 * 60 * 60
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path=settings.auth_cookie_path,
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path=settings.auth_cookie_path, secure=settings.auth_cookie_secure, httponly=True,
                          samesite=settings.auth_cookie_samesite)
    response.delete_cookie(CSRF_COOKIE, path="/", secure=settings.auth_cookie_secure,
                          httponly=False, samesite=settings.auth_cookie_samesite)


def _token_response(response: Response, user, session, refresh_token: str, csrf_token: str, access_token: str):
    _set_auth_cookies(response, refresh_token, csrf_token)
    return AuthTokenOut(access_token=access_token, user=user)


@router.post("/signup", response_model=AuthTokenOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupIn, request: Request, response: Response, db: Session = Depends(get_db)):
    _validate_origin(request)
    try:
        user = create_user(db, payload.name, str(payload.email), payload.password)
        session, refresh_token, csrf_token, access_token = create_auth_session(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    return _token_response(response, user, session, refresh_token, csrf_token, access_token)


@router.post("/login", response_model=AuthTokenOut)
def login(payload: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    _validate_origin(request)
    user = authenticate_user(db, str(payload.email), payload.password)
    session, refresh_token, csrf_token, access_token = create_auth_session(db, user)
    return _token_response(response, user, session, refresh_token, csrf_token, access_token)


@router.post("/refresh", response_model=AuthTokenOut)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    _validate_origin(request)
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    csrf_cookie = request.cookies.get(CSRF_COOKIE)
    csrf_header = request.headers.get("X-CSRF-Token")
    if not refresh_token or not csrf_cookie or not csrf_header:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh session is invalid or expired.")
    if not hmac.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF validation failed.")
    user, session, next_refresh, next_csrf, access_token = rotate_refresh_token(db, refresh_token, csrf_header)
    return _token_response(response, user, session, next_refresh, next_csrf, access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    _validate_origin(request)
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    csrf_cookie = request.cookies.get(CSRF_COOKIE)
    csrf_header = request.headers.get("X-CSRF-Token")
    if not refresh_token or not csrf_cookie or not csrf_header or not hmac.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF validation failed.")
    if not revoke_refresh_session(db, refresh_token, csrf_header):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh session is invalid or expired.")
    _clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(context: AuthContext = Depends(get_auth_context)):
    return context.user