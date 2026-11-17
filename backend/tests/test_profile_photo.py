def test_profile_photo_upload_and_retrieval(auth_client):
    image = b"\x89PNG\r\n\x1a\n" + b"test-image-data"
    upload = auth_client.put(
        "/users/me/photo",
        files={"photo": ("profile.png", image, "image/png")},
    )
    assert upload.status_code == 204

    fetched = auth_client.get("/users/me/photo")
    assert fetched.status_code == 200
    assert fetched.headers["content-type"] == "image/png"
    assert fetched.headers["cache-control"] == "private, no-store"
    assert fetched.content == image


def test_profile_photo_rejects_non_images(auth_client):
    response = auth_client.put(
        "/users/me/photo",
        files={"photo": ("profile.svg", b"<svg></svg>", "image/svg+xml")},
    )
    assert response.status_code == 415


def test_profile_photo_rejects_oversized_upload(auth_client):
    response = auth_client.put(
        "/users/me/photo",
        files={"photo": ("profile.png", b"\x89PNG\r\n\x1a\n" + b"x" * (2 * 1024 * 1024), "image/png")},
    )
    assert response.status_code == 413


def test_missing_profile_photo_returns_no_content(auth_client):
    assert auth_client.get("/users/me/photo").status_code == 204


def test_profile_photo_requires_authentication(client):
    assert client.get("/users/me/photo").status_code == 401
