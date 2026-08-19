import os
import json
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select

from client_jds import CLIENT_JDS, get_client_jd, list_clients
from resume_parser import extract_text
from screener import screen_candidate
from database import get_db_sync, sync_engine
from models.agency import ClientJD, Client

from routes.clients import router as clients_router
from routes.jobs import router as jobs_router
from routes.candidates import router as candidates_router
from routes.submissions import router as submissions_router
from routes.placements import router as placements_router
from routes.matching import router as matching_router
from routes.client_jds import router as client_jds_router
from routes.interviews import router as interviews_router

app = FastAPI(title="Techcitta Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients_router)
app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(submissions_router)
app.include_router(placements_router)
app.include_router(matching_router)
app.include_router(client_jds_router)
app.include_router(interviews_router)


class ScreenRequest(BaseModel):
    jd_id: str | None = None
    jd_key: str | None = None
    client_name: str | None = None
    job_title: str | None = None
    resume_text: str | None = None


class BulkScreenRequest(BaseModel):
    jd_id: str | None = None
    jd_key: str | None = None
    client_name: str | None = None
    job_title: str | None = None
    candidates: list[dict]


def _resolve_jd_from_db(jd_id: str):
    from sqlalchemy.orm import Session as SyncSession
    sync_session = SyncSession(sync_engine)
    try:
        jd = sync_session.query(ClientJD).filter(ClientJD.id == jd_id).first()
        if not jd:
            raise HTTPException(status_code=404, detail={"error": f"JD '{jd_id}' not found"})

        client = sync_session.query(Client).filter(Client.id == jd.clientId).first()

        def _safe_json(val):
            if val is None:
                return []
            if isinstance(val, (list, dict)):
                return val
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return []

        from client_jds import ClientJDConfig
        return ClientJDConfig(
            client_name=client.name if client else "Unknown",
            job_title=jd.jobTitle,
            full_jd=jd.fullJd,
            must_have_skills=_safe_json(jd.mustHaveSkills),
            nice_to_have_skills=_safe_json(jd.niceToHaveSkills),
            experience_min=jd.experienceMin or 0,
            experience_max=jd.experienceMax or 15,
            mandatory_requirements=_safe_json(jd.mandatoryRequirements),
            domain_requirements=_safe_json(jd.domainRequirements),
        )
    finally:
        sync_session.close()


def _resolve_jd(jd_id: str | None, jd_key: str | None, client_name: str | None, job_title: str | None):
    if jd_id:
        return _resolve_jd_from_db(jd_id)
    if jd_key:
        jd = CLIENT_JDS.get(jd_key)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail={"error": f"JD key '{jd_key}' not found", "available_clients": list_clients()},
            )
        return jd
    if client_name:
        jd = get_client_jd(client_name, job_title)
        if not jd:
            raise HTTPException(
                status_code=404,
                detail={"error": f"Client '{client_name}' not found", "available_clients": list_clients()},
            )
        return jd
    raise HTTPException(status_code=400, detail={"error": "Provide jd_id, jd_key, or client_name"})


@app.get("/clients")
def get_clients_endpoint():
    from sqlalchemy.orm import Session as SyncSession
    sync_session = SyncSession(sync_engine)
    try:
        jds = sync_session.query(ClientJD).all()
        jd_list = []
        for jd in jds:
            client = sync_session.query(Client).filter(Client.id == jd.clientId).first()
            jd_list.append({
                "key": jd.id,
                "client": client.name if client else "Unknown",
                "job_title": jd.jobTitle,
            })
        if not jd_list:
            return {"success": True, "clients": list_clients()}
        return {"success": True, "clients": jd_list}
    finally:
        sync_session.close()


@app.post("/screen")
def screen_single(req: ScreenRequest):
    jd = _resolve_jd(req.jd_id, req.jd_key, req.client_name, req.job_title)
    if not req.resume_text:
        raise HTTPException(status_code=400, detail={"error": "resume_text is required"})
    result = screen_candidate(jd, req.resume_text)
    return {"success": True, "client": jd.client_name, "job_title": jd.job_title, "screening": result}


@app.post("/screen/file")
def screen_file(
    file: UploadFile = File(...),
    jd_id: str = Form(None),
    jd_key: str = Form(None),
    client_name: str = Form(None),
    job_title: str = Form(None),
):
    jd = _resolve_jd(jd_id, jd_key, client_name, job_title)
    if not file.filename:
        raise HTTPException(status_code=400, detail={"error": "Filename is required"})

    allowed = {".pdf", ".docx", ".doc", ".txt"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail={"error": f"File type '{ext}' not supported"})

    file_bytes = file.file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"error": "File exceeds 10MB limit"})

    resume_text = extract_text(file_bytes, file.filename)
    if not resume_text or len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail={"error": "Could not extract text from file"})

    result = screen_candidate(jd, resume_text)
    return {
        "success": True,
        "client": jd.client_name,
        "job_title": jd.job_title,
        "candidate_name": file.filename,
        "screening": result,
    }


@app.post("/screen/bulk")
def screen_bulk(req: BulkScreenRequest):
    jd = _resolve_jd(req.jd_id, req.jd_key, req.client_name, req.job_title)
    if not req.candidates or len(req.candidates) == 0:
        raise HTTPException(status_code=400, detail={"error": "candidates list is required"})
    if len(req.candidates) > 50:
        raise HTTPException(status_code=400, detail={"error": "Maximum 50 candidates per bulk request"})

    def _screen_one(candidate: dict) -> dict:
        cid = candidate.get("id", "unknown")
        name = candidate.get("name", "Unknown")
        resume_text = candidate.get("resume_text", "")
        if not resume_text or len(resume_text.strip()) < 30:
            return {
                "candidateId": cid, "candidateName": name,
                "verdict": "DO NOT SUBMIT", "matchScore": 0, "scores": {},
                "mustHaveBreakdown": [], "redFlags": ["Insufficient resume data"],
                "domainFit": "N/A", "interviewPrediction": "N/A",
                "finalRecommendation": "Cannot evaluate.", "error": "Insufficient data",
            }
        try:
            result = screen_candidate(jd, resume_text)
            return {"candidateId": cid, "candidateName": name, **result}
        except Exception as e:
            return {
                "candidateId": cid, "candidateName": name, "verdict": "ERROR",
                "matchScore": 0, "scores": {}, "mustHaveBreakdown": [], "redFlags": [],
                "domainFit": "N/A", "interviewPrediction": "N/A",
                "finalRecommendation": "", "error": str(e),
            }

    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(_screen_one, req.candidates))

    successful = [r for r in results if not r.get("error")]
    summary = {
        "total": len(results),
        "strongSubmit": sum(1 for r in results if r.get("verdict") == "STRONG SUBMIT"),
        "submitWithCaution": sum(1 for r in results if r.get("verdict") == "SUBMIT WITH CAUTION"),
        "doNotSubmit": sum(1 for r in results if r.get("verdict") == "DO NOT SUBMIT"),
        "errors": sum(1 for r in results if r.get("error")),
        "averageScore": round(sum(r.get("matchScore", 0) for r in successful) / max(len(successful), 1)),
    }
    return {"success": True, "client": jd.client_name, "job_title": jd.job_title, "summary": summary, "results": results}


@app.get("/health")
def health():
    return {"status": "ok", "service": "techcitta-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
