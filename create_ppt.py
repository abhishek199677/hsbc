from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# ── Color Palette ──
BG_DARK    = RGBColor(0x0F, 0x17, 0x2A)
BG_CARD    = RGBColor(0x16, 0x20, 0x3A)
ACCENT     = RGBColor(0x00, 0x96, 0xFF)
ACCENT2    = RGBColor(0x00, 0xD4, 0xAA)
ACCENT3    = RGBColor(0xFF, 0x6B, 0x35)
ACCENT4    = RGBColor(0xA8, 0x55, 0xF7)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY = RGBColor(0xB0, 0xBC, 0xD4)
MID_GRAY   = RGBColor(0x60, 0x6E, 0x8A)
GREEN      = RGBColor(0x00, 0xD4, 0xAA)
RED        = RGBColor(0xFF, 0x45, 0x45)
YELLOW     = RGBColor(0xFF, 0xD6, 0x00)
PURPLE     = RGBColor(0xA8, 0x55, 0xF7)
ORANGE     = RGBColor(0xFF, 0x9F, 0x43)

# ── Helpers ──
def set_slide_bg(slide, color=BG_DARK):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_rect(slide, left, top, width, height, fill_color=BG_CARD, border_color=None, radius=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
    else:
        shape.line.fill.background()
    return shape

def add_text(slide, left, top, width, height, text, font_size=14, color=WHITE, bold=False, alignment=PP_ALIGN.LEFT, font_name="Segoe UI"):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    return txBox

def add_circle(slide, left, top, size, fill_color):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, size, size)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    return shape

def add_line_shape(slide, x1, y1, x2, y2, color=ACCENT, width=2):
    connector = slide.shapes.add_connector(1, x1, y1, x2, y2)  # 1 = straight
    connector.line.color.rgb = color
    connector.line.width = Pt(width)
    return connector

def add_arrow(slide, left, top, width, height, color=ACCENT):
    shape = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape

def slide_number(slide, num):
    add_text(slide, Inches(12.4), Inches(7.0), Inches(0.8), Inches(0.4),
             str(num), font_size=11, color=MID_GRAY, alignment=PP_ALIGN.RIGHT)

# ════════════════════════════════════════════════════════════════════
# SLIDE 1 – TITLE
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
set_slide_bg(slide)

# Decorative top bar
add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.08), ACCENT)

# Accent circle decorations
add_circle(slide, Inches(0.3), Inches(0.5), Inches(0.6), ACCENT)
add_circle(slide, Inches(11.8), Inches(5.8), Inches(0.8), RGBColor(0x00, 0x96, 0xFF))

add_text(slide, Inches(1.5), Inches(1.5), Inches(10), Inches(1),
         "TECHCITTA", font_size=52, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1.5), Inches(2.4), Inches(10), Inches(0.8),
         "Architecture & System Design", font_size=30, color=ACCENT, bold=False, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1.5), Inches(3.2), Inches(10), Inches(0.6),
         "AI-Powered Hiring Platform  |  Talent to Talent", font_size=18, color=LIGHT_GRAY, alignment=PP_ALIGN.CENTER)

# Divider line
add_rect(slide, Inches(5.5), Inches(4.0), Inches(2.3), Inches(0.04), ACCENT)

add_text(slide, Inches(1.5), Inches(4.5), Inches(10), Inches(0.5),
         "Client-Friendly Technical Overview", font_size=16, color=MID_GRAY, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1.5), Inches(5.2), Inches(10), Inches(0.5),
         "August 2026  |  Confidential", font_size=13, color=MID_GRAY, alignment=PP_ALIGN.CENTER)
slide_number(slide, 1)

# ════════════════════════════════════════════════════════════════════
# SLIDE 2 – WHAT IS TECHCITTA
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(8), Inches(0.6),
         "What Is Techcitta?", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(2.5), Inches(0.04), ACCENT)

# Main description card
card = add_rect(slide, Inches(0.6), Inches(1.4), Inches(12.1), Inches(1.4), BG_CARD, ACCENT)
tf = card.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "An AI-powered hiring platform where candidates record video interviews"
p.font.size = Pt(18)
p.font.color.rgb = WHITE
p.font.name = "Segoe UI"
p.alignment = PP_ALIGN.CENTER
p2 = tf.add_paragraph()
p2.text = "that are automatically evaluated by AI, and admins review results on a dashboard."
p2.font.size = Pt(18)
p2.font.color.rgb = WHITE
p2.font.name = "Segoe UI"
p2.alignment = PP_ALIGN.CENTER

