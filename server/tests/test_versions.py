from fastapi.testclient import TestClient
from app.__main__ import app

client = TestClient(app)


def test_create_new_version():
  document_id = 1

  # Act
  version_response = client.post(
    f"document/{document_id}/versions",
    json={"content": "This is a versioned copy"}
  )

  # Assert
  assert version_response.status_code == 200
  data = version_response.json()

  assert data["message"] == "New version created"
  assert "version_id" in data
  assert "created_at" in data
  assert isinstance(data["version_id"], int)
  assert isinstance(data["created_at"], str)

  print("test_create_new_version test passed")

def test_delete_version():
  # Arrange
  document_id = 1
  version_response = client.post(f"document/{document_id}/versions",
    json={"content": "This is a versioned copy"})
  assert version_response.status_code == 200

  # Act
  version_id = version_response.json()["version_id"]
  delete_response = client.delete(f"/document/{document_id}/versions/{version_id}")

  # Assert
  assert delete_response.status_code == 200
  assert delete_response.json()["message"] == f"Version {version_id} deleted successfully"
  get_response = client.get(f"/document/{document_id}/versions/{version_id}")
  assert get_response.status_code == 404

  print("test_delete_version test passed")

def test_get_specific_version():
  document_id = 1

  # Arrange
  version_response = client.post(f"/document/{document_id}/versions/",
    json={"content": "This is a new version"})
  assert version_response.status_code == 200

  # Act
  version_id = version_response.json()["version_id"]
  get_response = client.get(f"/document/{document_id}/versions/{version_id}")
  data = get_response.json()

  #Assert
  assert get_response.status_code == 200
  assert data["content"] == "This is a new version"
  assert "version_id" in data
  assert "patent_parent" in data
  assert "created_at" in data
  assert isinstance(data["version_id"], int)
  assert isinstance(data["patent_parent"], int)
  assert isinstance(data["created_at"], str)
  assert data["patent_parent"] == document_id

  print("test_get_specific_version test passed")
