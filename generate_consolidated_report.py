import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime

def format_chile_time(iso_str):
    if not iso_str:
        return "-"
    try:
        # ISO string to datetime
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        # UTC to Chile UTC-4
        import datetime as dt_module
        chile_dt = dt.astimezone(dt_module.timezone(dt_module.timedelta(hours=-4)))
        return chile_dt.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return iso_str[:16]

def format_rut(clean):
    if not clean:
        return "-"
    clean = str(clean).strip()
    if len(clean) < 2:
        return clean
    dv = clean[-1]
    num = clean[:-1]
    # format with points
    formatted_num = f"{int(num):,}".replace(",", ".")
    return f"{formatted_num}-{dv}"

def generate_consolidated_report(filename="reporte_consolidado_casos_derivaciones.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    primary = colors.HexColor("#1e3a8a")     # Deep Blue
    secondary = colors.HexColor("#0284c7")   # Sky Blue
    dark_text = colors.HexColor("#0f172a")
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748b")
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

    td_center = ParagraphStyle(
        'TDCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=dark_text,
        alignment=1
    )

    td_center_bold = ParagraphStyle(
        'TDCenterBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=dark_text,
        alignment=1
    )

    td_left = ParagraphStyle(
        'TDLeft',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=dark_text
    )

    td_left_bold = ParagraphStyle(
        'TDLeftBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_text
    )

    badge_en_tratamiento = ParagraphStyle(
        'BadgeEnTrat',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#6b21a8"),
        alignment=1
    )

    badge_agendado = ParagraphStyle(
        'BadgeAgendado',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#1d4ed8"),
        alignment=1
    )

    badge_sincronizado = ParagraphStyle(
        'BadgeSinc',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#0f766e"),
        alignment=1
    )

    badge_ingresado = ParagraphStyle(
        'BadgeIng',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#0369a1"),
        alignment=1
    )

    def get_badge(status):
        st = status.lower()
        if st == 'en_tratamiento':
            return Paragraph("EN TRATAMIENTO", badge_en_tratamiento)
        elif st == 'agendado':
            return Paragraph("AGENDADO", badge_agendado)
        elif st == 'sincronizado':
            return Paragraph("SINCRONIZADO", badge_sincronizado)
        elif st == 'finalizado':
            return Paragraph("FINALIZADO", badge_sincronizado)
        return Paragraph("INGRESADO", badge_ingresado)

    # 9 cases data from DB
    cases_data = [
        {
            "num": "0001",
            "rut": "92504611",
            "name": "Danny Robert Peterson Novicki",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "Camila Andrea Muñoz Allendes",
            "tto": "Pieza 2: Realizar [Corona Disilicato de Litio (Lab. Vitacura) [Dental]]",
            "status": "en_tratamiento",
            "h_ing": "2026-08-20T16:06:59.228Z",
            "h_sinc": "2026-08-20T20:27:57.212Z",
            "h_agend": "2026-08-20T21:18:53.523Z",
            "h_trat": "2026-08-26T20:23:53.174Z",
            "h_fin": None,
            "obs": "Tratamiento iniciado (cita atendida, en espera o atendiéndose en Dentalink)."
        },
        {
            "num": "0002",
            "rut": "275084662",
            "name": "Danny Mabel Aldaz Aranda",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "Gabriela Morales Soto",
            "tto": "Pieza 4: Realizar [Corona Disilicato de Litio (Lab. Vitacura) [Dental]]",
            "status": "agendado",
            "h_ing": "2026-08-21T12:32:09.362Z",
            "h_sinc": "2026-08-21T16:32:41.894Z",
            "h_agend": "2026-08-21T16:47:00.632Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0003",
            "rut": "65565609",
            "name": "Ana Violeta Rojas Flores",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "Camila Andrea Muñoz Allendes",
            "tto": "Pieza 30: Realizar [Incrustación Disilicato de Litio (Lab. vitacura) [Dental]]",
            "status": "agendado",
            "h_ing": "2026-08-21T18:39:37.215Z",
            "h_sinc": "2026-08-21T19:54:49.744Z",
            "h_agend": "2026-08-22T16:55:06.740Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0004",
            "rut": "118857658",
            "name": "Arturo Ramon Aracena Barriga",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "Camila Andrea Muñoz Allendes",
            "tto": "Pieza 31: Realizar [Incrustación Disilicato de Litio (Lab. vitacura) [Dental]]",
            "status": "agendado",
            "h_ing": "2026-08-24T16:50:14.033Z",
            "h_sinc": "2026-08-24T16:52:20.557Z",
            "h_agend": "2026-08-24T20:48:41.357Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0005",
            "rut": "68680565",
            "name": "Jorge Enrique Rios Badilla",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "Javiera Constanza Peña Bañados",
            "tto": "Pieza 30: Realizar [Incrustación Disilicato de Litio (Lab. vitacura) [Dental]]",
            "status": "agendado",
            "h_ing": "2026-08-25T15:41:05.397Z",
            "h_sinc": "2026-08-26T12:47:01.902Z",
            "h_agend": "2026-08-27T13:55:39.200Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0006",
            "rut": "268773622",
            "name": "EMELY VIDAL",
            "comuna": "Recoleta",
            "centro": "CESFAM VITACURA",
            "prof": "María José Reckmann González",
            "tto": "Pieza 18: Realizar [Tomografía por Grupo o Pieza [Rayos X]]",
            "status": "agendado",
            "h_ing": "2026-08-27T13:49:06.470Z",
            "h_sinc": "2026-08-27T17:08:23.375Z",
            "h_agend": "2026-08-27T17:56:06.770Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0007",
            "rut": "93456742",
            "name": "ESPERANZA CORDERO AVALOS",
            "comuna": "PUENTE ALTO",
            "centro": "CESFAM VITACURA",
            "prof": "María José Reckmann González",
            "tto": "Pieza 6: Realizar [Corona Disilicato de Litio (Lab. Vitacura) [Dental]]",
            "status": "agendado",
            "h_ing": "2026-08-27T14:38:30.574Z",
            "h_sinc": "2026-08-27T17:08:47.769Z",
            "h_agend": "2026-08-27T20:48:17.043Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0008",
            "rut": "269058862",
            "name": "Susana Nancy Montenegro Hidrogo",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "Camila Andrea Muñoz Allendes",
            "tto": "Pieza 5: Realizar [Corona Disilicato de Litio (Lab. Vitacura) [Dental]]",
            "status": "agendado",
            "h_ing": "2026-08-27T16:36:57.498Z",
            "h_sinc": "2026-08-27T17:09:06.944Z",
            "h_agend": "2026-08-27T21:00:06.343Z",
            "h_trat": None,
            "h_fin": None,
            "obs": "Cita agendada registrada en Dentalink."
        },
        {
            "num": "0009",
            "rut": "182119016",
            "name": "CONSUELO MORAGA DEL SOLAR",
            "comuna": "Vitacura",
            "centro": "CESFAM VITACURA",
            "prof": "María José Reckmann González",
            "tto": "Pieza 13: Realizar [Corona Disilicato de Litio (Lab. Vitacura) [Dental]]",
            "status": "sincronizado",
            "h_ing": "2026-08-27T16:38:12.863Z",
            "h_sinc": "2026-08-27T17:09:26.759Z",
            "h_agend": None,
            "h_trat": None,
            "h_fin": None,
            "obs": "Sincronizado automáticamente con Dentalink"
        },
    ]

    story = []

    # ==================== PLANA 1 ====================
    # Header
    story.append(Paragraph("Reporte Consolidado de Casos y Auditoría de Estados", title_style))
    story.append(Paragraph("<b>Convenio Asistencial:</b> Policlínico Tabancura & Municipalidad de Vitacura<br/><b>Fecha de emisión:</b> 27 de Agosto de 2026 | <b>Plana 1 de 2:</b> Tabla General de Derivaciones y Trazabilidad Cronológica", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary, spaceAfter=8))

    # General Table Header
    gen_headers = [
        Paragraph("<b>N°</b>", th_style),
        Paragraph("<b>Paciente / RUT</b>", th_style),
        Paragraph("<b>Profesional Derivador</b>", th_style),
        Paragraph("<b>Tratamiento / Prestación</b>", th_style),
        Paragraph("<b>Fecha Ingreso</b>", th_style),
        Paragraph("<b>Fecha Sinc.</b>", th_style),
        Paragraph("<b>Fecha Agend.</b>", th_style),
        Paragraph("<b>Estado Actual</b>", th_style),
    ]

    gen_rows = [gen_headers]

    for c in cases_data:
        gen_rows.append([
            Paragraph(f"<b>{c['num']}</b>", td_center_bold),
            Paragraph(f"<b>{c['name']}</b><br/><font color='#475569'>{format_rut(c['rut'])}</font>", td_left),
            Paragraph(f"{c['prof']}<br/><i>{c['centro']}</i>", td_left),
            Paragraph(f"{c['tto']}", td_left),
            Paragraph(format_chile_time(c['h_ing']), td_center),
            Paragraph(format_chile_time(c['h_sinc']), td_center),
            Paragraph(format_chile_time(c['h_agend']), td_center),
            get_badge(c['status']),
        ])

    t_general = Table(gen_rows, colWidths=[24, 105, 100, 120, 52, 52, 52, 60])
    t_general.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    
    # Add alternating background
    for i in range(1, len(gen_rows)):
        if i % 2 == 0:
            t_general.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), light_bg)]))

    story.append(t_general)
    story.append(Spacer(1, 10))

    # Summary box
    summary_data = [
        [
            Paragraph("<b>Total Derivaciones:</b> 9", td_left),
            Paragraph("<b>En Tratamiento:</b> 1", td_left),
            Paragraph("<b>Agendados:</b> 7", td_left),
            Paragraph("<b>Sincronizados:</b> 1", td_left),
            Paragraph("<b>Ingresados:</b> 0", td_left),
        ]
    ]
    t_summary = Table(summary_data, colWidths=[110, 110, 110, 110, 110])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_summary)

    # PAGE BREAK TO PLANA 2
    story.append(PageBreak())

    # ==================== PLANA 2 ====================
    story.append(Paragraph("Detalle de Auditoría y Cronología por Paciente", title_style))
    story.append(Paragraph("<b>Convenio Asistencial:</b> Policlínico Tabancura & Municipalidad de Vitacura<br/><b>Plana 2 de 2:</b> Registro Individualizado de Observaciones y Marcas de Tiempo Clínicas (Horario Chile UTC-4)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary, spaceAfter=8))

    det_headers = [
        Paragraph("<b>N°</b>", th_style),
        Paragraph("<b>Paciente / Comuna</b>", th_style),
        Paragraph("<b>Ingresado</b>", th_style),
        Paragraph("<b>Sincronizado</b>", th_style),
        Paragraph("<b>Agendado</b>", th_style),
        Paragraph("<b>En Tratamiento</b>", th_style),
        Paragraph("<b>Observación y Estado Actual</b>", th_style),
    ]

    det_rows = [det_headers]

    for c in cases_data:
        det_rows.append([
            Paragraph(f"<b>{c['num']}</b>", td_center_bold),
            Paragraph(f"<b>{c['name']}</b><br/><font color='#475569'>{format_rut(c['rut'])} ({c['comuna']})</font>", td_left),
            Paragraph(format_chile_time(c['h_ing']), td_center),
            Paragraph(format_chile_time(c['h_sinc']), td_center),
            Paragraph(format_chile_time(c['h_agend']), td_center),
            Paragraph(format_chile_time(c['h_trat']), td_center),
            Paragraph(f"{c['obs']}", td_left),
        ])

    t_detail = Table(det_rows, colWidths=[24, 115, 60, 60, 60, 60, 180])
    t_detail.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))

    for i in range(1, len(det_rows)):
        if i % 2 == 0:
            t_detail.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), light_bg)]))

    story.append(t_detail)
    story.append(Spacer(1, 10))

    # Bottom notes
    notes = [
        [
            Paragraph("<b>Notas de Integración y Reglas de Negocio:</b><br/>"
                      "• <b>Zona Horaria:</b> Todas las marcas temporales se encuentran expresadas en hora oficial de Chile Continental (UTC-4).<br/>"
                      "• <b>Sincronización Bidireccional:</b> Los estados avanzan automáticamente según eventos de agenda, evolución o prestaciones registradas en Dentalink.<br/>"
                      "• <b>Monotonía y Auditoría:</b> Se garantiza la integridad histórica sin regresión a estados iniciales cuando los planes ya han sido creados en la ficha dental.", ParagraphStyle('NoteStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=7, leading=9.5, textColor=colors.HexColor("#334155")))
        ]
    ]
    t_notes = Table(notes, colWidths=[559])
    t_notes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_notes)

    doc.build(story)
    print("Reporte de dos planas generado exitosamente en:", filename)

if __name__ == '__main__':
    generate_consolidated_report()