# Flow diagram
flow_items = ["Signup", "Fill Profile\n(7 Steps)", "Schedule\nInterview", "AI Interview\n(6 Questions)", "AI Scores\n& Recommends", "Admin Reviews\nDashboard"]
colors = [ACCENT, ACCENT2, ACCENT3, PURPLE, ORANGE, GREEN]
start_x = 0.4
for i, (item, col) in enumerate(zip(flow_items, colors)):
    x = start_x + i * 2.1
    box = add_rect(slide, Inches(x), Inches(3.3), Inches(1.8), Inches(1.2), BG_CARD, col)
    tf = box.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = item
    p.font.size = Pt(12)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = "Segoe UI"
    if i < len(flow_items) - 1:
        add_arrow(slide, Inches(x + 1.85), Inches(3.7), Inches(0.2), Inches(0.35), col)

# Key features
features = [
    ("AI Video Interview", "AI asks 6 questions, scores answers,\nrecommends Hire/Consider/Reject"),
    ("Anti-Cheating", "Detects if candidate looks away,\nhides face, or another person appears"),
    ("Multi-Tenant", "Each company gets isolated workspace\nwith separate data & branding"),
    ("Plan System", "Starter (3/mo), Pro (100/mo),\nEnterprise (Unlimited)")
]
for i, (title, desc) in enumerate(features):
    x = 0.6 + i * 3.1
    box = add_rect(slide, Inches(x), Inches(5.0), Inches(2.8), Inches(2.0), BG_CARD, colors[i])
    tf = box.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(14)
    p.font.color.rgb = colors[i]
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(11)
    p2.font.color.rgb = LIGHT_GRAY
    p2.font.name = "Segoe UI"
    p2.alignment = PP_ALIGN.CENTER

slide_number(slide, 2)

# ════════════════════════════════════════════════════════════════════
# SLIDE 3 – 5-LAYER ARCHITECTURE OVERVIEW
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(8), Inches(0.6),
         "System Architecture – 5 Layers", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.2), Inches(0.04), ACCENT)

layers = [
    ("LAYER 1: FRONTEND", "React 19 + Next.js 16 + Tailwind CSS", ACCENT, "16+ Pages: Landing, Signup, Profile, Interview Room,\nAdmin Dashboard, Pricing, Settings, GDPR"),
    ("LAYER 2: MIDDLEWARE", "Security Gate – Every Request Passes Through", ACCENT2, "Rate Limiting | JWT Auth | CORS | Input Validation\nOrg Isolation | Plan Enforcement"),
    ("LAYER 3: BACKEND", "16 API Routes (Serverless Functions on Vercel)", PURPLE, "Auth, Profile, Interview, AI Engine, Upload,\nBilling, Admin, Account, Reminders"),
    ("LAYER 4: DATABASE", "Turso (libSQL Cloud) + Prisma ORM", ORANGE, "5 Tables: Organization, User, Profile,\nInterview, VerificationToken"),
    ("LAYER 5: EXTERNAL SERVICES", "Cloudflare R2 | Stripe | OpenAI | Email | WhatsApp", GREEN, "Video Storage | Payments | AI Brain\nTransactional Email | Reminders"),
]

for i, (title, tech, color, details) in enumerate(layers):
    y = 1.3 + i * 1.15
    # Layer number circle
    circle = add_circle(slide, Inches(0.5), Inches(y + 0.1), Inches(0.55), color)
    tf = circle.text_frame
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = str(i + 1)
    p.font.size = Pt(18)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = "Segoe UI"

    # Card
    card = add_rect(slide, Inches(1.2), Inches(y), Inches(11.5), Inches(1.0), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.LEFT
    p = tf.paragraphs[0]
    p.text = f"  {title}"
    p.font.size = Pt(15)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = f"  {tech}  |  {details}"
    p2.font.size = Pt(11)
    p2.font.color.rgb = LIGHT_GRAY
    p2.font.name = "Segoe UI"

slide_number(slide, 3)

# ════════════════════════════════════════════════════════════════════
# SLIDE 4 – FRONTEND DEEP DIVE
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(8), Inches(0.6),
         "Layer 1: Frontend (What Users See)", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.5), Inches(0.04), ACCENT)

# Tech stack box
tech_box = add_rect(slide, Inches(0.6), Inches(1.3), Inches(5.5), Inches(1.0), BG_CARD, ACCENT)
tf = tech_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  Tech Stack: React 19  |  Next.js 16  |  Tailwind CSS  |  TypeScript"
p.font.size = Pt(14)
p.font.color.rgb = ACCENT
p.font.bold = True
p.font.name = "Segoe UI"
p2 = tf.add_paragraph()
p2.text = "  Runs entirely in the user's browser (Mobile + Desktop)"
p2.font.size = Pt(12)
p2.font.color.rgb = LIGHT_GRAY
p2.font.name = "Segoe UI"

# Pages grid
public_pages = [
    ("Landing Page", "/"),
    ("Signup & Login", "/signup, /login"),
    ("Pricing", "/pricing"),
    ("Enterprise", "/enterprise"),
    ("Terms & Privacy", "/terms, /privacy"),
]

