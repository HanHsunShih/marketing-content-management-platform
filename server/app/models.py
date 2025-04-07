from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = "document"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String, nullable=False)  
    created_at = Column(DateTime, default=datetime.utcnow)

class Version(Base):
    __tablename__ = "version"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patent_parent = Column(Integer, nullable=False)  
    content = Column(String, nullable=False)  
    created_at = Column(DateTime, default=datetime.utcnow)


# Include your models here, and they will automatically be created as tables in the database on start-up
