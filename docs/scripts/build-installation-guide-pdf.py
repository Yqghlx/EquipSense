#!/usr/bin/env python3
"""生成 EquipSense 中文生产安装与验收 PDF。

该脚本只读取仓库内的 Markdown 源文档并生成静态交付物，不读取任何环境变量、
凭据或运行时数据。使用系统中可用的中文字体，确保打印版内容可复制和检索。
"""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs" / "INSTALLATION_GUIDE.md"
OUTPUT = ROOT / "output" / "pdf" / "equipsense-production-installation-guide.pdf"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf")
CODE_FONT_PATH = Path("/System/Library/Fonts/Supplemental/Courier New.ttf")
PAGE_WIDTH, PAGE_HEIGHT = A4
CONTENT_WIDTH = PAGE_WIDTH - 32 * mm
CODE_MARKER = chr(96)


def register_fonts() -> None:
    """注册支持中文正文和等宽代码的字体。"""
    if not FONT_PATH.exists():
        raise FileNotFoundError(f"未找到中文字体：{FONT_PATH}")
    if not CODE_FONT_PATH.exists():
        raise FileNotFoundError(f"未找到代码字体：{CODE_FONT_PATH}")
    pdfmetrics.registerFont(TTFont("EquipSans", str(FONT_PATH)))
    pdfmetrics.registerFont(TTFont("EquipCode", str(CODE_FONT_PATH)))


def inline_markup(value: str) -> str:
    """将有限 Markdown 行内语法转换为 ReportLab 安全 XML。"""
    escaped = html.escape(value, quote=False)
    marker = re.escape(CODE_MARKER)
    def replace_code(match: re.Match[str]) -> str:
        value = match.group(1)
        # 中文占位符无法由 Courier New 覆盖时回退到中文字体，避免打印出方框。
        font_name = "EquipCode" if value.isascii() else "EquipSans"
        return f'<font name="{font_name}" color="#0B4F6C">{value}</font>'

    escaped = re.sub(marker + r"([^" + CODE_MARKER + r"]+)" + marker, replace_code, escaped)
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(inline_markup(text), style)


def is_table_separator(line: str) -> bool:
    cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
    return bool(cells) and all(re.fullmatch(r":?-+:?", cell) for cell in cells)


