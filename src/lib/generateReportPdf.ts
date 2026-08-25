import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((pdfFonts as any)?.pdfMake?.vfs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
}

interface QuestionScore {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

interface EvaluationData {
  score: number;
  strengths: string[];
  weaknesses: string[];
  areasForImprovement: string[];
  topicsToLearn: string[];
  recommendation: string;
  questionScores: QuestionScore[];
}

interface ReportData {
  candidateName: string;
  interviewDate: string;
  duration: string;
  evaluation: EvaluationData;
}

function getScoreColor(score: number): string {
  if (score >= 7) return "#16a34a";
  if (score >= 5) return "#d97706";
  return "#dc2626";
}

function getRecommendationColor(rec: string): string {
  if (rec === "Hire") return "#16a34a";
  if (rec === "Consider") return "#d97706";
  return "#dc2626";
}

export function generateReportPdf(data: ReportData): void {
  const { candidateName, interviewDate, duration, evaluation } = data;

  const scoreColor = getScoreColor(evaluation.score);
  const recColor = getRecommendationColor(evaluation.recommendation);

  const content: Content[] = [
    // Header
    {
      text: "Interview Evaluation Report",
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      text: "Techcitta AI-Powered Interview",
      style: "subheader",
      alignment: "center",
      margin: [0, 0, 0, 20] as [number, number, number, number],
    },

    // Candidate Info
    {
      columns: [
        {
          width: "*",
          text: [
            { text: "Candidate: ", bold: true },
            candidateName,
          ],
        },
        {
          width: "*",
          text: [
            { text: "Date: ", bold: true },
            interviewDate,
          ],
        },
        {
          width: "*",
          text: [
            { text: "Duration: ", bold: true },
            duration,
          ],
        },
      ],
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },

    // Divider
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" }] },
    { text: "", margin: [0, 10, 0, 10] as [number, number, number, number] },

    // Score
    {
      text: "Overall Score",
      style: "sectionHeader",
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      text: `${evaluation.score.toFixed(1)} / 10`,
      style: { fontSize: 28, color: scoreColor, bold: true },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },

    // Recommendation
    {
      text: "Recommendation",
      style: "sectionHeader",
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      text: evaluation.recommendation,
      style: { fontSize: 18, color: recColor, bold: true },
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },

    // Strengths
    {
      text: "Strengths",
      style: "sectionHeader",
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      ul: evaluation.strengths.map((s) => ({ text: s, margin: [0, 2, 0, 2] as [number, number, number, number] })),
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },

    // Areas for Improvement
    {
      text: "Areas for Improvement",
      style: "sectionHeader",
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      ul: evaluation.areasForImprovement.map((s) => ({ text: s, margin: [0, 2, 0, 2] as [number, number, number, number] })),
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },

    // Topics to Learn
    {
      text: "Topics to Learn & Grow",
      style: "sectionHeader",
      margin: [0, 0, 0, 5] as [number, number, number, number],
    },
    {
      ol: evaluation.topicsToLearn.map((s) => ({ text: s, margin: [0, 2, 0, 2] as [number, number, number, number] })),
      margin: [0, 0, 0, 15] as [number, number, number, number],
    },

    // Per-Question Breakdown
    ...(evaluation.questionScores.length > 0
      ? [
          { text: "Per-Question Breakdown", style: "sectionHeader" as const, margin: [0, 0, 0, 8] as [number, number, number, number] },
          ...evaluation.questionScores.flatMap((q, i) => [
            {
              columns: [
                {
                  width: "*",
                  text: `Q${i + 1}. ${q.question}`,
                  bold: true,
                  fontSize: 10,
                },
                {
                  width: 60,
                  text: `${q.score.toFixed(1)}/10`,
                  alignment: "right" as const,
                  color: getScoreColor(q.score),
                  bold: true,
                  fontSize: 10,
                },
              ],
              margin: [0, 8, 0, 3] as [number, number, number, number],
            },
            {
              text: q.feedback || "",
              fontSize: 9,
              color: "#6b7280",
              margin: [10, 0, 0, 5] as [number, number, number, number],
            },
          ]),
        ]
      : []),

    // Footer
    { text: "", margin: [0, 20, 0, 0] as [number, number, number, number] },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" }] },
    {
      text: `Generated by Techcitta • ${new Date().toLocaleDateString()}`,
      alignment: "center",
      fontSize: 8,
      color: "#9ca3af",
      margin: [0, 10, 0, 0] as [number, number, number, number],
    },
  ];

  const docDefinition: TDocumentDefinitions = {
    content,
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.4,
    },
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        color: "#1e1b4b",
      },
      subheader: {
        fontSize: 12,
        color: "#6b7280",
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: "#374151",
      },
    },
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
  };

  pdfMake.createPdf(docDefinition).download(`interview-report-${Date.now()}.pdf`);
}
