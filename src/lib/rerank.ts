/**
 * Cohere Cross-Encoder Reranking Service
 * 
 * Provides high-precision reranking for candidate profiles, jobs, and search results
 * using Cohere's Rerank v3 API. Performs token-by-token cross-attention between queries
 * and documents to deliver state-of-the-art match relevance.
 */

export interface RerankResult {
  index: number;
  relevanceScore: number;
}

/**
 * Reranks a list of document strings against a target query using Cohere's Rerank API.
 * Returns null if COHERE_API_KEY is not set or if the request fails (allowing fallback to vector search).
 */
export async function rerankDocuments(
  query: string,
  documents: string[],
  topN: number = 10,
  model: string = "rerank-english-v3.0"
): Promise<RerankResult[] | null> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null; // Graceful fallback to vector cosine distance
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  try {
    const response = await fetch("https://api.cohere.com/v2/rerank", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        query,
        documents,
        top_n: Math.min(topN, documents.length),
      }),
    });

    if (!response.ok) {
      console.warn(`[Cohere Rerank] API failed with status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{ index: number; relevance_score?: number; relevanceScore?: number }>;
    };

    if (!data.results || !Array.isArray(data.results)) {
      return null;
    }

    return data.results.map((item) => ({
      index: item.index,
      relevanceScore: item.relevance_score ?? item.relevanceScore ?? 0,
    }));
  } catch (error) {
    console.warn("[Cohere Rerank] Exception during reranking call:", error);
    return null;
  }
}