def parse_table(lines: list[str], styles: dict[str, ParagraphStyle]) -> Table:
    """将简单 Markdown 表格转换为可打印的自适应表格。"""
    rows: list[list[str]] = []
    for line in lines:
        if is_table_separator(line):
            continue
        rows.append([cell.strip() for cell in line.strip().strip("|").split("|")])

    if not rows:
        return Table([[""]], colWidths=[CONTENT_WIDTH])

    column_count = max(len(row) for row in rows)
    normalized = [row + [""] * (column_count - len(row)) for row in rows]
    table_data = []
    for row_index, row in enumerate(normalized):
        cell_style = styles["table_header"] if row_index == 0 else styles["table_cell"]
        table_data.append([paragraph(cell, cell_style) for cell in row])

    base_width = CONTENT_WIDTH / column_count
    widths = [base_width] * column_count
    if column_count == 3:
        widths = [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.24, CONTENT_WIDTH * 0.54]
    elif column_count == 4:
        widths = [CONTENT_WIDTH * 0.25] * 4

    table = Table(table_data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B4F6C")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B8C7D1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F7FAFC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F6F8")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle("EquipBody", parent=base["BodyText"], fontName="EquipSans",
                               fontSize=9.7, leading=15.5, textColor=colors.HexColor("#243746"),
                               spaceAfter=6, alignment=TA_LEFT),
        "blockquote": ParagraphStyle("EquipQuote", parent=base["BodyText"], fontName="EquipSans",
                                     fontSize=9.2, leading=14, leftIndent=10, rightIndent=8,
                                     borderColor=colors.HexColor("#7AA6B8"), borderWidth=1,
                                     borderPadding=7, backColor=colors.HexColor("#F1F7F9"),
                                     textColor=colors.HexColor("#3B5664"), spaceBefore=3, spaceAfter=8),
        "h1": ParagraphStyle("EquipH1", parent=base["Heading1"], fontName="EquipSans",
                             fontSize=19, leading=25, textColor=colors.HexColor("#0B4F6C"),
                             spaceBefore=12, spaceAfter=9, keepWithNext=True),
        "h2": ParagraphStyle("EquipH2", parent=base["Heading2"], fontName="EquipSans",
                             fontSize=14, leading=19, textColor=colors.HexColor("#15616D"),
                             spaceBefore=11, spaceAfter=6, keepWithNext=True),
        "h3": ParagraphStyle("EquipH3", parent=base["Heading3"], fontName="EquipSans",
                             fontSize=11.5, leading=16, textColor=colors.HexColor("#376B78"),
                             spaceBefore=8, spaceAfter=4, keepWithNext=True),
        "bullet": ParagraphStyle("EquipBullet", parent=base["BodyText"], fontName="EquipSans",
                                 fontSize=9.5, leading=14.5, leftIndent=14, firstLineIndent=-10,
                                 textColor=colors.HexColor("#243746"), spaceAfter=3),
        "table_header": ParagraphStyle("EquipTableHeader", parent=base["BodyText"], fontName="EquipSans",
                                       fontSize=8.1, leading=10.5, textColor=colors.white),
        "table_cell": ParagraphStyle("EquipTableCell", parent=base["BodyText"], fontName="EquipSans",
                                     fontSize=7.8, leading=10.5, textColor=colors.HexColor("#243746")),
        "code": ParagraphStyle("EquipCode", parent=base["Code"], fontName="EquipSans",
                               fontSize=8.0, leading=10.8, textColor=colors.HexColor("#183B4A"),
                               backColor=colors.HexColor("#F2F5F7"), borderColor=colors.HexColor("#D3DEE4"),
                               borderWidth=0.5, borderPadding=7, leftIndent=4, rightIndent=4,
                               spaceBefore=4, spaceAfter=8),
        "cover_title": ParagraphStyle("EquipCoverTitle", parent=base["Title"], fontName="EquipSans",
                                      fontSize=28, leading=37, alignment=TA_CENTER,
                                      textColor=colors.HexColor("#0B4F6C"), spaceAfter=12),
        "cover_subtitle": ParagraphStyle("EquipCoverSubtitle", parent=base["BodyText"], fontName="EquipSans",
                                         fontSize=13, leading=21, alignment=TA_CENTER,
                                         textColor=colors.HexColor("#376B78"), spaceAfter=8),
        "cover_meta": ParagraphStyle("EquipCoverMeta", parent=base["BodyText"], fontName="EquipSans",
                                     fontSize=10, leading=17, alignment=TA_CENTER,
                                     textColor=colors.HexColor("#5B7180")),
    }


def parse_markdown(source: str, styles: dict[str, ParagraphStyle]) -> list[object]:
    """解析指南使用到的 Markdown 子集。"""
    lines = source.splitlines()
    story: list[object] = []
    paragraph_lines: list[str] = []
    index = 0
    fence = CODE_MARKER * 3

    def flush_paragraph() -> None:
        if paragraph_lines:
            text = " ".join(line.strip() for line in paragraph_lines).strip()
            if text:
                story.append(paragraph(text, styles["body"]))
            paragraph_lines.clear()

    while index < len(lines):
        line = lines[index]

        if line.startswith(fence):
            flush_paragraph()
            code_lines: list[str] = []
            index += 1
            while index < len(lines) and not lines[index].startswith(fence):
                code_lines.append(lines[index])
                index += 1
            story.append(Preformatted("\n".join(code_lines), styles["code"], maxLineLength=104))
            story.append(Spacer(1, 2))
            index += 1
            continue

        if line.startswith("|"):
            flush_paragraph()
            table_lines = []
            while index < len(lines) and lines[index].startswith("|"):
                table_lines.append(lines[index])
                index += 1
            story.append(parse_table(table_lines, styles))
            story.append(Spacer(1, 8))
            continue

        if line.strip() == "---":
            flush_paragraph()
            story.extend([Spacer(1, 2), HRFlowable(width="100%", thickness=0.7,
                                                  color=colors.HexColor("#C7D6DE")), Spacer(1, 8)])
            index += 1
            continue

        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            flush_paragraph()
            if heading.group(2).startswith("9. 最终签字"):
                # 签字表必须整页呈现，避免表头和签字行跨页造成交付误读。
                story.append(PageBreak())
            style_name = {1: "h1", 2: "h2", 3: "h3"}[len(heading.group(1))]
            story.append(paragraph(heading.group(2), styles[style_name]))
            index += 1
            continue

        if line.startswith(">"):
            flush_paragraph()
            quote_lines = []
            while index < len(lines) and lines[index].startswith(">"):
                quote_lines.append(lines[index][1:].strip())
                index += 1
            story.append(paragraph(" ".join(quote_lines), styles["blockquote"]))
            continue

        if re.match(r"^[-*]\s+", line):
            flush_paragraph()
            bullet_text = re.sub(r"^[-*]\s+", "", line).strip()
            if bullet_text.startswith("[ ]"):
                bullet_text = "[] " + bullet_text[3:].strip()
            elif bullet_text[:3].lower() == "[x]":
                bullet_text = "[x] " + bullet_text[3:].strip()
            story.append(paragraph("- " + bullet_text, styles["bullet"]))
            index += 1
            continue

        if re.match(r"^\d+\.\s+", line):
            flush_paragraph()
            story.append(paragraph(line.strip(), styles["bullet"]))
            index += 1
            continue

        if not line.strip():
            flush_paragraph()
            story.append(Spacer(1, 2))
            index += 1
            continue

        paragraph_lines.append(line)
        index += 1

    flush_paragraph()
    return story


