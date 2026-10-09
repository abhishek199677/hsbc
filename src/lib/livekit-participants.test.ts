import { describe, expect, it } from "vitest";
import { getInterviewParticipants } from "./livekit-participants";

describe("getInterviewParticipants", () => {
  it("identifies the voice agent separately from its avatar worker", () => {
    const participants = [
      { identity: "candidate-1", attributes: {} },
      {
        identity: "simli-avatar-agent",
        attributes: { "lk.publish_on_behalf": "worker-1" },
      },
      { identity: "worker-1", attributes: {} },
    ];

    expect(getInterviewParticipants(participants, "candidate-1")).toEqual({
      agent: participants[2],
      avatar: participants[1],
    });
  });

  it("does not treat an avatar alone as a connected interviewer", () => {
    const participants = [
      { identity: "candidate-1", attributes: {} },
      {
        identity: "simli-avatar-agent",
        attributes: { "lk.publish_on_behalf": "worker-1" },
      },
    ];

    expect(getInterviewParticipants(participants, "candidate-1")).toEqual({
      agent: null,
      avatar: null,
    });
  });

  it("waits for the avatar published on behalf of this interview's voice agent", () => {
    const participants = [
      { identity: "candidate-1", attributes: {} },
      { identity: "worker-1", attributes: {} },
      {
        identity: "simli-avatar-agent",
        attributes: { "lk.publish_on_behalf": "worker-1" },
      },
      {
        identity: "other-avatar",
        attributes: { "lk.publish_on_behalf": "other-worker" },
      },
    ];

    expect(getInterviewParticipants(participants, "candidate-1")).toEqual({
      agent: participants[1],
      avatar: participants[2],
    });
  });
});
