import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_path = "/home/ubuntu/businesssphere-erp/client/public/Smart_Manager_ERP_Executive_Presentation_Inventory.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=22, textColor=colors.HexColor('#064E3B'), spaceAfter=6)
subtitle_style = ParagraphStyle('DocSub', parent=styles['Normal'], fontName='Helvetica', fontSize=12, textColor=colors.HexColor('#047857'), spaceAfter=15)
h2_style = ParagraphStyle('SectionHeading', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#064E3B'), spaceBefore=14, spaceAfter=6)
body_style = ParagraphStyle('BodyTextCustom', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#1F2937'), leading=14, spaceAfter=8)
table_text = ParagraphStyle('TableText', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=colors.HexColor('#1F2937'), leading=12)
table_header = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.white, leading=12)

story = []

story.append(Paragraph("Smart Manager ERP", title_style))
story.append(Paragraph("Executive Module Inventory & Presentation Deck Architecture", subtitle_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#059669'), spaceAfter=12))

intro_text = ("This document establishes the official 40-surface major module inventory and presentation outline for "
              "Smart Manager ERP. Extracted directly from verified source code (BusinessSphereDashboard.jsx, TRA Portal, "
              "and enterprise services), this inventory serves as the mandatory checklist ensuring that every module "
              "receives dedicated high-fidelity visual documentation and rigorous enterprise validation.")
story.append(Paragraph(intro_text, body_style))

story.append(Paragraph("Inventory Summary & Mandatory Checklist", h2_style))

table_data = [
    [Paragraph("ID", table_header), Paragraph("Module / Surface Name", table_header), Paragraph("Source Reference", table_header), Paragraph("Status", table_header)]
]

modules_list = [
    ("01", "Public Brand & Marketing Entry", "Home.tsx", "Pending Quota Reset"),
    ("02", "Authentication & Secure Onboarding", "LoginModuleEcosystem.jsx", "Pending Quota Reset"),
    ("03", "Master Application Shell & Navigation", "DashboardLayout.tsx", "Pending Quota Reset"),
    ("04", "Executive Dashboard", "Dashboard Module", "Pending Quota Reset"),
    ("05", "Daily Business Briefing", "Executive Briefing", "Pending Quota Reset"),
    ("06", "CRM & Customer Pipeline", "CRM Module", "Pending Quota Reset"),
    ("07", "Sales & Billing", "Sales Module", "Pending Quota Reset"),
    ("08", "Point of Sale (POS)", "POS Module", "Pending Quota Reset"),
    ("09", "Inventory & Warehouse Management", "Inventory Module", "Pending Quota Reset"),
    ("10", "Procurement & Vendor Management", "Procurement Module", "Pending Quota Reset"),
    ("11", "Finance & Accounting", "Finance Module", "Pending Quota Reset"),
    ("12", "Reports & Scheduled Reporting", "Reports Module", "Pending Quota Reset"),
    ("13", "Human Resources & Payroll", "HR Module", "Pending Quota Reset"),
    ("14", "Manufacturing & Work Orders", "Manufacturing Module", "Pending Quota Reset"),
    ("15", "Supply Chain & Fleet", "Supply Chain Module", "Pending Quota Reset"),
    ("16", "Marketing Campaigns", "Marketing Module", "Pending Quota Reset"),
    ("17", "E-Commerce Storefront", "E-Commerce Module", "Pending Quota Reset"),
    ("18", "Documents & Secure Files", "Documents Module", "Pending Quota Reset"),
    ("19", "Projects & Task Management", "Projects Module", "Pending Quota Reset"),
    ("20", "Customer Support & Helpdesk", "Support Module", "Pending Quota Reset"),
    ("21", "Enterprise Analytics & BI", "Analytics Module", "Pending Quota Reset"),
    ("22", "Notifications & Alerting", "Notifications Service", "Pending Quota Reset"),
    ("23", "Activity Stream & Audit Evidence", "Compliance Audit Logs", "Pending Quota Reset"),
    ("24", "Integration Hub", "Integrations Service", "Pending Quota Reset"),
    ("25", "Workflow Studio & Marketplace", "Workflows Module", "Pending Quota Reset"),
    ("26", "Collaboration Hub", "Collaboration Module", "Pending Quota Reset"),
    ("27", "TRA VFD Fiscalization Portal", "TraPortalModule.jsx", "Pending Quota Reset"),
    ("28", "AI Assistant & Smart Intelligence", "AI Assistant Module", "Pending Quota Reset"),
    ("29", "Microfinance", "Microfinance Module", "Pending Quota Reset"),
    ("30", "VICOBA / SACCOS", "VICOBA Module", "Pending Quota Reset"),
    ("31", "Community Groups", "Community Module", "Pending Quota Reset"),
    ("32", "Healthcare / Clinic", "Industry Workspace", "Pending Quota Reset"),
    ("33", "School Management", "Industry Workspace", "Pending Quota Reset"),
    ("34", "Pharmacy Management", "Industry Workspace", "Pending Quota Reset"),
    ("35", "Hotel & Hospitality", "Industry Workspace", "Pending Quota Reset"),
    ("36", "Fleet Management", "Industry Workspace", "Pending Quota Reset"),
    ("37", "Banking & MFI", "Industry Workspace", "Pending Quota Reset"),
    ("38", "Restaurant & F&B", "Industry Workspace", "Pending Quota Reset"),
    ("39", "Employee Portal", "Employee Portal", "Pending Quota Reset"),
    ("40", "Enterprise Settings & Security Control Center", "Settings Module", "Pending Quota Reset")
]

for row in modules_list:
    table_data.append([
        Paragraph(row[0], table_text),
        Paragraph(row[1], table_text),
        Paragraph(row[2], table_text),
        Paragraph(row[3], table_text)
    ])

t = Table(table_data, colWidths=[35, 200, 160, 109])
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#064E3B')),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB'))
]))

story.append(t)

doc.build(story)
print("PDF generated successfully at:", pdf_path)
