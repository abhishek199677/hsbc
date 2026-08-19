/**
 * Export interview metrics as CSV for ML training.
 *
 * Usage:
 *   npx tsx scripts/exportTrainingData.ts
 *
 * Outputs: ml/training_data.csv
 */

import { prisma } from "../src/lib/prisma";
import { writeFileSync } from "fs";
import { join } from "path";

const CSV_HEADERS = [
  "wordCount",
  "avgResponseLen",
  "technicalTerms",
  "positiveSignals",
  "negativeSignals",
  "questionCount",
  "experienceLevel",
  "role",
  "skills",
  "difficulty",
  "codingPassRate",
  "proctorFlags",
  "performanceScores",
  "llmScore",
  "recommendation",
];

function escapeCsv(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log("Fetching interview metrics from database...");

  const metrics = await prisma.interviewMetrics.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (metrics.length === 0) {
    console.log("No interview metrics found. Run some interviews first to collect training data.");
    console.log("The InterviewMetrics table is created and ready to collect data from future interviews.");
    process.exit(0);
  }

  console.log(`Found ${metrics.length} interview records.`);

  const rows = metrics.map((m) =>
    CSV_HEADERS.map((h) => {
      const key = h as keyof typeof m;
      const val = m[key];
      return escapeCsv(val as string | number | null);
    }).join(",")
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");
  const outputPath = join(process.cwd(), "ml", "training_data.csv");
  writeFileSync(outputPath, csv, "utf-8");

  console.log(`Exported to ${outputPath}`);
  console.log(`${metrics.length} rows, ${CSV_HEADERS.length} columns`);

  // Print summary
  const scores = metrics.map((m) => m.llmScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`\nScore distribution:`);
  console.log(`  Average: ${avg.toFixed(2)}`);
  console.log(`  Min: ${Math.min(...scores).toFixed(1)}`);
  console.log(`  Max: ${Math.max(...scores).toFixed(1)}`);

  const levels = metrics.reduce((acc, m) => {
    acc[m.experienceLevel] = (acc[m.experienceLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`\nExperience levels:`);
  Object.entries(levels).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
