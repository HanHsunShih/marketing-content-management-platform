from app import models, schemas
from app.internal.db import SessionLocal  # 這裡改對了就好
from app.internal import data

def seed():
  db = SessionLocal()

  db.query(models.Version).delete()
  db.query(models.Document).delete()
  db.commit()

  patent1 = models.Document(id=1, content=data.DOCUMENT_1)
  patent2 = models.Document(id=2, content=data.DOCUMENT_2)

  db.add_all([patent1, patent2])
  db.commit()

  print("✅ Seed data inserted!")

if __name__ == "__main__":
  seed()
