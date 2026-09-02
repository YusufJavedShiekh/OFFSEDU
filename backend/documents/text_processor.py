"""
StudyGemma - Text Processor

Responsibilities:
- Validate text files
- Detect common text encodings
- Read text safely
- Normalize Unicode
- Clean extracted text
- Detect paragraphs
- Detect headings
- Detect sections
- Generate metadata
- Validate content quality
- Preserve document structure
- Produce RAG-ready output

Does NOT:
- Generate embeddings
- Store vectors
- Perform retrieval
- Call Gemma
"""

from __future__ import annotations

import hashlib
import logging
import re
import unicodedata
from pathlib import Path
from typing import Any, Union


logger = logging.getLogger(__name__)


class TextProcessor:
    """
    Processor for plain-text documents.
    """

    SUPPORTED_EXTENSIONS = {
        ".txt",
        ".text",
        ".md",
        ".markdown",
        ".log",
        ".csv",
    }

    COMMON_ENCODINGS = (
        "utf-8",
        "utf-8-sig",
        "utf-16",
        "utf-16-le",
        "utf-16-be",
        "cp1252",
        "latin-1",
    )

    MAX_DEFAULT_FILE_SIZE = 50 * 1024 * 1024

    def __init__(
        self,
        max_file_size: int = MAX_DEFAULT_FILE_SIZE,
    ):
        self.max_file_size = max(
            1,
            max_file_size,
        )

    # =========================================================
    # MAIN PROCESS
    # =========================================================

    def process(
        self,
        file_path: Union[str, Path],
    ) -> dict[str, Any]:
        """
        Process a text file and return RAG-ready data.
        """

        try:
            path = Path(file_path).resolve()

            validation = self.validate_file(path)

            if not validation["valid"]:
                return self._failure(
                    validation["error"]
                )

            encoding = self.detect_encoding(path)

            raw_text = self.read_file(
                path,
                encoding,
            )

            if not raw_text.strip():
                return self._failure(
                    "The text file is empty."
                )

            normalized_text = self.normalize_text(
                raw_text
            )

            cleaned_text = self.clean_text(
                normalized_text
            )

            paragraphs = self.extract_paragraphs(
                cleaned_text
            )

            headings = self.detect_headings(
                paragraphs
            )

            sections = self.detect_sections(
                paragraphs,
                headings,
            )

            metadata = self.extract_metadata(
                path=path,
                text=cleaned_text,
                encoding=encoding,
                paragraphs=paragraphs,
                headings=headings,
                sections=sections,
            )

            quality = self.validate_quality(
                raw_text=raw_text,
                cleaned_text=cleaned_text,
                paragraphs=paragraphs,
                headings=headings,
            )

            rag_ready = self.create_rag_format(
                metadata=metadata,
                paragraphs=paragraphs,
                sections=sections,
                text=cleaned_text,
            )

            return {
                "success": True,
                "document": metadata,
                "encoding": encoding,
                "text": cleaned_text,
                "paragraphs": paragraphs,
                "headings": headings,
                "sections": sections,
                "quality": quality,
                "rag_ready": rag_ready,
            }

        except Exception as error:

            logger.exception(
                "Text processing failed."
            )

            return self._failure(
                str(error)
            )

    # =========================================================
    # VALIDATION
    # =========================================================

    def validate_file(
        self,
        path: Path,
    ) -> dict[str, Any]:
        """
        Validate the input text file.
        """

        if not path.exists():

            return {
                "valid": False,
                "error": (
                    f"Text file not found: {path}"
                ),
            }

        if not path.is_file():

            return {
                "valid": False,
                "error": (
                    "Provided path is not a file."
                ),
            }

        if (
            path.suffix.lower()
            not in self.SUPPORTED_EXTENSIONS
        ):

            return {
                "valid": False,
                "error": (
                    f"Unsupported text extension: "
                    f"{path.suffix}"
                ),
            }

        try:
            file_size = path.stat().st_size

        except OSError as error:

            return {
                "valid": False,
                "error": (
                    f"Unable to read file information: "
                    f"{error}"
                ),
            }

        if file_size == 0:

            return {
                "valid": False,
                "error": (
                    "The text file is empty."
                ),
            }

        if file_size > self.max_file_size:

            return {
                "valid": False,
                "error": (
                    "Text file exceeds the maximum "
                    f"allowed size of "
                    f"{self.max_file_size // (1024 * 1024)} MB."
                ),
            }

        return {
            "valid": True,
            "error": None,
            "size": file_size,
        }

    # =========================================================
    # ENCODING DETECTION
    # =========================================================

    def detect_encoding(
        self,
        path: Path,
    ) -> str:
        """
        Detect a usable encoding.

        BOM detection is performed first, followed by
        common encodings.
        """

        with path.open(
            "rb"
        ) as file:

            sample = file.read(
                4096
            )

        # -----------------------------------------------------
        # Byte Order Marks
        # -----------------------------------------------------

        if sample.startswith(
            b"\xef\xbb\xbf"
        ):

            return "utf-8-sig"

        if sample.startswith(
            b"\xff\xfe"
        ):

            return "utf-16-le"

        if sample.startswith(
            b"\xfe\xff"
        ):

            return "utf-16-be"

        # -----------------------------------------------------
        # Try common encodings
        # -----------------------------------------------------

        for encoding in self.COMMON_ENCODINGS:

            try:

                sample.decode(
                    encoding
                )

                return encoding

            except UnicodeDecodeError:

                continue

        # latin-1 can decode any byte sequence.
        return "latin-1"

    # =========================================================
    # READ FILE
    # =========================================================

    @staticmethod
    def read_file(
        path: Path,
        encoding: str,
    ) -> str:
        """
        Read the complete text using the detected encoding.
        """

        with path.open(
            "r",
            encoding=encoding,
            errors="replace",
        ) as file:

            return file.read()

    # =========================================================
    # NORMALIZE TEXT
    # =========================================================

    @staticmethod
    def normalize_text(
        text: str,
    ) -> str:
        """
        Normalize Unicode and line endings.
        """

        if not text:
            return ""

        # Unicode normalization preserves characters while
        # converting equivalent Unicode representations
        # into a consistent form.
        text = unicodedata.normalize(
            "NFC",
            text,
        )

        text = text.replace(
            "\r\n",
            "\n",
        )

        text = text.replace(
            "\r",
            "\n",
        )

        text = text.replace(
            "\x00",
            "",
        )

        return text

    # =========================================================
    # CLEAN TEXT
    # =========================================================

    @staticmethod
    def clean_text(
        text: str,
    ) -> str:
        """
        Remove unnecessary whitespace while preserving
        meaningful paragraph boundaries.
        """

        if not text:
            return ""

        lines = []

        for line in text.split("\n"):

            # Replace tabs and repeated spaces.
            line = re.sub(
                r"[ \t]+",
                " ",
                line,
            )

            # Remove spaces around each line.
            line = line.strip()

            lines.append(
                line
            )

        cleaned = "\n".join(
            lines
        )

        # Collapse excessive blank lines.
        cleaned = re.sub(
            r"\n{3,}",
            "\n\n",
            cleaned,
        )

        return cleaned.strip()

    # =========================================================
    # PARAGRAPH EXTRACTION
    # =========================================================

    @staticmethod
    def extract_paragraphs(
        text: str,
    ) -> list[dict[str, Any]]:
        """
        Split the document into logical paragraphs.
        """

        if not text:
            return []

        raw_paragraphs = re.split(
            r"\n\s*\n",
            text,
        )

        paragraphs = []

        for index, paragraph in enumerate(
            raw_paragraphs,
            start=1,
        ):

            paragraph = (
                paragraph.strip()
            )

            if not paragraph:
                continue

            paragraphs.append(
                {
                    "paragraph_number": index,
                    "text": paragraph,
                    "word_count": (
                        TextProcessor.count_words(
                            paragraph
                        )
                    ),
                    "character_count": len(
                        paragraph
                    ),
                }
            )

        # Renumber after removing empty paragraphs.
        for index, paragraph in enumerate(
            paragraphs,
            start=1,
        ):

            paragraph[
                "paragraph_number"
            ] = index

        return paragraphs

    # =========================================================
    # HEADING DETECTION
    # =========================================================

    @staticmethod
    def detect_headings(
        paragraphs: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Detect likely headings using multiple signals.

        This is heuristic because plain text files do not
        contain guaranteed heading metadata.
        """

        headings = []

        for paragraph in paragraphs:

            text = paragraph.get(
                "text",
                "",
            ).strip()

            if not text:
                continue

            lines = text.splitlines()

            # A paragraph containing multiple lines is less
            # likely to be a simple heading.
            if len(lines) > 2:
                continue

            if len(text) > 150:
                continue

            score = 0

            # Markdown heading.
            if re.match(
                r"^#{1,6}\s+",
                text,
            ):

                score += 5

            # Numbered heading.
            if re.match(
                r"^\d+(\.\d+)*[\.)]?\s+\S+",
                text,
            ):

                score += 3

            # Roman/letter section heading.
            if re.match(
                r"^[A-Z][\.)]\s+\S+",
                text,
            ):

                score += 2

            # All-uppercase short line.
            letters = [
                char
                for char in text
                if char.isalpha()
            ]

            if letters:

                uppercase_ratio = (
                    sum(
                        char.isupper()
                        for char in letters
                    )
                    / len(letters)
                )

                if (
                    uppercase_ratio >= 0.8
                    and len(text) <= 100
                ):

                    score += 3

            # Remove Markdown markers for analysis.
            clean_heading = re.sub(
                r"^#{1,6}\s+",
                "",
                text,
            ).strip()

            # Short title-like paragraph.
            word_count = (
                TextProcessor.count_words(
                    clean_heading
                )
            )

            if (
                1 <= word_count <= 12
                and not clean_heading.endswith(
                    "."
                )
            ):

                score += 1

            if score >= 3:

                level = (
                    TextProcessor.detect_heading_level(
                        text
                    )
                )

                headings.append(
                    {
                        "paragraph_number": (
                            paragraph[
                                "paragraph_number"
                            ]
                        ),
                        "text": clean_heading,
                        "level": level,
                        "confidence": min(
                            1.0,
                            score / 6,
                        ),
                    }
                )

        return headings

    # =========================================================
    # HEADING LEVEL
    # =========================================================

    @staticmethod
    def detect_heading_level(
        text: str,
    ) -> int:
        """
        Estimate heading level.
        """

        markdown_match = re.match(
            r"^(#{1,6})\s+",
            text,
        )

        if markdown_match:

            return len(
                markdown_match.group(1)
            )

        number_match = re.match(
            r"^(\d+(?:\.\d+)*)[\.)]?\s+",
            text,
        )

        if number_match:

            number = (
                number_match.group(1)
            )

            return min(
                6,
                number.count(".") + 1,
            )

        return 1

    # =========================================================
    # SECTION DETECTION
    # =========================================================

    @staticmethod
    def detect_sections(
        paragraphs: list[dict[str, Any]],
        headings: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Group paragraphs into sections based on headings.
        """

        if not paragraphs:
            return []

        heading_map = {
            heading[
                "paragraph_number"
            ]: heading
            for heading in headings
        }

        sections = []
        current_section = None

        for paragraph in paragraphs:

            paragraph_number = (
                paragraph[
                    "paragraph_number"
                ]
            )

            if paragraph_number in heading_map:

                if current_section is not None:

                    sections.append(
                        current_section
                    )

                heading = heading_map[
                    paragraph_number
                ]

                current_section = {
                    "section_number": (
                        len(sections) + 1
                    ),
                    "heading": heading[
                        "text"
                    ],
                    "level": heading[
                        "level"
                    ],
                    "paragraphs": [],
                    "text": "",
                }

                continue

            if current_section is None:

                current_section = {
                    "section_number": 1,
                    "heading": "",
                    "level": 1,
                    "paragraphs": [],
                    "text": "",
                }

            current_section[
                "paragraphs"
            ].append(
                paragraph
            )

        if current_section is not None:

            sections.append(
                current_section
            )

        for section in sections:

            section_text = "\n\n".join(
                paragraph[
                    "text"
                ]
                for paragraph in section[
                    "paragraphs"
                ]
            )

            section[
                "text"
            ] = section_text

        return sections

    # =========================================================
    # METADATA
    # =========================================================

    @staticmethod
    def extract_metadata(
        path: Path,
        text: str,
        encoding: str,
        paragraphs: list[dict[str, Any]],
        headings: list[dict[str, Any]],
        sections: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Generate document metadata.
        """

        return {
            "document_id": (
                TextProcessor.generate_document_id(
                    path
                )
            ),
            "filename": path.name,
            "extension": path.suffix.lower(),
            "path": str(path),
            "encoding": encoding,
            "file_size_bytes": (
                path.stat().st_size
            ),
            "character_count": len(
                text
            ),
            "word_count": (
                TextProcessor.count_words(
                    text
                )
            ),
            "line_count": (
                len(
                    text.splitlines()
                )
                if text
                else 0
            ),
            "paragraph_count": len(
                paragraphs
            ),
            "heading_count": len(
                headings
            ),
            "section_count": len(
                sections
            ),
        }

    # =========================================================
    # QUALITY VALIDATION
    # =========================================================

    def validate_quality(
        self,
        raw_text: str,
        cleaned_text: str,
        paragraphs: list[dict[str, Any]],
        headings: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Check whether the extracted text is useful.
        """

        raw_length = len(
            raw_text
        )

        cleaned_length = len(
            cleaned_text
        )

        if not cleaned_text:

            status = "poor"

        elif cleaned_length < self.min_content_length():

            status = "limited"

        elif not paragraphs:

            status = "poor"

        else:

            status = "good"

        whitespace_count = sum(
            1
            for char in raw_text
            if char.isspace()
        )

        if raw_length:

            whitespace_ratio = round(
                whitespace_count
                / raw_length,
                3,
            )

        else:

            whitespace_ratio = 0.0

        return {
            "status": status,
            "raw_character_count": raw_length,
            "cleaned_character_count": (
                cleaned_length
            ),
            "paragraph_count": len(
                paragraphs
            ),
            "heading_count": len(
                headings
            ),
            "whitespace_ratio": (
                whitespace_ratio
            ),
            "content_removed_characters": max(
                0,
                raw_length
                - cleaned_length,
            ),
        }

    # =========================================================
    # RAG FORMAT
    # =========================================================

    @staticmethod
    def create_rag_format(
        metadata: dict[str, Any],
        paragraphs: list[dict[str, Any]],
        sections: list[dict[str, Any]],
        text: str,
    ) -> dict[str, Any]:
        """
        Create a consistent RAG-ready representation.

        Chunking and embeddings are deliberately handled
        later by the RAG subsystem.
        """

        document_id = metadata[
            "document_id"
        ]

        chunks = []

        # -----------------------------------------------------
        # Section-level content
        # -----------------------------------------------------

        for section in sections:

            section_text = section.get(
                "text",
                "",
            ).strip()

            if not section_text:
                continue

            chunks.append(
                {
                    "chunk_id": (
                        f"{document_id}-section-"
                        f"{section['section_number']}"
                    ),
                    "content": section_text,
                    "metadata": {
                        "document_id": document_id,
                        "source_type": "text",
                        "filename": metadata[
                            "filename"
                        ],
                        "section_number": (
                            section[
                                "section_number"
                            ]
                        ),
                        "section_heading": (
                            section[
                                "heading"
                            ]
                        ),
                        "heading_level": (
                            section[
                                "level"
                            ]
                        ),
                    },
                }
            )

        return {
            "document_id": document_id,
            "source_type": "text",
            "filename": metadata[
                "filename"
            ],
            "text": text,
            "paragraphs": paragraphs,
            "sections": sections,
            "chunks": chunks,
        }

    # =========================================================
    # STATISTICS
    # =========================================================

    @staticmethod
    def count_words(
        text: str,
    ) -> int:
        """
        Count words using a Unicode-friendly pattern.
        """

        if not text:
            return 0

        return len(
            re.findall(
                r"\b[\w'-]+\b",
                text,
                flags=re.UNICODE,
            )
        )

    @staticmethod
    def min_content_length() -> int:
        """
        Minimum useful cleaned content length.
        """

        return 20

    # =========================================================
    # DOCUMENT ID
    # =========================================================

    @staticmethod
    def generate_document_id(
        path: Path,
    ) -> str:
        """
        Generate a deterministic document ID based on
        the absolute path.
        """

        value = str(
            path
        ).encode(
            "utf-8"
        )

        return hashlib.sha256(
            value
        ).hexdigest()[:32]

    # =========================================================
    # SIMPLE TEXT EXTRACTION
    # =========================================================

    def extract_text(
        self,
        file_path: Union[str, Path],
    ) -> str:
        """
        Convenience method that returns only cleaned text.
        """

        result = self.process(
            file_path
        )

        if not result.get(
            "success",
            False,
        ):

            raise RuntimeError(
                result.get(
                    "error",
                    "Text processing failed.",
                )
            )

        return result[
            "text"
        ]

    # =========================================================
    # SIMPLE METADATA
    # =========================================================

    def get_metadata(
        self,
        file_path: Union[str, Path],
    ) -> dict[str, Any]:
        """
        Convenience method for metadata extraction.
        """

        result = self.process(
            file_path
        )

        if not result.get(
            "success",
            False,
        ):

            raise RuntimeError(
                result.get(
                    "error",
                    "Text processing failed.",
                )
            )

        return result[
            "document"
        ]

    # =========================================================
    # FAILURE RESPONSE
    # =========================================================

    @staticmethod
    def _failure(
        error: str,
    ) -> dict[str, Any]:
        """
        Standardized failure response.
        """

        return {
            "success": False,
            "error": error,
        }


# =============================================================
# DEFAULT INSTANCE
# =============================================================

text_processor = TextProcessor()