user_pages = [
    ("Profile Wizard", "/profile (7 steps)"),
    ("Interview Schedule", "/interview"),
    ("AI Live Room", "/interview/live"),
    ("Confirmation", "/confirmation"),
    ("Settings & GDPR", "/settings"),
]

admin_pages = [
    ("Admin Dashboard", "/admin"),
    ("User Management", "/admin (user list)"),
    ("Interview Reviews", "/admin (video playback)"),
    ("Billing Portal", "/settings (Stripe)"),
]

sections = [
    ("Public Pages", public_pages, ACCENT, 0.5),
    ("User Pages", user_pages, ACCENT2, 4.5),
    ("Admin Pages", admin_pages, PURPLE, 8.5),
]

for title, pages, color, start_x in sections:
    box = add_rect(slide, Inches(start_x), Inches(2.6), Inches(4.0), Inches(4.5), BG_CARD, color)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = f"  {title}"
    p.font.size = Pt(16)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    for pg_name, pg_path in pages:
        p2 = tf.add_paragraph()
        p2.text = f"    {pg_name}"
        p2.font.size = Pt(12)
        p2.font.color.rgb = WHITE
        p2.font.name = "Segoe UI"
        p3 = tf.add_paragraph()
        p3.text = f"      {pg_path}"
        p3.font.size = Pt(10)
        p3.font.color.rgb = MID_GRAY
        p3.font.name = "Segoe UI"
        p4 = tf.add_paragraph()
        p4.text = ""
        p4.font.size = Pt(4)

slide_number(slide, 4)

# ════════════════════════════════════════════════════════════════════
# SLIDE 5 – MIDDLEWARE
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "Layer 2: Middleware (Security Gate)", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.5), Inches(0.04), ACCENT2)

add_text(slide, Inches(0.6), Inches(1.2), Inches(12), Inches(0.5),
         "Every request must pass through these 6 security checks before reaching the backend:",
         font_size=14, color=LIGHT_GRAY)

middleware_items = [
    ("RATE LIMITER", "Max 20 requests\nper minute per IP", "Blocks brute-force\nattacks", ACCENT, "0.5"),
    ("JWT AUTH\nVERIFIER", "Validates login\ntokens (7-day expiry)", "Only logged-in\nusers can access", ACCENT2, "2.7"),
    ("CORS\nPROTECTOR", "Only allows\ntrusted domains", "Prevents unauthorized\ndomains from access", PURPLE, "4.9"),
    ("INPUT\nVALIDATOR", "Sanitizes email,\npassword, phone", "Prevents injection\nattacks (SQL/XSS)", ORANGE, "7.1"),
    ("ORG\nISOLATOR", "Each company sees\nONLY their data", "Google cannot see\nMicrosoft's data", GREEN, "9.3"),
    ("PLAN\nENFORCER", "Checks interview\nlimits per tier", "Starter: 3/mo\nPro: 100/mo", RED, "11.5"),
]

for title, desc, detail, color, x in middleware_items:
    card = add_rect(slide, Inches(float(x)), Inches(1.9), Inches(2.1), Inches(3.5), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(14)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = ""
    p2.font.size = Pt(6)
    p3 = tf.add_paragraph()
    p3.text = desc
    p3.font.size = Pt(12)
    p3.font.color.rgb = WHITE
    p3.font.name = "Segoe UI"
    p3.alignment = PP_ALIGN.CENTER
    p4 = tf.add_paragraph()
    p4.text = ""
    p4.font.size = Pt(6)
    p5 = tf.add_paragraph()
    p5.text = detail
    p5.font.size = Pt(10)
    p5.font.color.rgb = MID_GRAY
    p5.font.name = "Segoe UI"
    p5.alignment = PP_ALIGN.CENTER

# Bottom note
note_box = add_rect(slide, Inches(0.6), Inches(5.7), Inches(12.1), Inches(1.4), BG_CARD, ACCENT2)
tf = note_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  WHY THIS MATTERS:"
p.font.size = Pt(14)
p.font.color.rgb = ACCENT2
p.font.bold = True
p.font.name = "Segoe UI"
p2 = tf.add_paragraph()
p2.text = "  Without middleware, any user could access any company's data, spam the API, or inject malicious code."
p2.font.size = Pt(12)
p2.font.color.rgb = WHITE
p2.font.name = "Segoe UI"
p3 = tf.add_paragraph()
p3.text = "  Middleware acts as a bouncer – checking IDs, limiting visits, and keeping bad actors out before they reach the server."
p3.font.size = Pt(12)
p3.font.color.rgb = LIGHT_GRAY
p3.font.name = "Segoe UI"

slide_number(slide, 5)

# ════════════════════════════════════════════════════════════════════
# SLIDE 6 – BACKEND API
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(8), Inches(0.6),
         "Layer 3: Backend (16 API Routes)", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.5), Inches(0.04), PURPLE)

