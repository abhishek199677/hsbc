import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  generateWelcomeEmail,
  generateVerificationEmail,
  generateReminderEmail,
  generateInterviewConfirmationEmail,
} from "@/lib/email";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getInterviewDateTime(date: string, time: string): Date {
  let interviewDate: Date;

  if (date.includes(",")) {
    const parts = date.split(", ")[1].split(" ");
    const day = parseInt(parts[0]);
    const monthMap: Record<string, number> = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
    };
    const month = monthMap[parts[1]];
    const year = parseInt(parts[2]);
    interviewDate = new Date(year, month, day);
  } else {
    interviewDate = new Date(date);
  }

  const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    interviewDate.setHours(hours, minutes, 0, 0);
  }

  return interviewDate;
}

function asData(label: string, value: string): string {
  return `<${label}>\n${value}\n</${label}>`;
}

function formatProctoring(proctoring: unknown): string {
  if (!proctoring || typeof proctoring !== "object") return "";
  const p = proctoring as Record<string, unknown>;
  if (p.enabled === false) return "Proctoring was not active during this interview (camera unavailable).";

  const flags: string[] = [];
  if (p.lookAwayCount) flags.push(`${p.lookAwayCount} look-away incident(s)`);
  if (p.faceHiddenCount) flags.push(`${p.faceHiddenCount} moment(s) with the face not visible`);
  if (p.multipleFacesCount) flags.push(`${p.multipleFacesCount} moment(s) with multiple people in frame`);
  if (p.eyesClosedCount) flags.push(`${p.eyesClosedCount} long eye-closure(s)`);

  if (flags.length === 0) return "Proctoring detected no integrity violations during the interview.";

  const totalSeconds = Math.round(((p.totalLookAwayMs as number) || 0) / 1000);
  return [
    `The automated proctoring system recorded these integrity incidents: ${flags.join("; ")}.`,
    totalSeconds > 0 ? `Total time looking away from the screen: ${totalSeconds}s.` : "",
    "This is strong evidence of possible malpractice (e.g. reading answers, looking at another person or device).",
  ]
    .filter(Boolean)
    .join(" ");
}

export const sendWelcomeEmail = inngest.createFunction(
  { id: "send-welcome-email", name: "Send Welcome Email", triggers: [{ event: "user/signup" }] },
  async ({ event, step }) => {
    const { userId } = event.data;

    const user = await step.run("fetch-user", async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, organization: true },
      });
    });

    if (!user?.email) {
      return { success: false, error: "No email found" };
    }

    const orgName = user.organization?.name || "Techcitta";

    await step.run("send-email", async () => {
      await sendEmail({
        to: user.email,
        subject: `Welcome to ${orgName}! 🚀`,
        html: generateWelcomeEmail(user.name || "there", orgName),
      });
    });

    return { success: true };
  }
);

export const sendVerificationEmail = inngest.createFunction(
  { id: "send-verification-email", name: "Send Verification Email", triggers: [{ event: "user/verify-email" }] },
  async ({ event, step }) => {
    const { userId, verifyUrl } = event.data;

    const user = await step.run("fetch-user", async () => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });
    });

    if (!user?.email) {
      return { success: false, error: "No email found" };
    }

    await step.run("send-email", async () => {
      await sendEmail({
        to: user.email,
        subject: "Confirm your email – Techcitta",
        html: generateVerificationEmail(user.name || "there", verifyUrl),
      });
    });

    return { success: true };
  }
);

export const sendInterviewReminder = inngest.createFunction(
  { id: "send-interview-reminder", name: "Send Interview Reminder", triggers: [{ event: "interview/reminder" }] },
  async ({ event, step }) => {
    const { interviewId, type } = event.data;

    const interview = await step.run("fetch-interview", async () => {
      return prisma.interview.findUnique({
        where: { id: interviewId },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      });
    });

    if (!interview?.user?.email) {
      return { success: false, error: "Interview or user not found" };
    }

    const timezone = interview.timezone || "Asia/Kolkata";
    const typeLabels: Record<string, string> = {
      "24h": "24 Hours",
      "1h": "1 Hour",
      "15m": "15 Minutes",
      "now": "Now",
    };
    const messages: Record<string, string> = {
      "24h": "Your AI interview is tomorrow. Make sure you're prepared!",
      "1h": "Your AI interview starts in 1 hour. Final preparations time!",
      "15m": "Your AI interview starts in 15 minutes. Get ready to join!",
      "now": "Your AI interview is starting now! Click the link below to join.",
    };

    const reminderType = typeLabels[type] || type;
    const reminderMessage = messages[type] || "Your interview is coming up soon!";

    await step.run("send-email", async () => {
      await sendEmail({
        to: interview.user.email,
        subject: type === "now"
          ? "Your AI Interview is Starting Now!"
          : `Interview Reminder - ${reminderType}`,
        html: generateReminderEmail({
          name: interview.user.name || "there",
          type: reminderType,
          date: interview.date,
          time: interview.time,
          message: reminderMessage,
          timezone,
        }),
      });
    });

    const validFields: Record<string, string> = {
      "24h": "reminder24hSent",
      "1h": "reminder1hSent",
      "15m": "reminder15mSent",
      "now": "reminderNowSent",
    };

    await step.run("mark-reminder-sent", async () => {
      const field = validFields[type];
      if (field) {
        await prisma.interview.update({
          where: { id: interviewId },
          data: { [field]: true },
        });
      }
    });

    return { success: true };
  }
);

