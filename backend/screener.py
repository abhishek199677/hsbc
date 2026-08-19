import json
import re

from openai import OpenAI

from client_jds import ClientJDConfig


def _get_client() -> OpenAI:
    import os
    from dotenv import load_dotenv

    load_dotenv()
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _build_prompt(jd: ClientJDConfig, resume_text: str) -> str:
    mandatory = "\n".join(f"- {r}" for r in jd.mandatory_requirements) if jd.mandatory_requirements else "None specified"
    domain = "\n".join(f"- {r}" for r in jd.domain_requirements) if jd.domain_requirements else "None specified"

    return f"""You are a brutally honest, senior technical recruitment screener working for an IT staffing company. Your job is to protect the company's reputation with the client by ensuring only genuinely qualified candidates get submitted. You have ZERO tolerance for inflated resumes, buzzword stuffing, or skill mismatches.

I am giving you a JOB DESCRIPTION (JD) and a CANDIDATE RESUME. Evaluate the resume against the JD with extreme honesty. Do NOT be polite. Do NOT give benefit of the doubt. Assume the client will do a deep technical interview and any gap WILL be exposed.

Give me the following output in this EXACT structure:

---

## 1. VERDICT (Pick ONE — no hedging)
🔴 STRONG SUBMIT — High confidence. This candidate will clear technical screening.
🟡 SUBMIT WITH CAUTION — Decent match but has gaps. Flag the gaps to the client upfront.
🟢 DO NOT SUBMIT — Will damage our credibility. Reject immediately.

## 2. MATCH SCORE: ___/100

Break this into:
- Must-Have Skills Match: ___/40 (list each must-have skill from JD → does resume prove it? Yes/No/Partial)
- Domain/Industry Match: ___/20 (does the candidate come from the right industry/domain as specified in JD?)
- Experience Level Match: ___/15 (is their seniority and years within the JD's range?)
- Nice-to-Have Skills: ___/10 (how many bonus skills from the JD does the candidate have?)
- Resume Quality & Credibility: ___/15 (is the resume well-written, specific, quantified, or vague and generic?)

## 3. MUST-HAVE SKILL BREAKDOWN (Be specific)

For EACH must-have skill or requirement listed in the JD, give me:

| Skill/Requirement from JD | Found in Resume? | Evidence from Resume | Confidence |
|---|---|---|---|
| (skill 1) | Yes / No / Partial | (exact quote or section from resume, or "NOT FOUND") | High / Medium / Low / None |
| (skill 2) | ... | ... | ... |
| ... | ... | ... | ... |

## 4. RED FLAGS (Things that would embarrass us if we submit)

List every concern. Examples:
- Skills listed but no project evidence (buzzword stuffing)
- Experience gaps or unexplained job hops
- Claims that don't add up (e.g., "10 years experience" but graduated 6 years ago)
- Resume says "exposure to" or "familiar with" instead of "built" or "implemented" (surface-level knowledge)
- Generic resume not tailored — same resume probably sent for 20 different roles
- Domain mismatch (JD says health insurance, resume shows only retail/banking)
- Technology version mismatch (JD needs current tech, resume shows outdated versions)

## 5. DOMAIN FIT (Critical for domain-specific roles)

- Does the JD require specific domain experience (e.g., health insurance, banking, healthcare)?
- Does the candidate have it? Be specific — name the companies, projects, or processes from their resume that prove it.
- If the JD says "mandatory" for domain and candidate has zero → automatic DO NOT SUBMIT regardless of technical skills.

## 6. WHAT WILL HAPPEN IN THE INTERVIEW (Prediction)

Based on the resume gaps, predict:
- Which questions will the candidate struggle with?
- Where will they get caught if their experience is inflated?
- What will the interviewer likely probe on?

## 7. FINAL RECOMMENDATION (2-3 lines, no fluff)

In plain language, tell the recruiter: should we submit or not, and why? If submitting, what should we warn the client about? If not submitting, what would need to change (different role, more experience, etc.)?

---

RULES FOR YOUR EVALUATION:
- "Exposure to" or "knowledge of" or "familiar with" does NOT equal hands-on experience. Score these as PARTIAL at best.
- If the resume lists a skill in the skills section but ZERO projects mention it → flag as buzzword stuffing.
- If the JD says "mandatory" or "must-have" and the candidate lacks it → they CANNOT score above 50/100 regardless of other strengths.
- A 10-year experienced candidate applying for a 5-year role is NOT automatically a good fit — check if their experience is actually relevant.
- Pretty formatting on a resume does not equal quality. Judge content, not design.
- If you are not confident, say so. "I can't verify this" is better than "seems fine."
- Compare the SPECIFIC technologies, versions, and tools — not just categories. JD says "React" but resume shows "Angular" = that's a gap, not a match.
- Look at RECENCY — a skill used 5 years ago and never again is not current expertise.

---

JOB DESCRIPTION (JD):
Client: {jd.client_name}
Role: {jd.job_title}

{jd.full_jd}

Must-Have Skills: {", ".join(jd.must_have_skills)}
Nice-to-Have Skills: {", ".join(jd.nice_to_have_skills)}
Experience Range: {jd.experience_min}-{jd.experience_max} years
Mandatory Requirements:
{mandatory}
Domain Requirements:
{domain}

---

CANDIDATE RESUME:
{resume_text}

---

NOW EVALUATE THE CANDIDATE AGAINST THIS JD using the structure above. Be brutally honest. Do not hedge."""


