import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_questions(resume_text: str, job_description: str = None, num_questions: int = 10) -> list[dict]:
    """
    Generate personalized interview questions based on resume.
    Returns list of {question, category, skill} dicts.
    Categories: technical, behavioral, project_based, problem_solving, skill_based
    """
    jd_context = ""
    if job_description:
        jd_context = f"\n\nJob Description:\n{job_description[:3000]}"

    prompt = f"""You are an expert technical interviewer. Generate {num_questions} personalized interview questions 
based on this candidate's resume. 

QUESTION DISTRIBUTION (mix these categories):
- 2-3 Technical questions (general technical knowledge, architecture, best practices)
- 2-3 Behavioral questions (past experiences, challenges, teamwork, leadership)
- 2-3 Project-based questions (deep dive into specific projects they mention)
- 1-2 Problem-solving questions (hypothetical scenarios, system design)
- 2-3 Skill-based questions (specifically about skills listed in their resume - e.g., if they list "Python", ask about their Python experience; if they list "Docker", ask about their Docker usage)

SKILL-BASED QUESTIONS ARE IMPORTANT:
- Extract skills from their resume (programming languages, frameworks, tools, cloud services)
- Ask questions like: "I see you have experience with [SKILL]. Can you tell me about how you've used it?"
- Or: "You mentioned [SKILL] in your skills. What's the most complex thing you've built with it?"
- Each skill-based question should include the skill name in the question

IMPORTANT RULES:
1. Questions must be specific to THIS candidate's resume
2. Reference their actual projects, companies, and skills
3. Start with easier questions and progress to harder ones
4. Each question should be 1-2 sentences max
5. Make questions conversational, not interrogative
6. Do NOT ask about basic definitions - ask about their experience
7. Each question MUST include a "skill" field (the primary skill/topic being tested)

Resume:
{resume_text[:4000]}
{jd_context}

Return JSON array with exactly {num_questions} questions:
[
  {{"question": "...", "category": "technical", "skill": "System Design"}},
  {{"question": "...", "category": "skill_based", "skill": "Python"}},
  {{"question": "...", "category": "behavioral", "skill": "Teamwork"}},
  {{"question": "...", "category": "project_based", "skill": "RAG Pipeline"}},
  ...
]

Only return the JSON array, no other text."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert technical interviewer who asks insightful, personalized questions."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or '{"questions": []}'
    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed[:num_questions]
        elif isinstance(parsed, dict) and "questions" in parsed:
            return parsed["questions"][:num_questions]
    except json.JSONDecodeError:
        pass

    return [
        {"question": "Tell me about your experience with the technologies on your resume.", "category": "technical"},
        {"question": "Describe a challenging project you worked on and how you overcame obstacles.", "category": "behavioral"},
        {"question": "Walk me through a recent project from start to finish.", "category": "project_based"},
        {"question": "If you had to scale a system to handle 10x more users, what would you do?", "category": "problem_solving"},
    ]


def evaluate_answer(question: str, answer: str, resume_text: str, question_number: int, total_questions: int) -> dict:
    """
    Evaluate a candidate's answer in real-time.
    Returns {score, feedback, follow_up} where follow_up is optional.
    """
    prompt = f"""You are evaluating a candidate's interview answer. Be honest and constructive.

Question #{question_number}/{total_questions}: {question}

Candidate's Answer: {answer}

Candidate's Resume Context (for reference):
{resume_text[:2000]}

Evaluate this answer:
1. Score (0-10): How well did they answer?
   - 0-3: Poor/irrelevant
   - 4-5: Basic understanding, lacks depth
   - 6-7: Good answer, shows competence
   - 8-9: Excellent, detailed with examples
   - 10: Outstanding, demonstrates mastery

2. Brief feedback (1 sentence): What was good or what's missing?

3. Follow-up question (optional): If the answer was vague or incomplete, ask a follow-up. Return null if answer was sufficient.

Return JSON:
{{"score": 7, "feedback": "...", "follow_up": "Can you elaborate on..." or null}}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a fair and insightful technical interviewer evaluating answers."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or '{"score": 5, "feedback": "Unable to evaluate.", "follow_up": null}'
    try:
        parsed = json.loads(content)
        return {
            "score": min(10, max(0, parsed.get("score", 5))),
            "feedback": parsed.get("feedback", "No feedback available."),
            "follow_up": parsed.get("follow_up"),
        }
    except json.JSONDecodeError:
        return {"score": 5, "feedback": "Evaluation error.", "follow_up": None}


def generate_summary(questions_and_answers: list[dict], resume_text: str) -> dict:
    """
    Generate final interview summary after all questions are answered.
    """
    qa_text = ""
    for i, qa in enumerate(questions_and_answers, 1):
        qa_text += f"\nQ{i} ({qa.get('category', 'unknown')}): {qa['question']}\n"
        qa_text += f"A{i}: {qa.get('answer', 'No answer')}\n"
        qa_text += f"Score: {qa.get('score', 0)}/10\n"

    prompt = f"""Generate a comprehensive interview summary based on the candidate's performance.

Resume:
{resume_text[:2000]}

Interview Q&A:
{qa_text}

Provide:
1. Overall score (0-100) based on all answers
2. Summary (2-3 sentences about the candidate's performance)
3. Strengths (top 3)
4. Weaknesses (top 3 areas for improvement)
5. Recommendation: "STRONG HIRE", "HIRE", "MAYBE", or "NO HIRE"
6. Interview prediction: How would they perform in a real interview?

Return JSON:
{{
  "overallScore": 72,
  "summary": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "recommendation": "HIRE",
  "interviewPrediction": "..."
}}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert hiring manager providing fair, comprehensive interview evaluation."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or '{}'
    try:
        parsed = json.loads(content)
        return {
            "overallScore": parsed.get("overallScore", 50),
            "summary": parsed.get("summary", "No summary available."),
            "strengths": parsed.get("strengths", []),
            "weaknesses": parsed.get("weaknesses", []),
            "recommendation": parsed.get("recommendation", "MAYBE"),
            "interviewPrediction": parsed.get("interviewPrediction", ""),
        }
    except json.JSONDecodeError:
        return {
            "overallScore": 50,
            "summary": "Unable to generate summary.",
            "strengths": [],
            "weaknesses": [],
            "recommendation": "MAYBE",
            "interviewPrediction": "",
        }
