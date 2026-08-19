import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import require_admin_or_employer, AuthUser
from models.interview import Interview, InterviewQuestion
from models.agency import AgencyCandidate
from services.interview_engine import generate_questions, evaluate_answer, generate_summary

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


class StartInterviewRequest(BaseModel):
    candidateId: str
    jdId: str | None = None
    format: str = "text"


class AnswerRequest(BaseModel):
    questionId: str
    answer: str
    timeSpentSeconds: int = 0


@router.post("/start")
async def start_interview(
    body: StartInterviewRequest,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    # Check candidate exists
    cand_result = await db.execute(
        select(AgencyCandidate).where(
            AgencyCandidate.id == body.candidateId,
            AgencyCandidate.organizationId == auth.organization_id,
        )
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Check if interview already exists for this candidate
    existing = await db.execute(
        select(Interview).where(
            Interview.candidateId == body.candidateId,
            Interview.organizationId == auth.organization_id,
            Interview.status.in_(["scheduled", "in_progress"]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Interview already in progress for this candidate")

    # Build resume text from candidate data
    resume_parts = []
    if candidate.name:
        resume_parts.append(f"Name: {candidate.name}")
    if candidate.currentRole:
        resume_parts.append(f"Current Role: {candidate.currentRole}")
    if candidate.currentCompany:
        resume_parts.append(f"Current Company: {candidate.currentCompany}")
    if candidate.totalExperience:
        resume_parts.append(f"Total Experience: {candidate.totalExperience}")
    if candidate.skills:
        resume_parts.append(f"Skills: {candidate.skills}")
    if candidate.location:
        resume_parts.append(f"Location: {candidate.location}")
    if candidate.notes:
        resume_parts.append(f"Summary: {candidate.notes}")
    resume_text = "\n".join(resume_parts)

    if len(resume_text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Insufficient resume data to generate questions")

    # Generate questions
    jd_text = None
    if body.jdId:
        from models.agency import ClientJD, Client
        from sqlalchemy.orm import Session as SyncSession
        from database import sync_engine
        sync_session = SyncSession(sync_engine)
        try:
            jd = sync_session.query(ClientJD).filter(ClientJD.id == body.jdId).first()
            if jd:
                jd_text = jd.fullJd
        finally:
            sync_session.close()

    try:
        questions = generate_questions(resume_text, jd_text, num_questions=10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

    # Create interview
    interview = Interview(
        candidateId=body.candidateId,
        jdId=body.jdId,
        organizationId=auth.organization_id,
        format=body.format,
        status="in_progress",
        startedAt=datetime.utcnow(),
    )
    db.add(interview)
    await db.flush()

    # Create questions
    for i, q in enumerate(questions, 1):
        question = InterviewQuestion(
            interviewId=interview.id,
            questionNumber=i,
            question=q.get("question", ""),
            category=q.get("category", "technical"),
            skill=q.get("skill"),
        )
        db.add(question)

    await db.flush()

    # Return first question
    first_q = questions[0] if questions else {"question": "Tell me about yourself.", "category": "technical", "skill": "General"}
    return {
        "success": True,
        "interviewId": interview.id,
        "totalQuestions": len(questions),
        "timeLimitMinutes": 15,
        "firstQuestion": {
            "questionNumber": 1,
            "question": first_q.get("question", ""),
            "category": first_q.get("category", "technical"),
        },
    }


@router.get("/{interview_id}")
async def get_interview(
    interview_id: str,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id,
            Interview.organizationId == auth.organization_id,
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Get questions
    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.interviewId == interview_id
        ).order_by(InterviewQuestion.questionNumber)
    )
    questions = q_result.scalars().all()

    # Get candidate
    cand_result = await db.execute(
        select(AgencyCandidate).where(AgencyCandidate.id == interview.candidateId)
    )
    candidate = cand_result.scalar_one_or_none()

    return {
        "success": True,
        "interview": {
            "id": interview.id,
            "candidateId": interview.candidateId,
            "candidateName": candidate.name if candidate else "Unknown",
            "format": interview.format,
            "status": interview.status,
            "startedAt": interview.startedAt.isoformat() if interview.startedAt else None,
            "completedAt": interview.completedAt.isoformat() if interview.completedAt else None,
            "durationSeconds": interview.durationSeconds,
            "overallScore": interview.overallScore,
            "aiSummary": interview.aiSummary,
            "aiRecommendation": interview.aiRecommendation,
            "createdAt": interview.createdAt.isoformat() if interview.createdAt else None,
        },
        "questions": [
            {
                "id": q.id,
                "questionNumber": q.questionNumber,
                "question": q.question,
                "category": q.category,
                "answer": q.answer,
                "timeSpentSeconds": q.timeSpentSeconds,
                "score": q.score,
                "aiFeedback": q.aiFeedback,
            }
            for q in questions
        ],
    }


@router.get("/{interview_id}/next-question")
async def get_next_question(
    interview_id: str,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    # Get interview
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id,
            Interview.organizationId == auth.organization_id,
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Check time limit (15 minutes)
    if interview.startedAt:
        elapsed = (datetime.utcnow() - interview.startedAt).total_seconds()
        if elapsed > 15 * 60:
            # Auto-complete interview
            await _complete_interview(interview, db)
            raise HTTPException(status_code=400, detail="Time limit reached. Interview completed.")

    # Get next unanswered question
    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.interviewId == interview_id,
            InterviewQuestion.answer.is_(None),
        ).order_by(InterviewQuestion.questionNumber).limit(1)
    )
    question = q_result.scalar_one_or_none()

    if not question:
        # All questions answered
        await _complete_interview(interview, db)
        raise HTTPException(status_code=400, detail="All questions answered. Interview completed.")

    # Check if there's a pending follow-up from previous answer
    prev_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.interviewId == interview_id,
            InterviewQuestion.questionNumber < question.questionNumber,
        ).order_by(InterviewQuestion.questionNumber.desc()).limit(1)
    )
    prev_q = prev_result.scalar_one_or_none()

    return {
        "success": True,
        "question": {
            "id": question.id,
            "questionNumber": question.questionNumber,
            "question": question.question,
            "category": question.category,
            "skill": question.skill,
        },
        "totalQuestions": 10,
        "timeRemainingSeconds": max(0, 15 * 60 - int((datetime.utcnow() - interview.startedAt).total_seconds())) if interview.startedAt else 15 * 60,
    }


@router.post("/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    body: AnswerRequest,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    # Get interview
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id,
            Interview.organizationId == auth.organization_id,
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Get question
    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.id == body.questionId,
            InterviewQuestion.interviewId == interview_id,
        )
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Save answer
    question.answer = body.answer
    question.timeSpentSeconds = body.timeSpentSeconds

    # Get resume text for evaluation
    cand_result = await db.execute(
        select(AgencyCandidate).where(AgencyCandidate.id == interview.candidateId)
    )
    candidate = cand_result.scalar_one_or_none()
    resume_text = _build_resume_text(candidate)

    # Evaluate answer
    q_count_result = await db.execute(
        select(func.count()).select_from(InterviewQuestion).where(InterviewQuestion.interviewId == interview_id)
    )
    total_questions = q_count_result.scalar() or 10

    try:
        evaluation = evaluate_answer(
            question.question, body.answer, resume_text,
            question.questionNumber, total_questions
        )
        question.score = evaluation.get("score", 5)
        question.aiFeedback = evaluation.get("feedback", "")
    except Exception as e:
        question.score = 5
        question.aiFeedback = "Evaluation unavailable."

    await db.flush()

    # Get next question
    next_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.interviewId == interview_id,
            InterviewQuestion.answer.is_(None),
        ).order_by(InterviewQuestion.questionNumber).limit(1)
    )
    next_q = next_result.scalar_one_or_none()

    if not next_q:
        # All questions answered
        await _complete_interview(interview, db)
        return {
            "success": True,
            "evaluation": {
                "score": question.score,
                "feedback": question.aiFeedback,
            },
            "completed": True,
        }

    return {
        "success": True,
        "evaluation": {
            "score": question.score,
            "feedback": question.aiFeedback,
        },
        "nextQuestion": {
            "id": next_q.id,
            "questionNumber": next_q.questionNumber,
            "question": next_q.question,
            "category": next_q.category,
            "skill": next_q.skill,
        },
        "completed": False,
    }


@router.post("/{interview_id}/end")
async def end_interview(
    interview_id: str,
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Interview).where(
            Interview.id == interview_id,
            Interview.organizationId == auth.organization_id,
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status == "completed":
        return {"success": True, "message": "Interview already completed"}

    await _complete_interview(interview, db)
    return {"success": True, "message": "Interview completed"}


@router.get("")
async def list_interviews(
    candidateId: str | None = Query(None),
    status: str | None = Query(None),
    auth: AuthUser = Depends(require_admin_or_employer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Interview).where(Interview.organizationId == auth.organization_id)
    if candidateId:
        query = query.where(Interview.candidateId == candidateId)
    if status:
        query = query.where(Interview.status == status)
    query = query.order_by(Interview.createdAt.desc())

    result = await db.execute(query)
    interviews = result.scalars().all()

    interview_list = []
    for iv in interviews:
        cand_result = await db.execute(
            select(AgencyCandidate).where(AgencyCandidate.id == iv.candidateId)
        )
        candidate = cand_result.scalar_one_or_none()
        interview_list.append({
            "id": iv.id,
            "candidateId": iv.candidateId,
            "candidateName": candidate.name if candidate else "Unknown",
            "candidateSkills": candidate.skills if candidate else None,
            "format": iv.format,
            "status": iv.status,
            "startedAt": iv.startedAt.isoformat() if iv.startedAt else None,
            "completedAt": iv.completedAt.isoformat() if iv.completedAt else None,
            "durationSeconds": iv.durationSeconds,
            "overallScore": iv.overallScore,
            "aiSummary": iv.aiSummary,
            "aiRecommendation": iv.aiRecommendation,
            "createdAt": iv.createdAt.isoformat() if iv.createdAt else None,
        })

    return {"success": True, "interviews": interview_list}


async def _complete_interview(interview: Interview, db: AsyncSession):
    """Complete interview and generate summary."""
    interview.status = "completed"
    interview.completedAt = datetime.utcnow()
    if interview.startedAt:
        interview.durationSeconds = int((interview.completedAt - interview.startedAt).total_seconds())

    # Get all Q&A
    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.interviewId == interview.id
        ).order_by(InterviewQuestion.questionNumber)
    )
    questions = q_result.scalars().all()

    # Get candidate resume
    cand_result = await db.execute(
        select(AgencyCandidate).where(AgencyCandidate.id == interview.candidateId)
    )
    candidate = cand_result.scalar_one_or_none()
    resume_text = _build_resume_text(candidate)

    qa_list = [
        {
            "question": q.question,
            "answer": q.answer or "No answer",
            "category": q.category,
            "score": q.score,
        }
        for q in questions
    ]

    # Generate summary
    try:
        summary = generate_summary(qa_list, resume_text)
        interview.overallScore = summary.get("overallScore", 50)
        interview.aiSummary = json.dumps({
            "summary": summary.get("summary", ""),
            "strengths": summary.get("strengths", []),
            "weaknesses": summary.get("weaknesses", []),
            "recommendation": summary.get("recommendation", "MAYBE"),
            "interviewPrediction": summary.get("interviewPrediction", ""),
        })
        interview.aiRecommendation = summary.get("recommendation", "MAYBE")
    except Exception as e:
        interview.overallScore = 50
        interview.aiSummary = json.dumps({"summary": "Summary generation failed.", "strengths": [], "weaknesses": [], "recommendation": "MAYBE"})

    await db.flush()


def _build_resume_text(candidate) -> str:
    if not candidate:
        return "No resume data available."
    parts = []
    if candidate.name:
        parts.append(f"Name: {candidate.name}")
    if candidate.currentRole:
        parts.append(f"Current Role: {candidate.currentRole}")
    if candidate.currentCompany:
        parts.append(f"Current Company: {candidate.currentCompany}")
    if candidate.totalExperience:
        parts.append(f"Total Experience: {candidate.totalExperience}")
    if candidate.skills:
        parts.append(f"Skills: {candidate.skills}")
    if candidate.location:
        parts.append(f"Location: {candidate.location}")
    if candidate.notes:
        parts.append(f"Summary: {candidate.notes}")
    return "\n".join(parts) if parts else "No resume data available."