add_text(slide, Inches(0.6), Inches(1.2), Inches(12), Inches(0.5),
         "Each route = Serverless Function on Vercel  |  Auto-scales with traffic  |  Pay only for what you use",
         font_size=13, color=LIGHT_GRAY)

api_groups = [
    ("AUTH", ["/signup", "/login"], "Register & authenticate\nusers", ACCENT),
    ("PROFILE", ["GET /profile", "PUT /profile"], "7-step onboarding\nwizard", ACCENT2),
    ("INTERVIEW", ["GET /interview", "POST /interview", "PATCH /interview"], "Schedule, start &\ncomplete interviews", PURPLE),
    ("AI ENGINE", ["POST /ai-interview"], "Generate questions\n& evaluate answers", ORANGE),
    ("UPLOAD", ["POST /upload", "GET /files/*"], "Video & resume\nfile handling", GREEN),
    ("BILLING", ["/checkout", "/webhook", "/portal"], "Stripe subscription\nmanagement", ACCENT),
    ("ADMIN", ["GET /stats", "GET /users"], "Dashboard stats\n& user list", ACCENT2),
    ("ACCOUNT", ["GET /me", "GET /export", "POST /delete"], "GDPR data export\n& deletion", PURPLE),
]

for i, (group, endpoints, desc, color) in enumerate(api_groups):
    row = i // 4
    col = i % 4
    x = 0.5 + col * 3.15
    y = 1.8 + row * 2.8

    card = add_rect(slide, Inches(x), Inches(y), Inches(2.95), Inches(2.5), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = f"  {group}"
    p.font.size = Pt(15)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    for ep in endpoints:
        p2 = tf.add_paragraph()
        p2.text = f"    {ep}"
        p2.font.size = Pt(11)
        p2.font.color.rgb = WHITE
        p2.font.name = "Segoe UI"
    p3 = tf.add_paragraph()
    p3.text = ""
    p3.font.size = Pt(4)
    p4 = tf.add_paragraph()
    p4.text = f"  {desc}"
    p4.font.size = Pt(10)
    p4.font.color.rgb = MID_GRAY
    p4.font.name = "Segoe UI"

slide_number(slide, 6)

# ════════════════════════════════════════════════════════════════════
# SLIDE 7 – DATABASE
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "Layer 4: Database (Turso + Prisma ORM)", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(4.0), Inches(0.04), ORANGE)

# Database tables
tables = [
    ("Organization", ["id", "name", "slug", "plan", "planStatus", "stripeCustomerId", "primaryColor", "accentColor"], ORANGE, 0.5),
    ("User", ["id", "email", "password (bcrypt)", "name", "role", "emailVerifiedAt", "organizationId"], ACCENT, 3.8),
    ("Profile", ["userId", "resumeUrl", "aboutYou", "skills[]", "education", "step", "isComplete"], ACCENT2, 7.1),
    ("Interview", ["userId", "date", "time", "status", "videoUrl", "evaluation", "evaluationScore", "proctoringReport"], PURPLE, 10.4),
]

for title, fields, color, x in tables:
    card = add_rect(slide, Inches(x), Inches(1.3), Inches(3.0), Inches(4.5), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = f"  {title}"
    p.font.size = Pt(16)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = "  " + "─" * 22
    p2.font.size = Pt(8)
    p2.font.color.rgb = MID_GRAY
    p2.font.name = "Segoe UI"
    for field in fields:
        p3 = tf.add_paragraph()
        p3.text = f"    {field}"
        p3.font.size = Pt(11)
        p3.font.color.rgb = WHITE
        p3.font.name = "Segoe UI"

# Relationships note
rel_box = add_rect(slide, Inches(0.5), Inches(6.0), Inches(12.3), Inches(1.2), BG_CARD, ORANGE)
tf = rel_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  RELATIONSHIPS:   Organization (1) ──▶ (many) User   |   User (1) ──▶ (1) Profile   |   User (1) ──▶ (1) Interview   |   User (1) ──▶ (many) VerificationToken"
p.font.size = Pt(13)
p.font.color.rgb = WHITE
p.font.name = "Segoe UI"
p2 = tf.add_paragraph()
p2.text = "  Turso = Edge Database (30+ global locations)  |  Automatic replication & failover  |  Handles 1000s of concurrent reads"
p2.font.size = Pt(12)
p2.font.color.rgb = LIGHT_GRAY
p2.font.name = "Segoe UI"

slide_number(slide, 7)

# ════════════════════════════════════════════════════════════════════
# SLIDE 8 – EXTERNAL SERVICES
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "Layer 5: External Services", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.0), Inches(0.04), GREEN)

