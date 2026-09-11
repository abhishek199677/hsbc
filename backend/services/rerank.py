"""
Cohere Cross-Encoder Reranking Service (Python / FastAPI)

Provides async reranking for candidate and job match results using Cohere's Rerank v3 API.
"""

import os
import logging
import httpx

logger = logging.getLogger("backend.services.rerank")


async def rerank_documents(
    query: str,
    documents: list[str],
    top_n: int = 10,
    model: str = "rerank-english-v3.0",
) -> list[dict] | None:
    """
    Reranks a list of candidate documents against a query string using Cohere Rerank API.
    Returns None if COHERE_API_KEY is missing or if the API call fails.
    """
    api_key = os.getenv("COHERE_API_KEY", "").strip()
    if not api_key:
        return None  # Fallback to vector cosine distance

    if not documents:
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.cohere.com/v2/rerank",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "query": query,
                    "documents": documents,
                    "top_n": min(top_n, len(documents)),
                },
            )

        if response.status_code != 200:
            logger.warning("Cohere Rerank API returned status code %d: %s", response.status_code, response.text)
            return None

        data = response.json()
        results = data.get("results", [])
        return [
            {
                "index": item["index"],
                "relevanceScore": item.get("relevance_score", item.get("relevanceScore", 0.0)),
            }
            for item in results
        ]
    except Exception as e:
        logger.warning("Failed to perform Cohere reranking: %s", str(e))
        return None
