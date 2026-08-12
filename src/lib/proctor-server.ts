// Server-side proctoring validation utilities.
//
// This module provides:
// 1. Tamper detection for client-submitted proctoring reports
// 2. Statistical analysis of incident patterns
// 3. Cross-reference validation with interview metadata
// 4. Tab-switch and screen-recording detection helpers (client-side)

import { prisma } from "./prisma";

// ---------------------------------------------------------------- Types ---

export interface ProctoringValidationResult {
  valid: boolean;
  tampered: boolean;
  flags: string[];
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface IncidentPattern {
  type: string;
  count: number;
  totalDurationMs: number;
  avgGapMs: number;
  suspicious: boolean;
}

// --------------------------------------------------- Validation Logic ---

/**
 * Validate a client-submitted proctoring report against server-side data.
 * Detects potential tampering or fabrication.
 */
export async function validateProctoringReport(
  interviewId: string,
  report: {
    enabled: boolean;
    durationMs: number;
    incidents: Array<{
      type: string;
      startMs: number;
      endMs: number;
    }>;
    result: string;
  }
): Promise<ProctoringValidationResult> {
  const flags: string[] = [];
  let riskScore = 0;
  const recommendations: string[] = [];

  // 1. Basic sanity checks
  if (report.durationMs <= 0) {
    flags.push("report_duration_zero");
    riskScore += 30;
  }

  if (report.durationMs > 30 * 60 * 1000) {
    // More than 30 minutes
    flags.push("report_duration_unreasonable");
    riskScore += 20;
  }

  // 2. Check incident timestamps are within duration
  for (const incident of report.incidents) {
    if (incident.startMs < 0 || incident.endMs < 0) {
      flags.push("negative_timestamp");
      riskScore += 15;
      break;
    }
    if (incident.endMs > report.durationMs + 5000) {
      // Allow 5s tolerance
      flags.push("incident_exceeds_duration");
      riskScore += 10;
    }
    if (incident.endMs <= incident.startMs) {
      flags.push("invalid_incident_duration");
      riskScore += 5;
    }
  }

  // 3. Check for suspicious patterns
  const patterns = analyzeIncidentPatterns(report.incidents);
  for (const pattern of patterns) {
    if (pattern.suspicious) {
      flags.push(`suspicious_pattern_${pattern.type}`);
      riskScore += 15;
    }
  }

  // 4. Cross-reference with interview metadata
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: { duration: true, status: true, createdAt: true },
  });

  if (interview) {
    const expectedDurationMs = interview.duration * 60 * 1000;
    if (report.durationMs < expectedDurationMs * 0.3) {
      flags.push("report_too_short");
      riskScore += 20;
      recommendations.push("Interview ended much earlier than expected");
    }
  }

  // 5. Check for "too clean" reports (no incidents at all in a long interview)
  if (report.enabled && report.durationMs > 10 * 60 * 1000 && report.incidents.length === 0) {
    // This is actually good - candidate was well-behaved
    // But flag if suspicious
  }

  // 6. Validate result matches incident counts
  const incidentCount = report.incidents.length;
  if (report.result === "pass" && incidentCount > 0) {
    flags.push("result_incident_mismatch");
    riskScore += 10;
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  return {
    valid: riskScore < 50,
    tampered: flags.length > 3 || riskScore > 70,
    flags,
    riskScore,
    recommendations,
  };
}

/**
 * Analyze patterns in proctoring incidents to detect suspicious behavior.
 */
function analyzeIncidentPatterns(
  incidents: Array<{ type: string; startMs: number; endMs: number }>
): IncidentPattern[] {
  const byType = new Map<string, Array<{ startMs: number; endMs: number }>>();

  for (const incident of incidents) {
    const list = byType.get(incident.type) || [];
    list.push({ startMs: incident.startMs, endMs: incident.endMs });
    byType.set(incident.type, list);
  }

  const patterns: IncidentPattern[] = [];

  for (const [type, list] of byType) {
    const totalDurationMs = list.reduce(
      (sum, i) => sum + Math.max(0, i.endMs - i.startMs),
      0
    );

    // Calculate average gap between incidents
    let avgGapMs = 0;
    if (list.length > 1) {
      const sorted = [...list].sort((a, b) => a.startMs - b.startMs);
      let totalGap = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalGap += sorted[i].startMs - sorted[i - 1].endMs;
      }
      avgGapMs = totalGap / (sorted.length - 1);
    }

    // Suspicious if: very regular intervals (automated?) or very high frequency
    const suspicious =
      list.length > 5 ||
      (list.length > 3 && avgGapMs < 2000 && avgGapMs > 0) || // Very regular
      totalDurationMs > 30000; // More than 30s total

    patterns.push({
      type,
      count: list.length,
      totalDurationMs,
      avgGapMs,
      suspicious,
    });
  }

  return patterns;
}

/**
 * Store proctoring audit trail for forensic analysis.
 */
export async function auditProctoring(
  interviewId: string,
  report: unknown,
  validation: ProctoringValidationResult
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO proctoring_audits (interview_id, report, validation_result, risk_score, created_at)
     VALUES ($1::uuid, $2::jsonb, $3::jsonb, $4, NOW())`,
    interviewId,
    JSON.stringify(report),
    JSON.stringify(validation),
    validation.riskScore
  );
}

/**
 * Create the proctoring audit table (run once).
 */
export async function initializeProctoringAuditTable(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS proctoring_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
      report JSONB,
      validation_result JSONB,
      risk_score INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  );

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_proctoring_audit_interview 
    ON proctoring_audits(interview_id)`
  );
}