services = [
    ("Cloudflare R2", "Video & Resume\nStorage", "100+ edge locations\nworldwide\n\nVideos upload DIRECTLY\nfrom browser\n(no server bandwidth)\n\nFree tier: 10GB storage\n10M reads/month", ACCENT, "STORAGE"),
    ("Stripe", "Subscription\nBilling", "Monthly plans:\nStarter / Pro / Enterprise\n\nMulti-currency support\n(8 currencies)\n\n2.9% + $0.30\nper transaction", ACCENT2, "PAYMENTS"),
    ("OpenAI GPT-5", "AI Brain", "Generates interview\nquestions based on:\n- Candidate skills\n- Job type\n- Experience level\n\nEvaluates answers:\n~$0.01 per interview", PURPLE, "AI ENGINE"),
    ("Nodemailer\n(SMTP)", "Transactional\nEmails", "Email types:\n- Verification\n- Password reset\n- Interview confirm\n- Reminders (24h,1h,15m)\n- Welcome email", ORANGE, "EMAIL"),
    ("WhatsApp\nBusiness API", "Interview\nReminders", "Auto-sends:\n- 24 hours before\n- 1 hour before\n- 15 min before\n\nFallback if email\nnot delivered", GREEN, "MESSAGING"),
]

for i, (title, subtitle, desc, color, label) in enumerate(services):
    x = 0.3 + i * 2.55
    card = add_rect(slide, Inches(x), Inches(1.3), Inches(2.4), Inches(5.8), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = f"  {label}"
    p.font.size = Pt(10)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = f"  {title}"
    p2.font.size = Pt(15)
    p2.font.color.rgb = WHITE
    p2.font.bold = True
    p2.font.name = "Segoe UI"
    p2.alignment = PP_ALIGN.CENTER
    p3 = tf.add_paragraph()
    p3.text = f"  {subtitle}"
    p3.font.size = Pt(12)
    p3.font.color.rgb = color
    p3.font.name = "Segoe UI"
    p3.alignment = PP_ALIGN.CENTER
    p4 = tf.add_paragraph()
    p4.text = "  " + "─" * 22
    p4.font.size = Pt(8)
    p4.font.color.rgb = MID_GRAY
    p4.font.name = "Segoe UI"
    p5 = tf.add_paragraph()
    p5.text = f"  {desc}"
    p5.font.size = Pt(11)
    p5.font.color.rgb = LIGHT_GRAY
    p5.font.name = "Segoe UI"

slide_number(slide, 8)

# ════════════════════════════════════════════════════════════════════
# SLIDE 9 – SCALING: 1000s OF USERS
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "How 1000s of Users Are Handled Simultaneously", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(4.5), Inches(0.04), GREEN)

# Serverless scaling
box1 = add_rect(slide, Inches(0.5), Inches(1.3), Inches(6.0), Inches(2.8), BG_CARD, ACCENT)
tf = box1.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  1. SERVERLESS (Auto-Scales)"
p.font.size = Pt(16)
p.font.color.rgb = ACCENT
p.font.bold = True
p.font.name = "Segoe UI"
lines = [
    "  10 users   →   10 serverless functions spin up",
    "  100 users  →   100 functions spin up",
    "  1000 users →   1000 functions spin up",
    "  10000 users → 10000 functions spin up",
    "",
    "  No manual server management needed!",
    "  Vercel handles this automatically."
]
for line in lines:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(12)
    p2.font.color.rgb = WHITE if "spin up" in line or "No manual" in line or "Vercel" in line else LIGHT_GRAY
    p2.font.name = "Segoe UI"

# Database scaling
box2 = add_rect(slide, Inches(6.8), Inches(1.3), Inches(6.0), Inches(2.8), BG_CARD, ACCENT2)
tf = box2.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  2. DATABASE (Turso Edge)"
p.font.size = Pt(16)
p.font.color.rgb = ACCENT2
p.font.bold = True
p.font.name = "Segoe UI"
lines2 = [
    "  30+ edge locations worldwide",
    "  Users connect to NEAREST region",
    "  Handles 1000s of concurrent reads",
    "  Automatic failover if region goes down",
    "",
    "  Latency: <50ms (vs 200ms+ traditional DB)"
]
for line in lines2:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(12)
    p2.font.color.rgb = WHITE if "30+" in line or "Latency" in line else LIGHT_GRAY
    p2.font.name = "Segoe UI"

# File storage
box3 = add_rect(slide, Inches(0.5), Inches(4.3), Inches(4.0), Inches(2.8), BG_CARD, PURPLE)
tf = box3.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  3. FILE STORAGE"
p.font.size = Pt(16)
p.font.color.rgb = PURPLE
p.font.bold = True
p.font.name = "Segoe UI"
lines3 = ["  Cloudflare R2", "  100+ edge CDN locations", "  Videos upload DIRECTLY", "  from browser", "  No bandwidth limit on server", "  Auto-scales infinitely"]
for line in lines3:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(12)
    p2.font.color.rgb = WHITE if "Cloudflare" in line or "Directly" in line else LIGHT_GRAY
    p2.font.name = "Segoe UI"

