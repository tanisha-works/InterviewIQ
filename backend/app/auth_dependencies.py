from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuthSession, User
from app.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    user: User
    session: AuthSession


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def get_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> AuthContext:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise _unauthorized()
    claims = decode_access_token(credentials.credentials)
    if not claims:
        raise _unauthorized()
    try:
        user_id = int(claims["sub"])
        session_id = int(claims["sid"])
    except (TypeError, ValueError):
        raise _unauthorized()

    auth_session = db.get(AuthSession, session_id)
    now = datetime.now(timezone.utc)
    if (
        not auth_session
        or auth_session.user_id != user_id
        or auth_session.revoked_at is not None
        or _as_utc(auth_session.expires_at) <= now
    ):
        raise _unauthorized()
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise _unauthorized()
    return AuthContext(user=user, session=auth_session)