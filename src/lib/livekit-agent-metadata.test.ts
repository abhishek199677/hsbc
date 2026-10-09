import { describe, expect, it } from "vitest";
import { createInterviewAgentMetadata } from "./livekit-agent-metadata";

describe("createInterviewAgentMetadata", () => {
  it("requires an authenticated session token before dispatching an agent", () => {
    expect(() =>
      createInterviewAgentMetadata({
        interviewId: "interview-1",
        userId: "user-1",
      })
    ).toThrow("Authenticated session token is required to start the interview agent");
  });

  it("includes the session token and candidate profile in room metadata", () => {
    const metadata = JSON.parse(
      createInterviewAgentMetadata({
        interviewId: "interview-1",
        userId: "user-1",
        authToken: "session-token",
        profile: { name: "Candidate" },
      })
    );

    expect(metadata).toMatchObject({
      interviewId: "interview-1",
      userId: "user-1",
      authToken: "session-token",
      profile: { name: "Candidate" },
    });
  });
});