# AI bottleneck
box4 = add_rect(slide, Inches(4.8), Inches(4.3), Inches(4.0), Inches(2.8), BG_CARD, ORANGE)
tf = box4.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  4. AI QUEUE SYSTEM"
p.font.size = Pt(16)
p.font.color.rgb = ORANGE
p.font.bold = True
p.font.name = "Segoe UI"
lines4 = ["  OpenAI rate limit: ~500 req/min", "  1000 users hit AI at once:", "  → Requests go into queue", "  → Processed 1-by-1", "  → Users see 'Processing...'", "  → Upgrade = higher limits"]
for line in lines4:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(12)
    p2.font.color.rgb = WHITE if "OpenAI" in line or "Upgrade" in line else LIGHT_GRAY
    p2.font.name = "Segoe UI"

# Email
box5 = add_rect(slide, Inches(9.1), Inches(4.3), Inches(3.8), Inches(2.8), BG_CARD, GREEN)
tf = box5.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  5. EMAIL BATCHING"
p.font.size = Pt(16)
p.font.color.rgb = GREEN
p.font.bold = True
p.font.name = "Segoe UI"
lines5 = ["  1000 emails = batched", "  in background", "  Non-blocking serverless", "  Can upgrade to:", "  - SendGrid", "  - AWS SES (10k+/day)"]
for line in lines5:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(12)
    p2.font.color.rgb = WHITE if "1000" in line or "Can upgrade" in line else LIGHT_GRAY
    p2.font.name = "Segoe UI"

slide_number(slide, 9)

# ════════════════════════════════════════════════════════════════════
# SLIDE 10 – REQUEST FLOW (Step-by-Step)
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "Complete Request Flow (One Interview)", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(4.0), Inches(0.04), ACCENT)

steps = [
    ("1", "Click Start", "User clicks\n'Start Interview'", ACCENT),
    ("2", "Rate Limit\nCheck", "Is IP blocked?\n(>20 req/min = yes)", ACCENT2),
    ("3", "JWT Auth\nCheck", "Is token valid?\nIs user logged in?", PURPLE),
    ("4", "Plan Check", "Interview slots\nleft this month?", ORANGE),
    ("5", "API Request", "POST /api/ai-interview\n{ userId, interviewId }", GREEN),
    ("6", "DB Query", "Fetch user profile\n+ interview details", ACCENT),
    ("7", "OpenAI\nRequest", "Generate 6 questions\nbased on skills", ACCENT2),
    ("8", "User Records\nVideo", "Camera + Mic\ncapture (1-2 min)", PURPLE),
    ("9", "Upload to\nCloudflare", "Video saves directly\nto R2 (bypass server)", ORANGE),
    ("10", "AI Evaluates", "Scores answer:\nAccuracy + Relevance", GREEN),
    ("11", "Proctoring", "Face detection:\nCheating check", ACCENT),
    ("12", "Save &\nNotify", "DB update + email\nto admin + candidate", ACCENT2),
]

for i, (num, title, desc, color) in enumerate(steps):
    row = i // 6
    col = i % 6
    x = 0.3 + col * 2.15
    y = 1.3 + row * 3.0

    # Number circle
    circle = add_circle(slide, Inches(x + 0.65), Inches(y), Inches(0.45), color)
    tf = circle.text_frame
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = num
    p.font.size = Pt(14)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = "Segoe UI"

    # Card
    card = add_rect(slide, Inches(x), Inches(y + 0.55), Inches(1.9), Inches(2.1), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(13)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = ""
    p2.font.size = Pt(4)
    p3 = tf.add_paragraph()
    p3.text = desc
    p3.font.size = Pt(11)
    p3.font.color.rgb = LIGHT_GRAY
    p3.font.name = "Segoe UI"
    p3.alignment = PP_ALIGN.CENTER

slide_number(slide, 10)

# ════════════════════════════════════════════════════════════════════
# SLIDE 11 – MULTI-TENANT ISOLATION
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "Multi-Tenant Data Isolation", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.5), Inches(0.04), ACCENT2)

# Company A
box_a = add_rect(slide, Inches(0.5), Inches(1.3), Inches(5.8), Inches(3.0), BG_CARD, ACCENT)
tf = box_a.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  COMPANY A"
p.font.size = Pt(20)
p.font.color.rgb = ACCENT
p.font.bold = True
p.font.name = "Segoe UI"
lines_a = [
    "  Org: Google",
    "  Users: user1@google.com, user2@google.com",
    "  Interviews: Only Google's interviews visible",
    "  Plan: Pro ($99/month, 100 interviews)",
    "  Branding: Google colors + logo"
]
for line in lines_a:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(13)
    p2.font.color.rgb = WHITE
    p2.font.name = "Segoe UI"