def _extract_section(text: str, start_marker: str, end_marker: str | None = None) -> str:
    idx = text.find(start_marker)
    if idx == -1:
        return ""
    start = idx + len(start_marker)
    if end_marker:
        end_idx = text.find(end_marker, start)
        if end_idx == -1:
            return text[start:].strip()
        return text[start:end_idx].strip()
    return text[start:].strip()


def _parse_response(raw: str) -> dict:
    verdict = "DO NOT SUBMIT"
    verdict_upper = raw.upper()
    if "STRONG SUBMIT" in verdict_upper:
        verdict = "STRONG SUBMIT"
    elif "SUBMIT WITH CAUTION" in verdict_upper:
        verdict = "SUBMIT WITH CAUTION"

    def _score(pattern: str, default: int = 0) -> int:
        m = re.search(pattern, raw, re.IGNORECASE)
        return int(m.group(1)) if m else default

    match_score = _score(r"MATCH SCORE[:\s]*(\d+)\s*/\s*100")
    must_have = _score(r"Must-Have Skills Match[:\s]*(\d+)\s*/\s*40")
    domain = _score(r"Domain/Industry Match[:\s]*(\d+)\s*/\s*20")
    experience = _score(r"Experience Level Match[:\s]*(\d+)\s*/\s*15")
    nice = _score(r"Nice-to-Have Skills[:\s]*(\d+)\s*/\s*10")
    quality = _score(r"Resume Quality & Credibility[:\s]*(\d+)\s*/\s*15")

    must_have_breakdown = []
    for m in re.finditer(r"\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|", raw):
        cells = [c.strip() for c in m.groups()]
        if cells[0].lower().startswith("skill"):
            continue
        found = "No"
        if "yes" in cells[1].lower():
            found = "Yes"
        elif "partial" in cells[1].lower():
            found = "Partial"
        confidence = "None"
        conf_lower = cells[3].lower()
        if "high" in conf_lower:
            confidence = "High"
        elif "medium" in conf_lower:
            confidence = "Medium"
        elif "low" in conf_lower:
            confidence = "Low"
        must_have_breakdown.append({
            "skill": cells[0].strip(),
            "found": found,
            "evidence": cells[2].strip(),
            "confidence": confidence,
        })

    red_flags_section = _extract_section(raw, "## 4. RED FLAGS", "## 5.")
    red_flags = [
        line.lstrip("- ").strip()
        for line in red_flags_section.split("\n")
        if line.strip().startswith("- ")
    ]

    domain_fit = _extract_section(raw, "## 5. DOMAIN FIT", "## 6.") or "Not assessed"
    interview = _extract_section(raw, "## 6. WHAT WILL HAPPEN", "## 7.") or "Not assessed"
    final = _extract_section(raw, "## 7. FINAL RECOMMENDATION") or "Not assessed"

    return {
        "verdict": verdict,
        "matchScore": match_score,
        "scores": {
            "mustHaveSkillsMatch": must_have,
            "domainIndustryMatch": domain,
            "experienceLevelMatch": experience,
            "niceToHaveSkills": nice,
            "resumeQualityCredibility": quality,
        },
        "mustHaveBreakdown": must_have_breakdown,
        "redFlags": red_flags,
        "domainFit": domain_fit,
        "interviewPrediction": interview,
        "finalRecommendation": final,
        "rawResponse": raw,
    }


def screen_candidate(jd: ClientJDConfig, resume_text: str) -> dict:
    client = _get_client()
    prompt = _build_prompt(jd, resume_text)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert technical recruitment screener. You evaluate candidates "
                    "against job descriptions with extreme honesty and precision. You output "
                    "structured evaluations in the exact format requested. Never soften your "
                    "assessment. The client will do deep technical interviews and any gap you "
                    "miss will damage the company's credibility."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=4000,
    )

    raw = response.choices[0].message.content or ""
    if not raw:
        raise RuntimeError("Empty response from AI screening")

    return _parse_response(raw)
