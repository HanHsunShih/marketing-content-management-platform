from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session
from app.models import Base

from app.internal.ai import AI, get_ai
from app.internal.data import DOCUMENT_1, DOCUMENT_2
from app.internal.db import SessionLocal, engine, get_db

import app.models as models
import app.schemas as schemas

import json

from datetime import datetime



@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    # Insert seed data
    with SessionLocal() as db:
        # **確認 DB 內沒有 document 時，才插入初始資料**
        if db.query(models.Document).count() == 0:
            db.execute(insert(models.Document).values(id=1, content=DOCUMENT_1))
            db.execute(insert(models.Document).values(id=2, content=DOCUMENT_2))
            db.commit()
    yield


app = FastAPI(lifespan=lifespan)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/document/{document_id}")
def get_document(
    document_id: int, db: Session = Depends(get_db)
) -> schemas.DocumentRead:
    """Get a document from the database"""
    document = db.scalar(select(models.Document).where(models.Document.id == document_id))
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@app.post("/save/{document_id}")
def save_document(
    document_id: int, document: schemas.DocumentBase, db: Session = Depends(get_db)
):
    """Save the document to the database"""
    db.execute(
        update(models.Document)
        .where(models.Document.id == document_id)
        .values(content=document.content)
    )
    db.commit()
    return {"document_id": document_id, "content": document.content}

@app.post("/document/{document_id}/versions")
def create_version(document_id: int, request_content: dict = Body(...), db: Session = Depends(get_db)):

    new_content = request_content.get("content")
    print("Received new content:", new_content)  

    new_version = models.Version(
        patent_parent=document_id,  
        content=new_content,  
    )

    db.add(new_version)
    db.commit()
    db.refresh(new_version)

    formatted_created_at = new_version.created_at.strftime("%Y-%m-%d %H:%M")

    return {
        "message": "New version created",
        "version_id": new_version.id,
        "created_at": formatted_created_at
    }

@app.post("/save/{document_id}/version/{version_id}")
def save_version(
    document_id: int,
    version_id: int,  
    document: schemas.DocumentBase, 
    db: Session = Depends(get_db)
):
    """Save the version to the database"""
    db.execute(
        update(models.Version)
        .where(models.Version.id == version_id)
        .values(content=document.content)
    )
    db.commit()
    return {"version_id": version_id, "content": document.content}

@app.get("/document/{document_id}/versions")
def get_all_versions_by_id(document_id: int, db: Session = Depends(get_db)):
    """Get all versions of the document via document id"""

    versions = (
    db.query(models.Version.id, models.Version.created_at, models.Version.patent_parent)
    .filter(models.Version.patent_parent == document_id)
    .order_by(models.Version.created_at)
    .all()
)
    version_list = [{"id": v.id, "created_at": v.created_at, "patent_parent": v.patent_parent} for v in versions]
    print(version_list)

    return {"document_id": document_id, "versions": version_list}

@app.get("/all-versions/")
def get_all_versions(db: Session = Depends(get_db)):
    """Get all versions of the document"""

    versions = (
        db.query(models.Version.id, models.Version.created_at, models.Version.patent_parent)
        .order_by(models.Version.created_at)
        .all()
    )

    group_versions = {}  

    for v in versions:
        if v.patent_parent not in group_versions:  
            group_versions[v.patent_parent] = []
        group_versions[v.patent_parent].append({  
            "id": v.id,
            "created_at": v.created_at.strftime("%Y-%m-%d %H:%M"),
            "patent_parent": v.patent_parent
        })

    return group_versions

@app.get("/document/{document_id}/versions/{version_id}")
def get_version_content(document_id: int, version_id: int, db: Session = Depends(get_db)):
    """Get a specific version of a document"""

    version = db.query(models.Version).filter(models.Version.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Document not found")

    formatted_created_at = version.created_at.strftime("%Y-%m-%d %H:%M")

    return {
        "document_id": document_id,
        "version_id": version.id,
        "content": version.content,
        "created_at": formatted_created_at,
        "patent_parent": version.patent_parent,
        "id": version.id
    }


@app.delete("/document/{document_id}/versions/{version_id}")
def delete_version(document_id: int, version_id: int, db: Session = Depends(get_db)):

    version = db.query(models.Version).filter(models.Version.id == version_id).first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    db.delete(version)
    db.commit()

    return {"message": f"Version {version_id} deleted successfully"}



@app.websocket("/ws")
async def websocket(websocket: WebSocket, ai: AI = Depends(get_ai)):
    await websocket.accept()
    while True:
        try:
            """
            The AI doesn't expect to receive any HTML.
            You can call ai.review_document to receive suggestions from the LLM.
            Remember, the output from the LLM will not be deterministic,
            #  確認AI 吐回來的東西 空字串？expection? 就不能返回 
            so you may want to validate the output before sending it to the client.
            """
            document = await websocket.receive_text()

            ai_response = ""
            async for chunk in ai.review_document(document):
                if chunk:  
                    ai_response += chunk  

            try:
                suggestions = json.loads(ai_response)  
                await websocket.send_text(json.dumps(suggestions))  

               
                if "issues" in suggestions:  
                    await websocket.send_json({"issues": suggestions})


            except json.JSONDecodeError:
                print("Invalid JSON received, skipping this response.")

        except WebSocketDisconnect:
            break
        except Exception as e:
            print(f"Error occurred: {e}")
            continue

          

