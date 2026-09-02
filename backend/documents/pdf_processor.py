"""
StudyGemma - PDF Processor

Responsibilities:
- Read PDF files
- Extract text page-by-page
- Detect pages with insufficient text
- Detect images on pages
- Extract basic PDF metadata
- Preserve page/document structure
- Perform basic content cleaning
- Prepare RAG-ready page/chunk information
- Optionally use OCR for scanned pages

Does NOT:
- Store uploaded files
- Call Gemma
- Generate embeddings
- Perform vector search
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Callable, Optional, Union

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


logger = logging.getLogger(__name__)


class PDFProcessor:
    """
    PDF processing service for StudyGemma.
    """

    DEFAULT_MIN_TEXT_LENGTH = 30

    def __init__(
        self,
        min_text_length: int = DEFAULT_MIN_TEXT_LENGTH,
        ocr_service: Optional[Any] = None,
    ):
        """
        Args:
            min_text_length:
                Minimum amount of extracted text considered
                sufficient for a page.

            ocr_service:
                Optional OCR service instance.

                Expected interface:

                    ocr_service.extract_text(image_bytes)

        """

        self.min_text_length = max(
            1,
            min_text_length,
        )

        self.ocr_service = ocr_service

        if fitz is None:
            logger.warning(
                "PyMuPDF is not installed. "
                "Install it with: pip install PyMuPDF"
            )

    # =========================================================
    # MAIN PROCESS METHOD
    # =========================================================

    def process(
        self,
        pdf_path: Union[str, Path],
        use_ocr: bool = True,
    ) -> dict[str, Any]:
        """
        Process a complete PDF.

        Returns a structured dictionary containing:

        - document metadata
        - page information
        - extracted text
        - images information
        - OCR status
        - quality information
        - RAG-ready content
        """

        try:
            path = Path(pdf_path).resolve()

            if not path.exists():
                return self._failure(
                    f"PDF file not found: {path}"
                )

            if not path.is_file():
                return self._failure(
                    "Provided PDF path is not a file."
                )

            if path.suffix.lower() != ".pdf":
                return self._failure(
                    "Provided file is not a PDF."
                )

            if fitz is None:
                return self._failure(
                    "PyMuPDF is not installed."
                )

            document = fitz.open(str(path))

            try:

                metadata = self.extract_metadata(
                    document,
                    path,
                )

                pages = []
                rag_pages = []

                for page_number in range(
                    len(document)
                ):

                    page = document[
                        page_number
                    ]

                    page_result = (
                        self.process_page(
                            page=page,
                            page_number=page_number + 1,
                            use_ocr=use_ocr,
                        )
                    )

                    pages.append(
                        page_result
                    )

                    if page_result.get(
                        "success",
                        False,
                    ):

                        rag_pages.append(
                            self.create_rag_page(
                                page_result
                            )
                        )

                full_text = self.combine_pages(
                    pages
                )

                quality = (
                    self.validate_quality(
                        pages=pages,
                        full_text=full_text,
                    )
                )

                return {
                    "success": True,
                    "document": metadata,
                    "page_count": len(
                        document
                    ),
                    "pages": pages,
                    "full_text": full_text,
                    "quality": quality,
                    "rag_ready": {
                        "document_id": metadata[
                            "document_id"
                        ],
                        "page_count": len(
                            rag_pages
                        ),
                        "pages": rag_pages,
                        "text": full_text,
                    },
                }

            finally:

                document.close()

        except Exception as error:

            logger.exception(
                "PDF processing failed."
            )

            return self._failure(
                str(error)
            )

    # =========================================================
    # PROCESS SINGLE PAGE
    # =========================================================

    def process_page(
        self,
        page: Any,
        page_number: int,
        use_ocr: bool = True,
    ) -> dict[str, Any]:
        """
        Process one PDF page.
        """

        try:

            # -------------------------------------------------
            # Extract normal PDF text
            # -------------------------------------------------

            raw_text = page.get_text(
                "text"
            )

            cleaned_text = (
                self.clean_text(
                    raw_text
                )
            )

            text_length = len(
                cleaned_text
            )

            text_sufficient = (
                text_length
                >= self.min_text_length
            )

            # -------------------------------------------------
            # Detect images
            # -------------------------------------------------

            images = (
                self.extract_image_info(
                    page
                )
            )

            # -------------------------------------------------
            # Detect drawings
            # -------------------------------------------------

            drawings_count = self.get_drawings_count(
                page
            )

            # -------------------------------------------------
            # OCR
            # -------------------------------------------------

            ocr_used = False
            ocr_text = ""

            if (
                use_ocr
                and not text_sufficient
                and self.ocr_service is not None
            ):

                ocr_text = self.run_ocr(
                    page
                )

                if ocr_text:

                    ocr_text = (
                        self.clean_text(
                            ocr_text
                        )
                    )

                    if len(ocr_text) > text_length:

                        cleaned_text = ocr_text
                        text_length = len(
                            cleaned_text
                        )

                    ocr_used = True

            # -------------------------------------------------
            # Page type
            # -------------------------------------------------

            page_type = (
                self.detect_page_type(
                    text_length=text_length,
                    image_count=len(images),
                    ocr_used=ocr_used,
                )
            )

            # -------------------------------------------------
            # Structure
            # -------------------------------------------------

            structure = (
                self.detect_structure(
                    cleaned_text
                )
            )

            return {
                "success": True,
                "page_number": page_number,
                "text": cleaned_text,
                "text_length": text_length,
                "text_sufficient": (
                    text_length
                    >= self.min_text_length
                ),
                "ocr_used": ocr_used,
                "ocr_available": (
                    self.ocr_service is not None
                ),
                "page_type": page_type,
                "images": images,
                "image_count": len(images),
                "drawings_count": drawings_count,
                "structure": structure,
                "quality": {
                    "has_text": bool(
                        cleaned_text
                    ),
                    "has_images": bool(
                        images
                    ),
                    "needs_ocr": (
                        not text_sufficient
                        and not ocr_used
                    ),
                },
            }

        except Exception as error:

            logger.exception(
                "Failed to process page %s.",
                page_number,
            )

            return {
                "success": False,
                "page_number": page_number,
                "text": "",
                "error": str(error),
            }

    # =========================================================
    # PDF METADATA
    # =========================================================

    @staticmethod
    def extract_metadata(
        document: Any,
        pdf_path: Path,
    ) -> dict[str, Any]:
        """
        Extract PDF metadata.
        """

        metadata = document.metadata or {}

        document_id = (
            PDFProcessor.generate_document_id(
                pdf_path
            )
        )

        return {
            "document_id": document_id,
            "filename": pdf_path.name,
            "path": str(pdf_path),
            "title": metadata.get(
                "title"
            ) or "",
            "author": metadata.get(
                "author"
            ) or "",
            "subject": metadata.get(
                "subject"
            ) or "",
            "keywords": metadata.get(
                "keywords"
            ) or "",
            "creator": metadata.get(
                "creator"
            ) or "",
            "producer": metadata.get(
                "producer"
            ) or "",
            "format": metadata.get(
                "format"
            ) or "PDF",
            "page_count": len(
                document
            ),
        }

    # =========================================================
    # IMAGE INFORMATION
    # =========================================================

    @staticmethod
    def extract_image_info(
        page: Any,
    ) -> list[dict[str, Any]]:
        """
        Detect images embedded in a PDF page.

        Does not save extracted images.
        """

        images = []

        try:

            image_list = page.get_images(
                full=True
            )

            for index, image in enumerate(
                image_list
            ):

                xref = (
                    image[0]
                    if len(image) > 0
                    else None
                )

                width = (
                    image[2]
                    if len(image) > 2
                    else None
                )

                height = (
                    image[3]
                    if len(image) > 3
                    else None
                )

                colorspace = (
                    image[5]
                    if len(image) > 5
                    else None
                )

                images.append(
                    {
                        "index": index + 1,
                        "xref": xref,
                        "width": width,
                        "height": height,
                        "colorspace": colorspace,
                    }
                )

        except Exception as error:

            logger.warning(
                "Could not extract PDF image information: %s",
                error,
            )

        return images

    # =========================================================
    # DRAWING INFORMATION
    # =========================================================

    @staticmethod
    def get_drawings_count(
        page: Any,
    ) -> int:
        """
        Count vector drawings on a page.

        Useful for detecting diagrams/charts.
        """

        try:
            drawings = page.get_drawings()

            return len(drawings)

        except Exception:

            return 0

    # =========================================================
    # OCR
    # =========================================================

    def run_ocr(
        self,
        page: Any,
    ) -> str:
        """
        Render page and send it to the configured OCR service.

        The OCR service itself remains responsible for
        OCR implementation.
        """

        if self.ocr_service is None:

            return ""

        try:

            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(
                    2,
                    2,
                ),
                alpha=False,
            )

            image_bytes = (
                pixmap.tobytes(
                    "png"
                )
            )

            # -------------------------------------------------
            # Support common OCR interfaces
            # -------------------------------------------------

            if hasattr(
                self.ocr_service,
                "extract_text",
            ):

                result = (
                    self.ocr_service.extract_text(
                        image_bytes
                    )
                )

            elif hasattr(
                self.ocr_service,
                "process_image",
            ):

                result = (
                    self.ocr_service.process_image(
                        image_bytes
                    )
                )

            elif callable(
                self.ocr_service
            ):

                result = (
                    self.ocr_service(
                        image_bytes
                    )
                )

            else:

                logger.warning(
                    "OCR service does not provide "
                    "a supported interface."
                )

                return ""

            # -------------------------------------------------
            # Normalize OCR response
            # -------------------------------------------------

            if isinstance(
                result,
                str,
            ):

                return result

            if isinstance(
                result,
                dict,
            ):

                return str(
                    result.get(
                        "text",
                        "",
                    )
                )

            return str(
                result or ""
            )

        except Exception as error:

            logger.warning(
                "OCR failed: %s",
                error,
            )

            return ""

    # =========================================================
    # TEXT CLEANING
    # =========================================================

    @staticmethod
    def clean_text(
        text: Optional[str],
    ) -> str:
        """
        Clean extracted PDF text while preserving
        meaningful document content.
        """

        if not text:

            return ""

        # Normalize line endings.
        text = text.replace(
            "\r\n",
            "\n",
        )

        text = text.replace(
            "\r",
            "\n",
        )

        # Remove null characters.
        text = text.replace(
            "\x00",
            "",
        )

        # Remove excessive horizontal spaces.
        text = re.sub(
            r"[ \t]+",
            " ",
            text,
        )

        # Reduce excessive blank lines.
        text = re.sub(
            r"\n{3,}",
            "\n\n",
            text,
        )

        # Remove spaces surrounding newlines.
        text = re.sub(
            r" *\n *",
            "\n",
            text,
        )

        return text.strip()

    # =========================================================
    # STRUCTURE DETECTION
    # =========================================================

    @staticmethod
    def detect_structure(
        text: str,
    ) -> dict[str, Any]:
        """
        Perform lightweight structure detection.

        This does not attempt to understand the document
        semantically. That will later be handled by RAG/Gemma.
        """

        if not text:

            return {
                "headings": [],
                "lists": [],
                "paragraph_count": 0,
                "line_count": 0,
            }

        lines = [
            line.strip()
            for line in text.split("\n")
            if line.strip()
        ]

        headings = []
        lists = []

        for line in lines:

            # Markdown-like headings.
            if re.match(
                r"^#{1,6}\s+",
                line,
            ):

                headings.append(
                    line
                )

            # Numbered headings.
            elif re.match(
                r"^\d+[\.\)]\s+[A-Z]",
                line,
            ):

                headings.append(
                    line
                )

            # Bullet/list detection.
            if re.match(
                r"^[-*•]\s+",
                line,
            ):

                lists.append(
                    line
                )

            elif re.match(
                r"^\d+[\.\)]\s+",
                line,
            ):

                lists.append(
                    line
                )

        paragraphs = [
            paragraph.strip()
            for paragraph in re.split(
                r"\n\s*\n",
                text,
            )
            if paragraph.strip()
        ]

        return {
            "headings": headings,
            "heading_count": len(
                headings
            ),
            "lists": lists,
            "list_count": len(
                lists
            ),
            "paragraph_count": len(
                paragraphs
            ),
            "line_count": len(
                lines
            ),
        }

    # =========================================================
    # PAGE TYPE
    # =========================================================

    @staticmethod
    def detect_page_type(
        text_length: int,
        image_count: int,
        ocr_used: bool,
    ) -> str:
        """
        Classify page at a basic structural level.
        """

        if ocr_used:

            return "scanned_or_image_based"

        if text_length == 0 and image_count > 0:

            return "image_based"

        if (
            text_length > 0
            and image_count > 0
        ):

            return "mixed"

        if text_length > 0:

            return "text"

        return "empty"

    # =========================================================
    # COMBINE PAGE TEXT
    # =========================================================

    @staticmethod
    def combine_pages(
        pages: list[dict[str, Any]],
    ) -> str:
        """
        Combine page text while preserving page boundaries.
        """

        sections = []

        for page in pages:

            if not page.get(
                "success",
                False,
            ):

                continue

            page_number = page.get(
                "page_number"
            )

            text = page.get(
                "text",
                "",
            )

            if not text:

                continue

            sections.append(
                f"[Page {page_number}]\n{text}"
            )

        return "\n\n".join(
            sections
        )

    # =========================================================
    # RAG PAGE
    # =========================================================

    @staticmethod
    def create_rag_page(
        page: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Convert processed page information into a
        RAG-friendly representation.

        Embeddings are NOT generated here.
        """

        return {
            "page_number": page.get(
                "page_number"
            ),
            "text": page.get(
                "text",
                "",
            ),
            "metadata": {
                "page_number": page.get(
                    "page_number"
                ),
                "page_type": page.get(
                    "page_type"
                ),
                "ocr_used": page.get(
                    "ocr_used",
                    False,
                ),
                "image_count": page.get(
                    "image_count",
                    0,
                ),
                "structure": page.get(
                    "structure",
                    {},
                ),
            },
        }

    # =========================================================
    # QUALITY VALIDATION
    # =========================================================

    def validate_quality(
        self,
        pages: list[dict[str, Any]],
        full_text: str,
    ) -> dict[str, Any]:
        """
        Validate extraction quality.
        """

        total_pages = len(
            pages
        )

        successful_pages = sum(
            1
            for page in pages
            if page.get(
                "success",
                False,
            )
        )

        pages_with_text = sum(
            1
            for page in pages
            if page.get(
                "text",
                "",
            ).strip()
        )

        pages_needing_ocr = sum(
            1
            for page in pages
            if page.get(
                "quality",
                {},
            ).get(
                "needs_ocr",
                False,
            )
        )

        pages_with_images = sum(
            1
            for page in pages
            if page.get(
                "image_count",
                0,
            ) > 0
        )

        if total_pages == 0:

            extraction_percentage = 0.0

        else:

            extraction_percentage = round(
                (
                    pages_with_text
                    / total_pages
                )
                * 100,
                2,
            )

        if not full_text.strip():

            status = "poor"

        elif pages_needing_ocr > 0:

            status = "partial"

        elif pages_with_text == total_pages:

            status = "good"

        else:

            status = "partial"

        return {
            "status": status,
            "total_pages": total_pages,
            "successful_pages": successful_pages,
            "pages_with_text": pages_with_text,
            "pages_with_images": pages_with_images,
            "pages_needing_ocr": pages_needing_ocr,
            "text_length": len(
                full_text
            ),
            "extraction_percentage": (
                extraction_percentage
            ),
        }

    # =========================================================
    # DOCUMENT ID
    # =========================================================

    @staticmethod
    def generate_document_id(
        pdf_path: Path,
    ) -> str:
        """
        Generate a deterministic document ID from
        the resolved file path.

        FileManager can later provide a stronger
        content hash for uploaded files.
        """

        import hashlib

        value = str(
            pdf_path
        ).encode(
            "utf-8"
        )

        return hashlib.sha256(
            value
        ).hexdigest()[:32]

    # =========================================================
    # EXTRACT RAW PAGE TEXT
    # =========================================================

    def extract_text(
        self,
        pdf_path: Union[str, Path],
    ) -> str:
        """
        Convenience method when only complete text
        extraction is required.
        """

        result = self.process(
            pdf_path,
            use_ocr=False,
        )

        if not result.get(
            "success",
            False,
        ):

            raise RuntimeError(
                result.get(
                    "error",
                    "PDF processing failed.",
                )
            )

        return result.get(
            "full_text",
            "",
        )

    # =========================================================
    # PAGE COUNT
    # =========================================================

    def get_page_count(
        self,
        pdf_path: Union[str, Path],
    ) -> int:
        """
        Return the number of pages in a PDF.
        """

        if fitz is None:

            raise RuntimeError(
                "PyMuPDF is not installed."
            )

        path = Path(
            pdf_path
        ).resolve()

        if not path.exists():

            raise FileNotFoundError(
                path
            )

        document = fitz.open(
            str(path)
        )

        try:

            return len(
                document
            )

        finally:

            document.close()

    # =========================================================
    # FAILURE RESPONSE
    # =========================================================

    @staticmethod
    def _failure(
        error: str,
    ) -> dict[str, Any]:
        """
        Standard error response.
        """

        return {
            "success": False,
            "error": error,
        }


# =============================================================
# DEFAULT INSTANCE
# =============================================================

pdf_processor = PDFProcessor()
