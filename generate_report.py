import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf(filename="informe_auditoria_estados_pacientes.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#1e3a8a") # Navy blue
    secondary_color = colors.HexColor("#0284c7") # Sky blue
    dark_text = colors.HexColor("#1e293b")
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#e2e8f0")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )

    section_header = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )

    card_label = ParagraphStyle(
        'CardLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#475569")
    )

    card_value = ParagraphStyle(
        'CardValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=dark_text
    )

    th_style = ParagraphStyle(
        'THStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
        alignment=1 # Center
    )

    td_style = ParagraphStyle(
        'TDStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_text
    )

    td_bold_style = ParagraphStyle(
        'TDBoldStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_text
    )

    badge_style = ParagraphStyle(
        'BadgeStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0369a1"),
        alignment=1
    )

    note_style = ParagraphStyle(
        'NoteStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569")
    )

    story = []

    # Title & Header
    story.append(Paragraph("Informe de Trazabilidad y Auditoría de Estados", title_style))
    story.append(Paragraph("<b>Portal Derivaciones Clínicas:</b> Policlínico Tabancura & Municipalidad de Vitacura<br/><b>Fecha de emisión:</b> 27 de Agosto de 2026", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=14))

    # --- PACIENTE 1 ---
    story.append(Paragraph("1. Paciente: EMELY VIDAL (RUT: 26.877.362-9)", section_header))
    
    p1_info = [
        [
            Paragraph("<b>Nombre Completo:</b>", card_label), Paragraph("EMELY VIDAL", card_value),
            Paragraph("<b>RUT:</b>", card_label), Paragraph("26.877.362-9 (Limpiado: 268773622)", card_value)
        ],
        [
            Paragraph("<b>Nacionalidad:</b>", card_label), Paragraph("Dominicana", card_value),
            Paragraph("<b>Comuna:</b>", card_label), Paragraph("Recoleta", card_value)
        ],
        [
            Paragraph("<b>Centro Derivador:</b>", card_label), Paragraph("CESFAM VITACURA", card_value),
            Paragraph("<b>Profesional Derivador:</b>", card_label), Paragraph("María José Reckmann González (mreckmann@vitacura.cl)", card_value)
        ],
        [
            Paragraph("<b>Tratamiento / Diagnóstico:</b>", card_label), Paragraph("Pieza 18: Tomografía por Grupo o Pieza [Rayos X] (Cariada)", card_value),
            Paragraph("<b>Estado Actual:</b>", card_label), Paragraph("<b>sincronizado</b> (Dentalink ID: 21995)", card_value)
        ],
    ]
    t_p1 = Table(p1_info, colWidths=[110, 160, 100, 170])
    t_p1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_p1)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Historial Cronológico de Cambios de Estado:</b>", card_label))
    story.append(Spacer(1, 3))

    headers_table = [
        Paragraph("<b>N°</b>", th_style),
        Paragraph("<b>Fecha/Hora (Chile UTC-4)</b>", th_style),
        Paragraph("<b>Estado</b>", th_style),
        Paragraph("<b>Usuario Responsable</b>", th_style),
        Paragraph("<b>IP / Origen</b>", th_style),
        Paragraph("<b>Detalle / Observación</b>", th_style),
    ]

    p1_rows = [
        headers_table,
        [
            Paragraph("1", td_style),
            Paragraph("27-08-2026 09:49:06", td_bold_style),
            Paragraph("ingresado", badge_style),
            Paragraph("María José Reckmann González<br/><i>mreckmann@vitacura.cl</i>", td_style),
            Paragraph("172.68.112.200", td_style),
            Paragraph("Creación inicial de la derivación digital (CASE_CREATED).", td_style),
        ],
        [
            Paragraph("2", td_style),
            Paragraph("27-08-2026 13:08:23", td_bold_style),
            Paragraph("sincronizado", badge_style),
            Paragraph("Javiera Marchant<br/><i>jmarchant@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.46", td_style),
            Paragraph("Sincronizado automáticamente con Dentalink.", td_style),
        ],
        [
            Paragraph("3", td_style),
            Paragraph("27-08-2026 13:56:06", td_bold_style),
            Paragraph("agendado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.46", td_style),
            Paragraph("Cita agendada registrada en Dentalink.", td_style),
        ],
        [
            Paragraph("4", td_style),
            Paragraph("27-08-2026 14:14:25", td_bold_style),
            Paragraph("agendado", badge_style),
            Paragraph("Javiera Marchant<br/><i>jmarchant@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.69.90.9", td_style),
            Paragraph("Sincronizado y agendado automáticamente con Dentalink.", td_style),
        ],
        [
            Paragraph("5", td_style),
            Paragraph("27-08-2026 14:15:16", td_bold_style),
            Paragraph("sincronizado", badge_style),
            Paragraph("Javiera Marchant<br/><i>jmarchant@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.69.90.9", td_style),
            Paragraph("Sincronizado y agendado automáticamente con Dentalink.", td_style),
        ],
        [
            Paragraph("6", td_style),
            Paragraph("27-08-2026 14:38:09", td_bold_style),
            Paragraph("agendado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.47", td_style),
            Paragraph("Sincronizado y agendado automáticamente con Dentalink.", td_style),
        ],
        [
            Paragraph("7", td_style),
            Paragraph("27-08-2026 14:38:23", td_bold_style),
            Paragraph("sincronizado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.47", td_style),
            Paragraph("Sincronizado automáticamente con Dentalink.", td_style),
        ],
    ]

    t_p1_history = Table(p1_rows, colWidths=[18, 92, 62, 140, 68, 160])
    t_p1_history.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_p1_history)
    story.append(Spacer(1, 14))

    # --- PACIENTE 2 ---
    story.append(Paragraph("2. Paciente: Ana Violeta Rojas Flores (RUT: 6.556.560-9)", section_header))
    
    p2_info = [
        [
            Paragraph("<b>Nombre Completo:</b>", card_label), Paragraph("Ana Violeta Rojas Flores", card_value),
            Paragraph("<b>RUT:</b>", card_label), Paragraph("6.556.560-9 (Limpiado: 65565609)", card_value)
        ],
        [
            Paragraph("<b>Nacionalidad:</b>", card_label), Paragraph("Chilena", card_value),
            Paragraph("<b>Comuna:</b>", card_label), Paragraph("Vitacura", card_value)
        ],
        [
            Paragraph("<b>Centro Derivador:</b>", card_label), Paragraph("CESFAM VITACURA", card_value),
            Paragraph("<b>Profesional Derivador:</b>", card_label), Paragraph("Camila Andrea Muñoz Allendes (camila.allendes@vitacura.cl)", card_value)
        ],
        [
            Paragraph("<b>Tratamiento / Diagnóstico:</b>", card_label), Paragraph("Pieza 30: Incrustación Disilicato de Litio [Dental] (Fracturada)", card_value),
            Paragraph("<b>Estado Actual:</b>", card_label), Paragraph("<b>agendado</b> (Dentalink ID: 21960)", card_value)
        ],
    ]
    t_p2 = Table(p2_info, colWidths=[110, 160, 100, 170])
    t_p2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_p2)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Historial Cronológico de Cambios de Estado:</b>", card_label))
    story.append(Spacer(1, 3))

    p2_rows = [
        headers_table,
        [
            Paragraph("1", td_style),
            Paragraph("21-08-2026 14:39:37", td_bold_style),
            Paragraph("ingresado", badge_style),
            Paragraph("Camila Andrea Muñoz Allendes<br/><i>camila.allendes@vitacura.cl</i>", td_style),
            Paragraph("172.68.112.200", td_style),
            Paragraph("Creación inicial de la derivación digital (CASE_CREATED).", td_style),
        ],
        [
            Paragraph("2", td_style),
            Paragraph("21-08-2026 15:54:49", td_bold_style),
            Paragraph("sincronizado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.46", td_style),
            Paragraph("Sincronizado automáticamente con Dentalink.", td_style),
        ],
        [
            Paragraph("3", td_style),
            Paragraph("22-08-2026 12:55:06", td_bold_style),
            Paragraph("agendado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.69.90.9", td_style),
            Paragraph("Cita agendada registrada en Dentalink.", td_style),
        ],
        [
            Paragraph("4", td_style),
            Paragraph("27-08-2026 13:56:52", td_bold_style),
            Paragraph("ingresado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.46", td_style),
            Paragraph("Tratamiento creado en Dentalink, pendiente de vincular prestaciones.", td_style),
        ],
        [
            Paragraph("5", td_style),
            Paragraph("27-08-2026 14:12:15", td_bold_style),
            Paragraph("agendado", badge_style),
            Paragraph("Javiera Marchant<br/><i>jmarchant@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.69.90.9", td_style),
            Paragraph("Tratamiento creado en Dentalink, pendiente de vincular prestaciones.", td_style),
        ],
        [
            Paragraph("6", td_style),
            Paragraph("27-08-2026 14:16:30", td_bold_style),
            Paragraph("ingresado", badge_style),
            Paragraph("Javiera Marchant<br/><i>jmarchant@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.69.90.9", td_style),
            Paragraph("Tratamiento creado en Dentalink, pendiente de vincular prestaciones.", td_style),
        ],
        [
            Paragraph("7", td_style),
            Paragraph("27-08-2026 14:38:59", td_bold_style),
            Paragraph("agendado", badge_style),
            Paragraph("Administrador General<br/><i>admin@policlinicotabancura.cl</i>", td_style),
            Paragraph("172.64.222.46", td_style),
            Paragraph("Cita agendada registrada en Dentalink.", td_style),
        ],
    ]

    t_p2_history = Table(p2_rows, colWidths=[18, 92, 62, 140, 68, 160])
    t_p2_history.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_p2_history)
    story.append(Spacer(1, 14))

    # Notes section
    story.append(Paragraph("<b>Nota técnica sobre zona horaria y auditoría:</b>", card_label))
    story.append(Paragraph("Todos los registros horarios en este informe reflejan la hora local de Chile (UTC-4), convertida desde los timestamps UTC registrados en la base de datos de PostgreSQL y la tabla <code>audit_logs</code>. Las acciones automáticas o manuales de sincronización con Dentalink quedan registradas con la identificación del usuario en sesión y su dirección IP de origen.", note_style))

    doc.build(story)
    print("PDF generado exitosamente en:", filename)

if __name__ == '__main__':
    build_pdf()