# Company B
box_b = add_rect(slide, Inches(6.8), Inches(1.3), Inches(5.8), Inches(3.0), BG_CARD, PURPLE)
tf = box_b.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  COMPANY B"
p.font.size = Pt(20)
p.font.color.rgb = PURPLE
p.font.bold = True
p.font.name = "Segoe UI"
lines_b = [
    "  Org: Microsoft",
    "  Users: user1@microsoft.com, user2@microsoft.com",
    "  Interviews: Only Microsoft's interviews visible",
    "  Plan: Enterprise (Unlimited interviews)",
    "  Branding: Microsoft colors + logo"
]
for line in lines_b:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(13)
    p2.font.color.rgb = WHITE
    p2.font.name = "Segoe UI"

# Isolation note
iso_box = add_rect(slide, Inches(0.5), Inches(4.6), Inches(12.3), Inches(2.5), BG_CARD, GREEN)
tf = iso_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  HOW ISOLATION WORKS:"
p.font.size = Pt(18)
p.font.color.rgb = GREEN
p.font.bold = True
p.font.name = "Segoe UI"
lines_iso = [
    "",
    "  SAME DATABASE  →  Isolated by organizationId column",
    "  EVERY QUERY     →  WHERE organizationId = 'current-user-org'",
    "  RESULT          →  Google sees ONLY Google data  |  Microsoft sees ONLY Microsoft data",
    "",
    "  ⚠️  Google CANNOT see Microsoft's data",
    "  ⚠️  Microsoft CANNOT see Google's data",
    "  ✅  Each company is completely isolated"
]
for line in lines_iso:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(13)
    p2.font.color.rgb = WHITE if "SAME DATABASE" in line or "EVERY QUERY" in line or "RESULT" in line else LIGHT_GRAY
    p2.font.name = "Segoe UI"

slide_number(slide, 11)

# ════════════════════════════════════════════════════════════════════
# SLIDE 12 – COST & SCALABILITY
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(10), Inches(0.6),
         "Cost & Scalability Summary", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.5), Inches(0.04), ORANGE)

# Cost table
cost_data = [
    ("Users", "Cost/Month", "Infrastructure"),
    ("1 - 100", "~$0", "Vercel Free + Turso Free + R2 Free"),
    ("100 - 500", "~$20", "Turso Pro (database scaling)"),
    ("500 - 1,000", "~$50", "Vercel Pro + Turso Pro"),
    ("1,000 - 5,000", "~$150", "Vercel Pro + Turso Scale + Queue"),
    ("5,000 - 10,000", "~$400", "Enterprise DB + CDN + Queue System"),
]

for i, (users, cost, infra) in enumerate(cost_data):
    y = 1.3 + i * 0.55
    bg = RGBColor(0x1A, 0x25, 0x40) if i == 0 else (BG_CARD if i % 2 == 1 else RGBColor(0x12, 0x1B, 0x30))
    border = ACCENT if i == 0 else None
    row = add_rect(slide, Inches(0.5), Inches(y), Inches(6.5), Inches(0.5), bg, border)
    tf = row.text_frame
    p = tf.paragraphs[0]
    p.text = f"  {users}"
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT if i == 0 else WHITE
    p.font.bold = (i == 0)
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = f"  {cost}"
    p2.font.size = Pt(13)
    p2.font.color.rgb = GREEN if i > 0 else (ACCENT if i == 0 else WHITE)
    p2.font.bold = (i == 0)
    p2.font.name = "Segoe UI"

# Per-interview cost
pi_box = add_rect(slide, Inches(7.3), Inches(1.3), Inches(5.5), Inches(3.0), BG_CARD, GREEN)
tf = pi_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  PER-INTERVIEW COST"
p.font.size = Pt(16)
p.font.color.rgb = GREEN
p.font.bold = True
p.font.name = "Segoe UI"
pi_lines = [
    "",
    "  OpenAI API:      ~$0.01 per evaluation",
    "  Video Storage:   ~$0.005 per GB (R2)",
    "  Email:           ~$0.001 per email",
    "  ─────────────────────────────",
    "  TOTAL:           ~$0.02 per interview",
    "",
    "  Revenue (Pro):   $99 / 100 = ~$0.99/interview",
    "  PROFIT MARGIN:   ~97%"
]
for line in pi_lines:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(13)
    p2.font.color.rgb = GREEN if "PROFIT" in line or "TOTAL" in line else WHITE
    p2.font.name = "Segoe UI"

# Security summary
sec_box = add_rect(slide, Inches(0.5), Inches(4.7), Inches(12.3), Inches(2.5), BG_CARD, ACCENT)
tf = sec_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "  SECURITY FEATURES"
p.font.size = Pt(18)
p.font.color.rgb = ACCENT
p.font.bold = True
p.font.name = "Segoe UI"
sec_lines = [
    "",
    "  ✅  JWT tokens (7-day expiry) for authentication",
    "  ✅  bcrypt password hashing (12 rounds) – industry standard",
    "  ✅  Per-IP rate limiting on sensitive endpoints",
    "  ✅  Org-level data isolation (users can only see their org's data)",
    "  ✅  Email verification required before full access",
    "  ✅  Video uploads go directly to cloud (never hits our server body)"
]
for line in sec_lines:
    p2 = tf.add_paragraph()
    p2.text = line
    p2.font.size = Pt(13)
    p2.font.color.rgb = WHITE
    p2.font.name = "Segoe UI"