export const sendInterviewConfirmation = inngest.createFunction(
  { id: "send-interview-confirmation", name: "Send Interview Confirmation", triggers: [{ event: "interview/scheduled" }] },
  async ({ event, step }) => {
    const { interviewId } = event.data;

    const interview = await step.run("fetch-interview", async () => {
      return prisma.interview.findUnique({
        where: { id: interviewId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    if (!interview?.user?.email) {
      return { success: false, error: "Interview or user not found" };
    }

    const timezone = interview.timezone || "Asia/Kolkata";

    await step.run("send-email", async () => {
      await sendEmail({
        to: interview.user.email,
        subject: `Your AI Interview is Confirmed – ${interview.date}`,
        html: generateInterviewConfirmationEmail({
          name: interview.user.name || "there",
          date: interview.date,
          time: interview.time,
          mode: interview.mode,
          timezone,
        }),
      });
    });

    await step.run("update-email-sent", async () => {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { emailSent: true },
      });
    });

    return { success: true };
  }
);

export const evaluateInterview = inngest.createFunction(
  { id: "evaluate-interview", name: "Evaluate Interview", triggers: [{ event: "interview/evaluate" }] },
  async ({ event, step }) => {
    const { interviewId } = event.data;

    const interview = await step.run("fetch-interview", async () => {
      return prisma.interview.findUnique({
        where: { id: interviewId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    if (!interview) {
      return { success: false, error: "Interview not found" };
    }

    const history = (interview.transcript ? JSON.parse(interview.transcript as string) : []) as Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;

    const candidateAnswers = history.filter(
      (m) => m.role === "user" && m.content && m.content.trim().length >= 3
    );
    const candidateWordCount = candidateAnswers.reduce(
      (sum, m) => sum + m.content.trim().split(/\s+/).length,
      0
    );

    if (candidateAnswers.length === 0 || candidateWordCount < 5) {
      const questions = history
        .filter((m) => m.role === "assistant" && m.content && m.content.includes("?"))
        .map((m) => m.content.trim());

      const noAnswer = questions.length > 0
        ? "The interview ended before any substantive answers were provided, so your skills could not be assessed."
        : "No interview responses were recorded, so your skills could not be assessed.";

      const evaluation = {
        score: 0,
        strengths: [],
        weaknesses: [
          noAnswer,
          "Please complete the interview and answer each question (speak clearly or type your answer) so your skills can be evaluated.",
        ],
        areasForImprovement: [
          "Complete the full interview and provide responses to every question asked.",
        ],
        topicsToLearn: [],
        recommendation: "Reject",
        integrity: formatProctoring(null),
        questionScores: questions.map((question) => ({
          question,
          answer: "No answer provided",
          score: 0,
          feedback: "No response was given for this question.",
        })),
      };

      await step.run("save-evaluation", async () => {
        await prisma.interview.update({
          where: { id: interviewId },
          data: {
            evaluation: JSON.stringify(evaluation),
            evaluationScore: 0,
            status: "completed",
          },
        });
      });

      return { success: true, evaluation };
    }

    const evaluationPrompt = await step.run("generate-evaluation", async () => {
      const profile = await prisma.profile.findUnique({
        where: { userId: interview.user.id },
        select: { currentRole: true },
      });

      return `Evaluate this interview and provide a score and feedback.
      
      ${asData("candidate_profile", `Name: ${interview.user.name || "Candidate"}\nRole: ${profile?.currentRole || "Professional"}`)}
      
      ${asData("conversation_history", history.map((m) => `${m.role}: ${m.content}`).join("\n"))}
      
      ${asData("proctoring_report", formatProctoring(null))}
      
      IMPORTANT — Base your feedback ONLY on the actual interview conversation above. Never invent or fabricate:
      - Do not list weaknesses, topics, or strengths that are not supported by the candidate's actual answers.
      - If the candidate gave no answer to a question, mark that question score 0 with feedback "No response provided" and do not guess what they might have said.
      - If the transcript is sparse, keep strengths/weaknesses/topicsToLearn sparse too — never pad with generic advice.
      
      Provide:
      1. Score (1-10) as a number (allow one decimal, e.g. 7.5)
      2. Strengths (3 bullet points)
      3. Weaknesses / Areas for improvement (3 bullet points)
      4. Topics to learn and grow (3-5 specific topics the candidate should study to improve, based on the answers they gave — be concrete, e.g. specific technologies, concepts, or skills)
      5. Overall recommendation (Hire/Consider/Reject)
      6. integrity: "clean" | "flagged" | "failed" matching the evidence.
      7. questionScores: an array with one entry for every question the interviewer asked (skip the final wrap-up/thank-you message). Each entry must be an object with: question, answer, score (number 0-10), feedback (one short line).
      
      Format as JSON with keys: score, strengths, weaknesses, areasForImprovement, topicsToLearn, recommendation, integrity, questionScores.`;
    });

    const completion = await step.run("call-openai", async () => {
      return getOpenAI().chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: "You are an interview evaluator. Provide structured feedback. Always return valid JSON." },
          { role: "user", content: evaluationPrompt },
        ],
        max_completion_tokens: 2000,
        reasoning_effort: "low",
      });
    });

    const evaluation = completion.choices[0]?.message?.content;
    const parsedEvaluation = evaluation ? JSON.parse(evaluation) : null;

    await step.run("save-evaluation", async () => {
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          evaluation: evaluation || null,
          evaluationScore: parsedEvaluation?.score || 0,
          status: "completed",
        },
      });
    });

    return { success: true, evaluation: parsedEvaluation };
  }
);

export const processReminderCheck = inngest.createFunction(
  { id: "process-reminder-check", name: "Process Reminder Check", triggers: [{ cron: "*/1 * * * *" }] },
  async ({ step }) => {
    const now = new Date();

    const interviews = await step.run("fetch-scheduled-interviews", async () => {
      return prisma.interview.findMany({
        where: { status: "scheduled" },
        include: { user: { select: { id: true, email: true, name: true, phone: true } } },
      });
    });

    const results: string[] = [];

    for (const interview of interviews) {
      const interviewDateTime = getInterviewDateTime(interview.date, interview.time);
      const diffMs = interviewDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffMinutes = diffMs / (1000 * 60);
      const timezone = interview.timezone || "Asia/Kolkata";

      if (diffHours <= 24 && diffHours > 1 && !interview.reminder24hSent) {
        await step.run(`send-24h-${interview.id}`, async () => {
          await sendEmail({
            to: interview.user.email,
            subject: `Interview Reminder - Tomorrow at ${interview.time}`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "24 Hours",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview is tomorrow. Make sure you're prepared!",
              timezone,
            }),
          });
          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminder24hSent: true },
          });
        });
        results.push(`24h reminder sent to ${interview.user.email}`);
      }

      if (diffHours <= 1 && diffMinutes > 15 && !interview.reminder1hSent) {
        await step.run(`send-1h-${interview.id}`, async () => {
          await sendEmail({
            to: interview.user.email,
            subject: `Interview Starting in 1 Hour`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "1 Hour",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview starts in 1 hour. Final preparations time!",
              timezone,
            }),
          });
          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminder1hSent: true },
          });
        });
        results.push(`1h reminder sent to ${interview.user.email}`);
      }

      if (diffMinutes <= 15 && diffMinutes > 0 && !interview.reminder15mSent) {
        await step.run(`send-15m-${interview.id}`, async () => {
          await sendEmail({
            to: interview.user.email,
            subject: `Interview Starting in 15 Minutes!`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "15 Minutes",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview starts in 15 minutes. Get ready to join!",
              timezone,
            }),
          });
          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminder15mSent: true },
          });
        });
        results.push(`15m reminder sent to ${interview.user.email}`);
      }

      if (diffMinutes <= 0 && diffMinutes > -15 && !interview.reminderNowSent) {
        await step.run(`send-now-${interview.id}`, async () => {
          await sendEmail({
            to: interview.user.email,
            subject: `Your AI Interview is Starting Now!`,
            html: generateReminderEmail({
              name: interview.user.name || "there",
              type: "Now",
              date: interview.date,
              time: interview.time,
              message: "Your AI interview is starting now! Click the link below to join.",
              timezone,
            }),
          });
          await prisma.interview.update({
            where: { id: interview.id },
            data: { reminderNowSent: true },
          });
        });
        results.push(`Now reminder sent to ${interview.user.email}`);
      }
    }

    return { success: true, results, checked: interviews.length };
  }
);

export const functions = [
  sendWelcomeEmail,
  sendVerificationEmail,
  sendInterviewReminder,
  sendInterviewConfirmation,
  evaluateInterview,
  processReminderCheck,
];
