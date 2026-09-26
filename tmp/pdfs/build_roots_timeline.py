from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)

OUTPUT = "/Users/bro/Documents/New project/output/pdf/roots-revised-phase-3-timeline.pdf"

INK = colors.HexColor("#161616")
MUTED = colors.HexColor("#62605B")
GOLD = colors.HexColor("#B58B25")
PALE_GOLD = colors.HexColor("#F7F1E2")
PAPER = colors.HexColor("#FCFBF8")
LINE = colors.HexColor("#DDD8CD")
WHITE = colors.white

styles = getSampleStyleSheet()
title = ParagraphStyle(
    "Title", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=24, leading=27, textColor=INK, alignment=TA_LEFT,
    spaceAfter=4,
)
subtitle = ParagraphStyle(
    "Subtitle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=10, leading=14, textColor=MUTED, spaceAfter=12,
)
section = ParagraphStyle(
    "Section", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=12, leading=15, textColor=INK, spaceBefore=8, spaceAfter=6,
)
body = ParagraphStyle(
    "Body", parent=styles["Normal"], fontName="Helvetica",
    fontSize=8.4, leading=11.5, textColor=INK,
)
small = ParagraphStyle(
    "Small", parent=body, fontSize=7.3, leading=9.6, textColor=MUTED,
)
table_head = ParagraphStyle(
    "TableHead", parent=body, fontName="Helvetica-Bold",
    fontSize=7.4, leading=9, textColor=WHITE, alignment=TA_LEFT,
)
table_body = ParagraphStyle(
    "TableBody", parent=body, fontSize=7.4, leading=9.6,
)
table_bold = ParagraphStyle(
    "TableBold", parent=table_body, fontName="Helvetica-Bold",
)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 13 * mm, 192 * mm, 13 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 8.5 * mm, "Roots - Revised Phase 3 Timeline")
    canvas.drawRightString(192 * mm, 8.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=17 * mm,
    bottomMargin=18 * mm,
    title="Roots Revised Phase 3 Timeline",
    author="Studio Nice One",
)

story = []

brand = Table(
    [[Paragraph("STUDIO NICE ONE", table_head), Paragraph("ROOTS", table_head)]],
    colWidths=[125 * mm, 49 * mm],
)
brand.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), INK),
    ("BACKGROUND", (1, 0), (1, 0), GOLD),
    ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
]))
story.extend([
    brand,
    Spacer(1, 10),
    Paragraph("Revised Phase 3 Timeline", title),
    Paragraph(
        "Working-day schedule following formal brand approval. Prepared as an approximate client overview; dates may shift with approval, feedback, revision, production, or external-team dependencies.",
        subtitle,
    ),
])

assumption = Table([
    [Paragraph("SCHEDULING ASSUMPTION", table_head), Paragraph("Brand approval: Tuesday, 1 September 2026", table_bold)],
    [Paragraph("WORKING-DAY RULE", table_head), Paragraph("The first Phase 3 workstream requires one full working week. Weekends are excluded.", table_body)],
], colWidths=[43 * mm, 131 * mm])
assumption.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), GOLD),
    ("BACKGROUND", (1, 0), (1, -1), PALE_GOLD),
    ("BOX", (0, 0), (-1, -1), 0.6, GOLD),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E8D9AE")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.extend([assumption, Spacer(1, 10), Paragraph("Phase 3 - Marketing and Launch Support", section)])

timeline_rows = [
    ["Workstream", "Working dates", "Target", "Scope"],
    ["P3.1", "2-8 Sep", "8 Sep", "Social Media Strategy and Content Calendar"],
    ["P3.2", "2-8 Sep", "8 Sep", "Video and Photography Direction"],
    ["P3.3", "9-15 Sep", "15 Sep", "Launch Campaign Assets"],
    ["P3.4", "9-15 Sep", "15 Sep", "Launch Video Storyboarding"],
    ["P3.5", "16-25 Sep", "25 Sep", "Photography and Videography Production"],
    ["P3.6", "28 Sep-2 Oct", "2 Oct", "Guided Marketing Asset Handover"],
    ["P3.7", "5-7 Oct", "7 Oct", "Launch Execution Consultancy"],
    ["P3.8", "8 Oct", "8 Oct", "Phase 3 Completion and final review"],
]
timeline_data = [[Paragraph(cell, table_head if r == 0 else (table_bold if c == 0 else table_body)) for c, cell in enumerate(row)] for r, row in enumerate(timeline_rows)]
timeline = Table(timeline_data, colWidths=[21 * mm, 33 * mm, 23 * mm, 97 * mm], repeatRows=1)
timeline.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PAPER]),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
]))
story.extend([timeline, Spacer(1, 9)])

trigger_rows = [
    ["Date", "Payment trigger"],
    ["2 September", "Phase 3 commencement following formal brand approval and visual-identity sign-off."],
    ["2 October", "Delivery of marketing-support materials and completion of the guided asset walkthrough."],
    ["8 October", "Formal Phase 3 completion and delivery of the agreed Phase 3 scope."],
]
trigger_data = [[Paragraph(cell, table_head if r == 0 else (table_bold if c == 0 else table_body)) for c, cell in enumerate(row)] for r, row in enumerate(trigger_rows)]
triggers = Table(trigger_data, colWidths=[35 * mm, 139 * mm], repeatRows=1)
triggers.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), GOLD),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PALE_GOLD, WHITE]),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
]))
story.extend([Paragraph("Phase 3 Payment Triggers", section), triggers, Spacer(1, 9)])

story.extend([
    KeepTogether([
        Paragraph("Client note", section),
        Paragraph(
            "Following approval of the brand, one full working week is required for the initial Phase 3 strategy and creative-direction work. The revised Phase 3 schedule therefore runs from 2 September to 8 October 2026. Dates are approximate and depend on timely approvals, consolidated feedback, production coordination, and access to required materials. No payment amounts are included in this schedule.",
            small,
        ),
    ]),
])

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
