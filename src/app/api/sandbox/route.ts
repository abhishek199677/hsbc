import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/authorization";
import { rateLimitByIp } from "@/lib/rateLimit";

const EVALUATOR_URL = process.env.SANDBOX_URL || "http://localhost:8003";

/**
 * POST /api/sandbox - Execute code in the Docker sandbox.
 *
 * Proxies the request to the evaluator server (port 8003) which
 * runs the code in an isolated environment and returns results.
 */
export async function POST(request: Request) {
  try {
    const user = await getActiveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 requests per minute per user
    const userLimit = await rateLimitByIp(request, "sandbox", {
      limit: 20,
      windowMs: 60_000,
    });
    if (!userLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { code, language, testCases, timeout } = body;

    // Validate
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    if (code.length > 50000) {
      return NextResponse.json({ error: "Code exceeds 50KB limit" }, { status: 400 });
    }
    if (!language || !["javascript", "typescript", "python", "java", "cpp", "go"].includes(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json({ error: "testCases array is required" }, { status: 400 });
    }
    if (testCases.length > 20) {
      return NextResponse.json({ error: "Maximum 20 test cases" }, { status: 400 });
    }

    // Forward to evaluator server
    const evaluatorRes = await fetch(`${EVALUATOR_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language,
        testCases,
        timeout: timeout || 10,
      }),
      signal: AbortSignal.timeout(35000), // 35s total timeout (slightly more than sandbox timeout)
    });

    if (!evaluatorRes.ok) {
      const errorText = await evaluatorRes.text();
      console.error("Evaluator error:", errorText);
      return NextResponse.json(
        { error: "Code execution service unavailable" },
        { status: 502 }
      );
    }

    const result = await evaluatorRes.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sandbox API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sandbox - Check if sandbox is available.
 */
export async function GET() {
  try {
    const res = await fetch(`${EVALUATOR_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return NextResponse.json({ available: true });
    }
    return NextResponse.json({ available: false });
  } catch {
    return NextResponse.json({ available: false });
  }
}
