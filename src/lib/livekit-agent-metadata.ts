interface InterviewAgentMetadataOptions {
  interviewId: string;
  userId: string;
  authToken?: string;
  profile?: Record<string, unknown>;
}

export function createInterviewAgentMetadata({
  interviewId,
  userId,
  authToken,
  profile,
}: InterviewAgentMetadataOptions): string {
  if (!authToken?.trim()) {
    throw new Error(
      "Authenticated session token is required to start the interview agent"
    );
  }

  return JSON.stringify({
    interviewId,
    userId,
    createdAt: new Date().toISOString(),
    authToken,
    profile: profile ?? null,
  });
}
