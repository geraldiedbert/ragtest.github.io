"""
parse.py — Extract slide-level text from a PDF using docling.

Returns one SlideRaw per page, with original_text, section_heading,
prev_slide_title, and page_number.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.document_converter import PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions

# Reuse one converter across calls (expensive to init)
_pipeline_options = PdfPipelineOptions()
_pipeline_options.do_ocr = False  # PDFs from PPT usually have native text

_CONVERTER = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=_pipeline_options)
    }
)


@dataclass
class SlideRaw:
    page_number: int
    section_heading: str
    prev_slide_title: str
    original_text: str


def _estimate_tokens(text: str) -> int:
    return int(len(text.split()) * 1.3)


def _sliding_window(text: str, size: int = 1500, overlap: float = 0.1) -> list[str]:
    words = text.split()
    step = max(1, int(size * (1 - overlap)))
    windows = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + size])
        windows.append(chunk)
        i += step
    return windows


def parse_pdf(pdf_path: Path) -> list[SlideRaw]:
    """Parse a PDF and return one SlideRaw per page."""
    result = _CONVERTER.convert(str(pdf_path))
    doc = result.document

    slides: list[SlideRaw] = []
    prev_title = ""

    for page_no in sorted(doc.pages.keys()):
        page = doc.pages[page_no]

        heading = ""
        body_parts: list[str] = []

        for item, _level in doc.iterate_items(page_no=page_no):
            label = getattr(item, "label", "")
            text = ""

            # docling items may expose text via .text or .export_to_markdown()
            if hasattr(item, "text") and item.text:
                text = item.text.strip()
            elif hasattr(item, "export_to_markdown"):
                text = item.export_to_markdown().strip()

            if not text:
                continue

            label_str = str(label).lower()
            if "heading" in label_str or "title" in label_str:
                if not heading:
                    heading = text
                body_parts.append(text)
            else:
                body_parts.append(text)

        original_text = "\n".join(body_parts).strip()

        slides.append(
            SlideRaw(
                page_number=page_no,
                section_heading=heading,
                prev_slide_title=prev_title,
                original_text=original_text,
            )
        )
        prev_title = heading if heading else prev_title

    return slides


def chunk_slide(
    slide: SlideRaw,
    startup_name: str,
    max_tokens: int = 1500,
) -> list[dict]:
    """
    Return one dict per chunk. Usually one per slide.
    Falls back to sliding-window sub-chunks if slide text is too long.
    """
    base = {
        "startup_name": startup_name,
        "section_heading": slide.section_heading,
        "prev_slide_title": slide.prev_slide_title,
        "page_number": slide.page_number,
        "original_text": slide.original_text,
    }

    if _estimate_tokens(slide.original_text) <= max_tokens:
        return [{**base, "sub_index": 0}]

    windows = _sliding_window(slide.original_text, size=max_tokens)
    return [{**base, "original_text": w, "sub_index": i} for i, w in enumerate(windows)]