slide_number(slide, 12)

# ════════════════════════════════════════════════════════════════════
# SLIDE 13 – TECH STACK SUMMARY
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.1), RGBColor(0x12, 0x1B, 0x30))
add_text(slide, Inches(0.6), Inches(0.3), Inches(8), Inches(0.6),
         "Technology Stack Summary", font_size=30, color=WHITE, bold=True)
add_rect(slide, Inches(0.6), Inches(0.95), Inches(3.0), Inches(0.04), PURPLE)

tech_items = [
    ("Frontend + Backend", "Next.js 16", "One framework for everything\nFast development & deployment", ACCENT),
    ("UI Library", "React 19 + Tailwind CSS", "Modern, responsive design\nComponent-based architecture", ACCENT2),
    ("Language", "TypeScript", "Type-safe code\nFewer bugs in production", PURPLE),
    ("Database", "Turso (libSQL)", "Edge database, 30+ locations\nAutomatic replication", ORANGE),
    ("ORM", "Prisma 7", "Type-safe database queries\nAuto-generated client", GREEN),
    ("AI Engine", "OpenAI GPT-5-nano", "Powers question generation\n+ answer evaluation", ACCENT),
    ("Payments", "Stripe", "Subscription billing\nMulti-currency support", ACCENT2),
    ("File Storage", "Cloudflare R2", "Free cloud storage for videos\nGlobal CDN delivery", PURPLE),
    ("Auth", "JWT + bcrypt", "Secure, stateless authentication\nIndustry-standard hashing", ORANGE),
    ("Email", "Nodemailer (SMTP)", "Transactional emails\nVerification, reminders", GREEN),
]

for i, (layer, tech, why, color) in enumerate(tech_items):
    row = i // 5
    col = i % 5
    x = 0.3 + col * 2.55
    y = 1.3 + row * 3.0

    card = add_rect(slide, Inches(x), Inches(y), Inches(2.4), Inches(2.7), BG_CARD, color)
    tf = card.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = layer
    p.font.size = Pt(11)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = "Segoe UI"
    p2 = tf.add_paragraph()
    p2.text = ""
    p2.font.size = Pt(4)
    p3 = tf.add_paragraph()
    p3.text = tech
    p3.font.size = Pt(15)
    p3.font.color.rgb = WHITE
    p3.font.bold = True
    p3.font.name = "Segoe UI"
    p3.alignment = PP_ALIGN.CENTER
    p4 = tf.add_paragraph()
    p4.text = ""
    p4.font.size = Pt(4)
    p5 = tf.add_paragraph()
    p5.text = why
    p5.font.size = Pt(10)
    p5.font.color.rgb = LIGHT_GRAY
    p5.font.name = "Segoe UI"
    p5.alignment = PP_ALIGN.CENTER

slide_number(slide, 13)

# ════════════════════════════════════════════════════════════════════
# SLIDE 14 – THANK YOU
# ════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide)

add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.08), ACCENT)

add_circle(slide, Inches(0.5), Inches(1.0), Inches(0.8), ACCENT)
add_circle(slide, Inches(11.5), Inches(5.5), Inches(1.0), PURPLE)

add_text(slide, Inches(1.5), Inches(2.0), Inches(10), Inches(1),
         "Thank You", font_size=52, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1.5), Inches(3.0), Inches(10), Inches(0.8),
         "Techcitta – AI-Powered Hiring Platform", font_size=22, color=ACCENT, alignment=PP_ALIGN.CENTER)

add_rect(slide, Inches(5.5), Inches(3.9), Inches(2.3), Inches(0.04), ACCENT)

add_text(slide, Inches(1.5), Inches(4.3), Inches(10), Inches(0.5),
         "Architecture & System Design Overview", font_size=16, color=LIGHT_GRAY, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1.5), Inches(5.0), Inches(10), Inches(0.5),
         "Questions?  |  Contact Us", font_size=14, color=MID_GRAY, alignment=PP_ALIGN.CENTER)
add_text(slide, Inches(1.5), Inches(5.8), Inches(10), Inches(0.5),
         "August 2026  |  Confidential", font_size=12, color=MID_GRAY, alignment=PP_ALIGN.CENTER)

slide_number(slide, 14)

# ── Save ──
output_path = os.path.join(os.getcwd(), "Techcitta_Architecture.pptx")
prs.save(output_path)
print(f"Presentation saved to: {output_path}")
print(f"Total slides: {len(prs.slides)}")
