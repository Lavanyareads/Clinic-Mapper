"""
Clinic-Cluster Mapper - PDF Report Generator
Generates professional research reports using ReportLab.
"""
import os
from datetime import datetime
from typing import Dict, Any, Optional

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, HRFlowable
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

import pandas as pd


def generate_pdf_report(analysis_data: Dict[str, Any], filepath: str) -> str:
    """
    Generate a professional PDF report from analysis results.

    Args:
        analysis_data: Dictionary containing all analysis results
        filepath: Output file path for the PDF

    Returns:
        The filepath of the generated PDF
    """
    if not HAS_REPORTLAB:
        # Fallback: generate a simple text report
        with open(filepath, "w") as f:
            f.write("Clinic-Cluster Mapper - Healthcare Accessibility Report\n")
            f.write("=" * 60 + "\n\n")
            f.write("ReportLab is not installed. Install it with: pip install reportlab\n")
            f.write("This is a text-only fallback report.\n\n")
            _write_text_report(f, analysis_data)
        return filepath

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#0e4d7b"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.HexColor("#555555"),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#0e4d7b"),
        spaceBefore=16,
        spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#cc0000"),
        backColor=colors.HexColor("#fff3f3"),
        borderColor=colors.HexColor("#cc0000"),
        borderWidth=1,
        borderPadding=8,
        spaceBefore=10,
        spaceAfter=10,
    )

    elements = []

    # ---- TITLE PAGE ----
    elements.append(Spacer(1, 80))
    elements.append(Paragraph("CLINIC-CLUSTER MAPPER", title_style))
    elements.append(Paragraph(
        "AI-Powered Healthcare Accessibility &amp; Telemedicine Hub Optimization",
        subtitle_style
    ))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Report Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}",
        ParagraphStyle("Date", parent=styles["Normal"], fontSize=10, alignment=TA_CENTER, textColor=colors.grey)
    ))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        "<b>IMPORTANT DISCLAIMER:</b> This is an academic decision-support prototype. "
        "All data used is synthetic/demo data. This system is NOT a medical diagnosis tool "
        "and should NOT be used for actual clinical or policy decisions without expert review. "
        "All weights and thresholds are modeling assumptions, NOT medical standards.",
        disclaimer_style
    ))
    elements.append(PageBreak())

    # ---- EXECUTIVE SUMMARY ----
    elements.append(Paragraph("1. Executive Summary", heading_style))

    communities_df = analysis_data.get("communities_df")
    if communities_df is not None:
        total_pop = int(communities_df["population"].sum())
        n_communities = len(communities_df)
        avg_eq = float(communities_df["equity_score"].mean()) if "equity_score" in communities_df.columns else 0

        summary_text = (
            f"This report analyzes healthcare accessibility across {n_communities} communities "
            f"with a total population of {total_pop:,}. "
            f"The average healthcare equity score is {avg_eq:.1f}/100."
        )

        underserved_df = analysis_data.get("underserved_df")
        if underserved_df is not None:
            n_underserved = len(underserved_df)
            summary_text += f" {n_underserved} communities ({n_underserved / n_communities * 100:.1f}%) were identified as underserved."

        hub_result = analysis_data.get("hub_result")
        if hub_result:
            n_hubs = len(hub_result.get("hub_locations", []))
            summary_text += f" {n_hubs} telemedicine hub locations have been recommended."

        elements.append(Paragraph(summary_text, body_style))
    else:
        elements.append(Paragraph("No data was loaded for this report.", body_style))

    elements.append(Spacer(1, 10))

    # ---- DATASET STATISTICS ----
    elements.append(Paragraph("2. Dataset Statistics", heading_style))

    if communities_df is not None:
        n_fac = len(analysis_data.get("facilities_df", [])) if analysis_data.get("facilities_df") is not None else 0
        n_spec = len(analysis_data.get("specialists_df", [])) if analysis_data.get("specialists_df") is not None else 0

        data_table = [
            ["Metric", "Value"],
            ["Communities", str(len(communities_df))],
            ["Total Population", f"{int(communities_df['population'].sum()):,}"],
            ["Healthcare Facilities", str(n_fac)],
            ["Specialist Centers", str(n_spec)],
            ["Avg Distance to Clinic", f"{communities_df['distance_to_nearest_clinic_km'].mean():.1f} km"],
            ["Avg Distance to Specialist", f"{communities_df['distance_to_nearest_specialist_km'].mean():.1f} km"],
            ["Avg Connectivity", f"{communities_df['internet_connectivity'].mean():.2f}"],
            ["Avg Road Accessibility", f"{communities_df['road_accessibility'].mean():.2f}"],
        ]

        t = Table(data_table, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0e4d7b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8f9fa")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ]))
        elements.append(t)

    elements.append(Spacer(1, 10))

    # ---- CLUSTER ANALYSIS ----
    elements.append(Paragraph("3. Cluster Analysis", heading_style))

    clustering_result = analysis_data.get("clustering_result")
    cluster_profiles = analysis_data.get("cluster_profiles")

    if clustering_result:
        elements.append(Paragraph(
            f"K-Means clustering was performed with K={clustering_result.get('k', 'N/A')}. "
            f"Silhouette Score: {clustering_result.get('silhouette_score', 0):.4f}. "
            f"Inertia: {clustering_result.get('inertia', 0):.2f}.",
            body_style
        ))

    if cluster_profiles:
        elements.append(Spacer(1, 6))
        profile_data = [["Cluster", "Label", "Size", "Avg Equity Score"]]
        for p in cluster_profiles:
            avg_eq = p.get("mean_values", {}).get("equity_score", 0)
            if not isinstance(avg_eq, (int, float)):
                avg_eq = 0
            profile_data.append([
                str(p.get("cluster_id", "")),
                str(p.get("label", ""))[:40],
                str(p.get("size", 0)),
                f"{avg_eq:.1f}" if avg_eq else "N/A"
            ])

        t = Table(profile_data, colWidths=[60, 180, 60, 100])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0e4d7b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ]))
        elements.append(t)

    elements.append(Spacer(1, 10))

    # ---- HEALTHCARE EQUITY ANALYSIS ----
    elements.append(Paragraph("4. Healthcare Equity Analysis", heading_style))

    equity_scores = analysis_data.get("equity_scores")
    if equity_scores is not None:
        elements.append(Paragraph(
            f"Healthcare equity scores range from {equity_scores.min():.1f} to {equity_scores.max():.1f} "
            f"with a mean of {equity_scores.mean():.1f} and median of {equity_scores.median():.1f}. "
            f"The score is a weighted composite of specialist distance (25%), clinic distance (15%), "
            f"vulnerability index (20%), demand ratio (15%), connectivity (15%), and road access (10%).",
            body_style
        ))

    elements.append(Paragraph(
        "Note: These weights are modeling assumptions for academic analysis, NOT official medical standards.",
        disclaimer_style
    ))

    # ---- UNDERSERVED AREAS ----
    elements.append(Paragraph("5. Underserved Areas", heading_style))

    underserved_df = analysis_data.get("underserved_df")
    if underserved_df is not None and not underserved_df.empty:
        n_critical = len(underserved_df[underserved_df["priority"] == "Critical"]) if "priority" in underserved_df.columns else 0
        n_high = len(underserved_df[underserved_df["priority"] == "High"]) if "priority" in underserved_df.columns else 0

        elements.append(Paragraph(
            f"{len(underserved_df)} communities were identified as underserved. "
            f"Of these, {n_critical} are classified as Critical priority and {n_high} as High priority.",
            body_style
        ))

        # Top 10 underserved
        top_10 = underserved_df.head(10)
        underserved_table = [["Village", "Population", "Priority", "Equity Score"]]
        for _, row in top_10.iterrows():
            underserved_table.append([
                str(row.get("village_name", ""))[:30],
                str(int(row.get("population", 0))),
                str(row.get("priority", "")),
                f"{row.get('equity_score', 0):.1f}",
            ])

        t = Table(underserved_table, colWidths=[140, 80, 80, 80])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc3545")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff3f3")]),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("Underserved detection has not been run.", body_style))

    elements.append(Spacer(1, 10))

    # ---- HUB RECOMMENDATIONS ----
    elements.append(Paragraph("6. Recommended Telemedicine Hub Locations", heading_style))

    hub_result = analysis_data.get("hub_result")
    if hub_result:
        hubs = hub_result.get("hub_locations", [])
        elements.append(Paragraph(
            f"{len(hubs)} telemedicine hub locations were recommended using "
            f"{hub_result.get('mode', 'population')}-first optimization.",
            body_style
        ))

        hub_table = [["Hub #", "Lat", "Lon", "Communities", "Pop. Covered", "Improvement (km)"]]
        for i, h in enumerate(hubs):
            hub_table.append([
                str(i + 1),
                f"{h.get('lat', 0):.4f}",
                f"{h.get('lon', 0):.4f}",
                str(h.get("communities_served", 0)),
                f"{h.get('population_covered', 0):,}",
                f"{h.get('accessibility_improvement', 0):.2f}",
            ])

        t = Table(hub_table, colWidths=[40, 70, 70, 70, 90, 90])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#198754")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0fff4")]),
        ]))
        elements.append(t)

        # Before/After
        metrics = hub_result.get("overall_metrics", {})
        if metrics:
            elements.append(Spacer(1, 8))
            elements.append(Paragraph(
                f"<b>Total population covered:</b> {metrics.get('total_pop_covered', 0):,}<br/>"
                f"<b>Vulnerable population covered:</b> {metrics.get('vulnerable_pop_covered', 0):,}<br/>"
                f"<b>Average accessibility improvement:</b> {metrics.get('avg_improvement', 0):.2f} km",
                body_style
            ))
    else:
        elements.append(Paragraph("Hub optimization has not been run.", body_style))

    # ---- METHODOLOGY ----
    elements.append(PageBreak())
    elements.append(Paragraph("7. Methodology", heading_style))
    elements.append(Paragraph(
        "This analysis uses K-Means clustering on standardized healthcare accessibility features, "
        "a weighted composite equity score, threshold-based underserved detection, and "
        "facility-location optimization for hub placement. K-Means++ initialization with "
        "iterative refinement is used for hub optimization.",
        body_style
    ))

    # ---- LIMITATIONS ----
    elements.append(Paragraph("8. Limitations &amp; Data Quality", heading_style))
    elements.append(Paragraph(
        "Key limitations of this analysis:<br/>"
        "1. Demo/synthetic data is used - not actual healthcare records.<br/>"
        "2. Distances are straight-line (haversine), not actual road distances.<br/>"
        "3. Equity score weights are modeling assumptions, not medical standards.<br/>"
        "4. The model does not account for political, budgetary, or regulatory constraints.<br/>"
        "5. This is an academic prototype and should not be used for actual clinical decisions.<br/>"
        "6. No real patient data or PII is used in this system.",
        body_style
    ))

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#dee2e6")))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        "Clinic-Cluster Mapper - Academic Decision-Support Prototype",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, alignment=TA_CENTER, textColor=colors.grey)
    ))

    doc.build(elements)
    return filepath


def _write_text_report(f, analysis_data: Dict[str, Any]):
    """Fallback text report when ReportLab is not available."""
    f.write("DISCLAIMER: Academic Decision-Support Prototype\n\n")

    communities_df = analysis_data.get("communities_df")
    if communities_df is not None:
        f.write(f"Communities: {len(communities_df)}\n")
        f.write(f"Total Population: {int(communities_df['population'].sum()):,}\n")

    clustering_result = analysis_data.get("clustering_result")
    if clustering_result:
        f.write(f"\nClustering K={clustering_result.get('k')}, "
                f"Silhouette={clustering_result.get('silhouette_score', 0):.4f}\n")

    hub_result = analysis_data.get("hub_result")
    if hub_result:
        hubs = hub_result.get("hub_locations", [])
        f.write(f"\nRecommended Hubs: {len(hubs)}\n")
        for i, h in enumerate(hubs):
            f.write(f"  Hub {i + 1}: ({h.get('lat', 0):.4f}, {h.get('lon', 0):.4f}) - "
                    f"{h.get('communities_served', 0)} communities, "
                    f"pop: {h.get('population_covered', 0):,}\n")
