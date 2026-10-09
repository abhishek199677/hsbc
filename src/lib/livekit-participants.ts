export interface InterviewParticipant {
  identity: string;
  attributes?: Record<string, string>;
}

export function getInterviewParticipants<T extends InterviewParticipant>(
  participants: T[],
  candidateIdentity: string
): { agent: T | null; avatar: T | null } {
  const agent =
    participants.find(
      (participant) =>
        participant.identity !== candidateIdentity &&
        !participant.attributes?.["lk.publish_on_behalf"]
    ) ?? null;

  if (!agent) return { agent: null, avatar: null };

  const avatar =
    participants.find(
      (participant) =>
        participant.attributes?.["lk.publish_on_behalf"] === agent.identity
    ) ?? null;

  return { agent, avatar };
}
