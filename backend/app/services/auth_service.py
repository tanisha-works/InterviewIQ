import hmac
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AuthRefreshToken, AuthSession, User
from app.security import (
    create_access_token,
    generate_opaque_token,
    hash_password,
    token_digest,
    verify_password,
)


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _invalid_credentials() -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")


def create_user(db: Session, name: str, email: str, password: str) -> User:
    user = User(name=name.strip(), email=email.strip().lower(), password_hash=hash_password(password))
    db.add(user)
    db.flush()
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user or not user.is_active or not verify_password(password, user.password_hash):
        raise _invalid_credentials()
    return user


def create_auth_session(db: Session, user: User) -> tuple[AuthSession, str, str, str]:
    refresh_token = generate_opaque_token()
    csrf_token = generate_opaque_token()
    now = datetime.now(timezone.utc)
    auth_session = AuthSession(
        user_id=user.id,
        refresh_token_hash=token_digest(refresh_token),
        csrf_token_hash=token_digest(csrf_token),
        expires_at=now + timedelta(days=settings.refresh_token_days),
        created_at=now,
    )
    db.add(auth_session)
    db.flush()
    db.add(
        AuthRefreshToken(
            session_id=auth_session.id,
            token_hash=auth_session.refresh_token_hash,
            csrf_token_hash=auth_session.csrf_token_hash,
            created_at=now,
        )
    )
    db.commit()
    db.refresh(auth_session)
    return auth_session, refresh_token, csrf_token, create_access_token(user.id, auth_session.id)


def rotate_refresh_token(
    db: Session, refresh_token: str, csrf_token: str
) -> tuple[User, AuthSession, str, str, str]:
    token_hash = token_digest(refresh_token)
    record = db.query(AuthRefreshToken).filter(AuthRefreshToken.token_hash == token_hash).first()
    if not record or not hmac.compare_digest(record.csrf_token_hash, token_digest(csrf_token)):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh session is invalid or expired.")

    auth_session = db.get(AuthSession, record.session_id)
    now = datetime.now(timezone.utc)
    if not auth_session:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh session is invalid or expired.")
    if record.consumed_at is not None:
        if auth_session.revoked_at is None:
            auth_session.revoked_at = now
            db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token reuse detected; session revoked.")
    if (
        auth_session.revoked_at is not None
        or _as_utc(auth_session.expires_at) <= now
        or not hmac.compare_digest(auth_session.refresh_token_hash, token_hash)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh session is invalid or expired.")

    consumed = db.execute(
        update(AuthRefreshToken)
        .where(AuthRefreshToken.id == record.id, AuthRefreshToken.consumed_at.is_(None))
        .values(consumed_at=now)
    )
    if consumed.rowcount != 1:
        auth_session.revoked_at = now
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token reuse detected; session revoked.")

    next_refresh = generate_opaque_token()
    next_csrf = generate_opaque_token()
    next_hash = token_digest(next_refresh)
    next_csrf_hash = token_digest(next_csrf)
    auth_session.refresh_token_hash = next_hash
    auth_session.csrf_token_hash = next_csrf_hash
    auth_session.last_used_at = now
    db.add(
        AuthRefreshToken(
            session_id=auth_session.id,
            token_hash=next_hash,
            csrf_token_hash=next_csrf_hash,
            created_at=now,
        )
    )
    db.commit()
    user = db.get(User, auth_session.user_id)
    if not user or not user.is_active:
        auth_session.revoked_at = now
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh session is invalid or expired.")
    db.refresh(auth_session)
    return user, auth_session, next_refresh, next_csrf, create_access_token(user.id, auth_session.id)


def revoke_refresh_session(db: Session, refresh_token: str, csrf_token: str) -> bool:
    record = db.query(AuthRefreshToken).filter(AuthRefreshToken.token_hash == token_digest(refresh_token)).first()
    if not record or not hmac.compare_digest(record.csrf_token_hash, token_digest(csrf_token)):
        return False
    auth_session = db.get(AuthSession, record.session_id)
    if not auth_session:
        return False
    if auth_session.revoked_at is None:
        auth_session.revoked_at = datetime.now(timezone.utc)
        db.commit()
    return True