def draw_header_footer(canvas, document) -> None:
    """绘制正文页眉、页脚和页码。"""
    canvas.saveState()
    if document.page > 1:
        canvas.setStrokeColor(colors.HexColor("#D7E1E6"))
        canvas.setLineWidth(0.5)
        canvas.line(16 * mm, PAGE_HEIGHT - 15 * mm, PAGE_WIDTH - 16 * mm, PAGE_HEIGHT - 15 * mm)
        canvas.setFont("EquipSans", 7.5)
        canvas.setFillColor(colors.HexColor("#71828D"))
        canvas.drawString(16 * mm, PAGE_HEIGHT - 11.5 * mm, "EquipSense | 生产安装与验收指南")
        canvas.drawRightString(PAGE_WIDTH - 16 * mm, 10 * mm, f"第 {document.page} 页")
        canvas.drawString(16 * mm, 10 * mm, "内部交付文档 | 请勿记录密钥明文")
    canvas.restoreState()


def read_body_lines(source: str) -> str:
    """移除封面标题和元信息，只保留正文 Markdown。"""
    lines = source.splitlines()
    title_index = next((i for i, line in enumerate(lines) if line.startswith("# ")), None)
    if title_index is None:
        raise ValueError("源文档缺少一级标题")
    index = title_index + 1
    while index < len(lines) and (lines[index].startswith(">") or not lines[index].strip()):
        index += 1
    return "\n".join(lines[index:])


def build_pdf() -> None:
    """读取 Markdown 并生成 PDF。"""
    register_fonts()
    source = SOURCE.read_text(encoding="utf-8")
    title = next(line[2:].strip() for line in source.splitlines() if line.startswith("# "))

    styles = build_styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm,
                                 topMargin=22 * mm, bottomMargin=17 * mm, title=title,
                                 author="EquipSense", subject="生产安装与验收")

    story: list[object] = [
        Spacer(1, 42 * mm),
        paragraph(title, styles["cover_title"]),
        paragraph("生产安装 · 安全配置 · 验收交接", styles["cover_subtitle"]),
        Spacer(1, 10 * mm),
        Table([
            [paragraph("适用版本", styles["table_header"]), paragraph("EquipSense v1.2.0", styles["table_cell"])],
            [paragraph("文档版本", styles["table_header"]), paragraph("1.0.0", styles["table_cell"])],
            [paragraph("更新日期", styles["table_header"]), paragraph("2026-08-12", styles["table_cell"])],
        ], colWidths=[42 * mm, 80 * mm], hAlign="CENTER", style=TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#0B4F6C")),
            ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#F1F7F9")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B8C7D1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])),
        Spacer(1, 18 * mm),
        paragraph("本指南面向实施工程师，覆盖从主机准备到 Production Ready 签字的最短可审计路径。真实凭证、许可证、域名、租户 UUID 和证书私钥必须通过受控渠道注入。", styles["cover_meta"]),
        PageBreak(),
    ]
    story.extend(parse_markdown(read_body_lines(source), styles))
    document.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    print(f"已生成：{OUTPUT}")


if __name__ == "__main__":
    build_pdf()
