import os
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


async def generate_embedding(text_str: str) -> list[float]:
    cleaned = text_str.replace("\n", " ").strip()
    if not cleaned:
        return [0.0] * EMBEDDING_DIMENSIONS

    client = _get_client()
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=cleaned,
        dimensions=EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


async def store_profile_embedding(db: AsyncSession, user_id: str, embedding: list[float]):
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    await db.execute(
        text(
            """INSERT INTO profile_embeddings (user_id, embedding, updated_at)
            VALUES (:user_id, :embedding::vector, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET embedding = :embedding::vector, updated_at = NOW()"""
        ),
        {"user_id": user_id, "embedding": vector_str},
    )


async def store_job_embedding(db: AsyncSession, job_id: str, embedding: list[float]):
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    await db.execute(
        text(
            """INSERT INTO job_embeddings (job_id, embedding, updated_at)
            VALUES (:job_id, :embedding::vector, NOW())
            ON CONFLICT (job_id)
            DO UPDATE SET embedding = :embedding::vector, updated_at = NOW()"""
        ),
        {"job_id": job_id, "embedding": vector_str},
    )


from services.rerank import rerank_documents


async def find_matching_jobs(db: AsyncSession, user_id: str, org_id: str, limit: int = 10):
    initial_limit = max(limit, 50) if os.getenv("COHERE_API_KEY") else limit
    result = await db.execute(
        text(
            """SELECT je.job_id, j.title, j.description, 1 - (je.embedding <=> (SELECT embedding FROM profile_embeddings WHERE user_id = :user_id)) as similarity
            FROM job_embeddings je
            JOIN jobs j ON j.id = je.job_id
            WHERE j.organization_id = :org_id AND j.status = 'active'
            ORDER BY je.embedding <=> (SELECT embedding FROM profile_embeddings WHERE user_id = :user_id)
            LIMIT :limit"""
        ),
        {"user_id": user_id, "org_id": org_id, "limit": initial_limit},
    )
    rows = result.fetchall()
    base_matches = [
        {
            "jobId": row[0],
            "similarity": float(row[3]),
            "text": f"Title: {row[1] or ''}. Description: {row[2] or ''}",
        }
        for row in rows
    ]

    if os.getenv("COHERE_API_KEY") and base_matches:
        prof_res = await db.execute(
            text('SELECT "currentRole", skills, "aboutYou" FROM "Profile" WHERE "userId" = :user_id'),
            {"user_id": user_id},
        )
        prof_row = prof_res.fetchone()
        if prof_row:
            query = f"Role: {prof_row[0] or ''}. Skills: {prof_row[1] or ''}. About: {prof_row[2] or ''}"
            reranked = await rerank_documents(query, [m["text"] for m in base_matches], top_n=limit)
            if reranked:
                return [
                    {
                        "jobId": base_matches[item["index"]]["jobId"],
                        "similarity": base_matches[item["index"]]["similarity"],
                        "rerankScore": item["relevanceScore"],
                    }
                    for item in reranked
                ]

    return [{"jobId": m["jobId"], "similarity": m["similarity"]} for m in base_matches[:limit]]


async def find_matching_candidates(db: AsyncSession, job_id: str, org_id: str, limit: int = 10):
    initial_limit = max(limit, 50) if os.getenv("COHERE_API_KEY") else limit
    result = await db.execute(
        text(
            """SELECT pe.user_id, p."currentRole", p.skills, p."aboutYou", 1 - (pe.embedding <=> (SELECT embedding FROM job_embeddings WHERE job_id = :job_id)) as similarity
            FROM profile_embeddings pe
            JOIN "User" u ON u.id = pe.user_id
            LEFT JOIN "Profile" p ON p."userId" = pe.user_id
            WHERE u."organizationId" = :org_id
            ORDER BY pe.embedding <=> (SELECT embedding FROM job_embeddings WHERE job_id = :job_id)
            LIMIT :limit"""
        ),
        {"job_id": job_id, "org_id": org_id, "limit": initial_limit},
    )
    rows = result.fetchall()
    base_matches = [
        {
            "userId": row[0],
            "similarity": float(row[4]),
            "text": f"Role: {row[1] or ''}. Skills: {row[2] or ''}. About: {row[3] or ''}",
        }
        for row in rows
    ]

    if os.getenv("COHERE_API_KEY") and base_matches:
        job_res = await db.execute(
            text('SELECT title, description, requirements FROM "JobRequisition" WHERE id = :job_id'),
            {"job_id": job_id},
        )
        job_row = job_res.fetchone()
        if job_row:
            query = f"Title: {job_row[0] or ''}. Description: {job_row[1] or ''}. Requirements: {job_row[2] or ''}"
            reranked = await rerank_documents(query, [m["text"] for m in base_matches], top_n=limit)
            if reranked:
                return [
                    {
                        "userId": base_matches[item["index"]]["userId"],
                        "similarity": base_matches[item["index"]]["similarity"],
                        "rerankScore": item["relevanceScore"],
                    }
                    for item in reranked
                ]

    return [{"userId": m["userId"], "similarity": m["similarity"]} for m in base_matches[:limit]]


def profile_to_text(profile: dict) -> str:
    parts = []
    if profile.get("currentRole"):
        parts.append(f"Role: {profile['currentRole']}")
    if profile.get("totalExperience"):
        parts.append(f"Experience: {profile['totalExperience']}")
    if profile.get("skills"):
        parts.append(f"Skills: {profile['skills']}")
    if profile.get("aboutYou"):
        parts.append(f"About: {profile['aboutYou']}")
    if profile.get("education"):
        parts.append(f"Education: {profile['education']}")
    if profile.get("currentCompany"):
        parts.append(f"Company: {profile['currentCompany']}")
    if profile.get("preferredLocation"):
        parts.append(f"Preferred Location: {profile['preferredLocation']}")
    if profile.get("jobType"):
        parts.append(f"Job Type: {profile['jobType']}")
    return "\n".join(parts)


def job_to_text(job: dict) -> str:
    parts = []
    if job.get("title"):
        parts.append(f"Title: {job['title']}")
    if job.get("description"):
        parts.append(f"Description: {job['description']}")
    if job.get("requiredSkills"):
        parts.append(f"Required Skills: {job['requiredSkills']}")
    if job.get("preferredSkills"):
        parts.append(f"Preferred Skills: {job['preferredSkills']}")
    if job.get("location"):
        parts.append(f"Location: {job['location']}")
    if job.get("experienceLevel"):
        parts.append(f"Experience Level: {job['experienceLevel']}")
    if job.get("employmentType"):
        parts.append(f"Employment Type: {job['employmentType']}")
    return "\n".join(parts)
