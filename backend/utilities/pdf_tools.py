"""
StudyGemma - PDF Tools

General-purpose PDF utility layer.

Features:
- PDF validation
- PDF inspection
- Metadata extraction
- Page information
- PDF merging
- PDF splitting
- Page extraction
- Page-range parsing
- Encrypted PDF detection
- Safe output handling
- Output validation
- Structured result objects
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional

from pypdf import PdfReader, PdfWriter


# ======================================================================
# Exceptions
# ======================================================================


class PDFToolsError(Exception):
    """Base exception for PDF utility errors."""


class InvalidPDFError(PDFToolsError):
    """Raised when a PDF is invalid or corrupted."""


class EncryptedPDFError(PDFToolsError):
    """Raised when a PDF requires a password."""


class InvalidPageError(PDFToolsError):
    """Raised when a page number is invalid."""


class InvalidPageRangeError(PDFToolsError):
    """Raised when a page range is invalid."""


class PDFOperationError(PDFToolsError):
    """Raised when a PDF operation fails."""


class OutputFileError(PDFToolsError):
    """Raised when an output file cannot be created."""


# ======================================================================
# Result Objects
# ======================================================================


@dataclass
class PDFResult:
    """Result of a PDF operation."""

    success: bool
    output_path: Optional[str] = None
    input_files: List[str] = field(default_factory=list)
    page_count: int = 0
    output_size: int = 0
    operation: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert result to dictionary."""

        return {
            "success": self.success,
            "output_path": self.output_path,
            "input_files": list(self.input_files),
            "page_count": self.page_count,
            "output_size": self.output_size,
            "operation": self.operation,
            "error": self.error,
        }


@dataclass
class PDFInfo:
    """Information about a PDF."""

    path: str
    filename: str
    file_size: int
    page_count: int
    pdf_version: Optional[str]
    encrypted: bool
    metadata: dict

    def to_dict(self) -> dict:
        """Convert PDF information to dictionary."""

        return {
            "path": self.path,
            "filename": self.filename,
            "file_size": self.file_size,
            "page_count": self.page_count,
            "pdf_version": self.pdf_version,
            "encrypted": self.encrypted,
            "metadata": dict(self.metadata),
        }


@dataclass
class PDFPageInfo:
    """Information about one PDF page."""

    page_number: int
    width: float
    height: float
    rotation: int

    def to_dict(self) -> dict:
        """Convert page information to dictionary."""

        return {
            "page_number": self.page_number,
            "width": self.width,
            "height": self.height,
            "rotation": self.rotation,
        }


# ======================================================================
# PDF Tools
# ======================================================================


class PDFTools:
    """
    General-purpose PDF utility service.

    Page numbers exposed by this class are 1-based.

    Example:
        PDF page 1 -> page_number=1
        PDF page 10 -> page_number=10
    """

    # ==================================================================
    # Validation
    # ==================================================================

    @staticmethod
    def _validate_file(path: Path) -> None:
        """Validate that a PDF file exists and is readable."""

        if not path.exists():
            raise InvalidPDFError(
                f"PDF does not exist: {path}"
            )

        if not path.is_file():
            raise InvalidPDFError(
                f"PDF path is not a file: {path}"
            )

        if path.suffix.lower() != ".pdf":
            raise InvalidPDFError(
                f"File is not a PDF: {path.name}"
            )

        try:
            file_size = path.stat().st_size
        except OSError as exc:
            raise InvalidPDFError(
                f"Unable to read PDF information: {path.name}"
            ) from exc

        if file_size == 0:
            raise InvalidPDFError(
                f"PDF is empty: {path.name}"
            )

        try:
            with path.open("rb") as file:
                header = file.read(5)

        except (OSError, PermissionError) as exc:
            raise InvalidPDFError(
                f"PDF is not readable: {path.name}"
            ) from exc

        if header != b"%PDF-":
            raise InvalidPDFError(
                f"File does not contain a valid PDF header: "
                f"{path.name}"
            )

    @classmethod
    def _open_reader(
        cls,
        pdf_path: str | Path,
    ) -> PdfReader:
        """Open and validate a PDF."""

        if pdf_path is None:
            raise InvalidPDFError(
                "PDF path cannot be empty."
            )

        try:
            path = Path(pdf_path)
        except (TypeError, ValueError) as exc:
            raise InvalidPDFError(
                f"Invalid PDF path: {exc}"
            ) from exc

        cls._validate_file(path)

        try:
            reader = PdfReader(str(path))
        except Exception as exc:
            raise InvalidPDFError(
                f"Unable to open PDF '{path.name}': {exc}"
            ) from exc

        if reader.is_encrypted:
            raise EncryptedPDFError(
                f"PDF '{path.name}' is encrypted and "
                "requires a password."
            )

        try:
            len(reader.pages)
        except Exception as exc:
            raise InvalidPDFError(
                f"PDF pages cannot be read: {exc}"
            ) from exc

        return reader

    @staticmethod
    def _validate_overwrite(overwrite: bool) -> None:
        """Validate overwrite parameter."""

        if not isinstance(overwrite, bool):
            raise OutputFileError(
                "overwrite must be a boolean."
            )

    def validate_pdf(
        self,
        pdf_path: str | Path,
    ) -> bool:
        """
        Validate a PDF.

        Returns:
            True if valid.

        Raises:
            PDFToolsError if invalid.
        """

        self._open_reader(pdf_path)
        return True

    # ==================================================================
    # Inspection
    # ==================================================================

    def get_pdf_info(
        self,
        pdf_path: str | Path,
    ) -> PDFInfo:
        """Return complete PDF information."""

        reader = self._open_reader(pdf_path)

        try:
            path = Path(pdf_path)
        except (TypeError, ValueError) as exc:
            raise InvalidPDFError(
                f"Invalid PDF path: {exc}"
            ) from exc

        metadata = self._extract_metadata(reader)
        pdf_version = self._get_pdf_version(path)

        try:
            file_size = path.stat().st_size
        except OSError as exc:
            raise InvalidPDFError(
                f"Unable to read PDF information: {path.name}"
            ) from exc

        return PDFInfo(
            path=str(path),
            filename=path.name,
            file_size=file_size,
            page_count=len(reader.pages),
            pdf_version=pdf_version,
            encrypted=bool(reader.is_encrypted),
            metadata=metadata,
        )

    def get_metadata(
        self,
        pdf_path: str | Path,
    ) -> dict:
        """Extract PDF metadata."""

        reader = self._open_reader(pdf_path)
        return self._extract_metadata(reader)

    @staticmethod
    def _extract_metadata(
        reader: PdfReader,
    ) -> dict:
        """Extract useful metadata fields."""

        metadata = reader.metadata

        if metadata is None:
            return {
                "title": None,
                "author": None,
                "subject": None,
                "creator": None,
                "producer": None,
                "creation_date": None,
                "modification_date": None,
            }

        return {
            "title": metadata.get("/Title"),
            "author": metadata.get("/Author"),
            "subject": metadata.get("/Subject"),
            "creator": metadata.get("/Creator"),
            "producer": metadata.get("/Producer"),
            "creation_date": metadata.get("/CreationDate"),
            "modification_date": metadata.get("/ModDate"),
        }

    @staticmethod
    def _get_pdf_version(
        path: Path,
    ) -> Optional[str]:
        """Read PDF version from the file header."""

        try:
            with path.open("rb") as file:
                header = file.read(16)

            if header.startswith(b"%PDF-"):
                version = header[5:8].decode(
                    "ascii",
                    errors="ignore",
                )
                return version

        except (OSError, UnicodeDecodeError):
            pass

        return None

    # ==================================================================
    # Page Information
    # ==================================================================

    def get_page_count(
        self,
        pdf_path: str | Path,
    ) -> int:
        """Return the number of pages."""

        reader = self._open_reader(pdf_path)
        return len(reader.pages)

    def get_page_info(
        self,
        pdf_path: str | Path,
        page_number: int | None = None,
    ) -> List[PDFPageInfo] | PDFPageInfo:
        """
        Return page information.

        If page_number is provided, returns information for that page.
        Otherwise returns information for every page.
        """

        reader = self._open_reader(pdf_path)

        if page_number is not None:
            self._validate_page_number(
                page_number,
                len(reader.pages),
            )

            return self._build_page_info(
                reader.pages[page_number - 1],
                page_number,
            )

        result: List[PDFPageInfo] = []

        for index, page in enumerate(
            reader.pages,
            start=1,
        ):
            result.append(
                self._build_page_info(
                    page,
                    index,
                )
            )

        return result

    @staticmethod
    def _build_page_info(
        page,
        page_number: int,
    ) -> PDFPageInfo:
        """Build page information."""

        try:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)

        except Exception as exc:
            raise InvalidPDFError(
                f"Unable to read dimensions for page "
                f"{page_number}: {exc}"
            ) from exc

        rotation = page.get("/Rotate", 0)

        try:
            rotation = int(rotation or 0)
        except (TypeError, ValueError):
            rotation = 0

        rotation %= 360

        return PDFPageInfo(
            page_number=page_number,
            width=width,
            height=height,
            rotation=rotation,
        )

    # ==================================================================
    # Merge
    # ==================================================================

    def merge_pdfs(
        self,
        input_files: Iterable[str | Path],
        output_path: str | Path | None = None,
        overwrite: bool = False,
    ) -> PDFResult:
        """
        Merge multiple PDFs.

        Input order is preserved.
        """

        self._validate_overwrite(overwrite)

        files = self._normalize_pdf_files(input_files)

        if len(files) < 2:
            raise PDFOperationError(
                "At least two PDFs are required for merging."
            )

        readers = []
        output: Optional[Path] = None

        try:
            for path in files:
                readers.append(
                    self._open_reader(path)
                )

            output = self._prepare_output_path(
                input_files=files,
                output_path=output_path,
                default_name="merged.pdf",
                overwrite=overwrite,
            )

            self._ensure_output_is_not_input(
                output,
                files,
            )

            writer = PdfWriter()
            total_pages = 0

            for reader in readers:
                for page in reader.pages:
                    writer.add_page(page)
                    total_pages += 1

            self._write_pdf(
                writer,
                output,
            )

            self._validate_output(
                output,
                expected_pages=total_pages,
            )

            return PDFResult(
                success=True,
                output_path=str(output),
                input_files=[
                    str(path)
                    for path in files
                ],
                page_count=total_pages,
                output_size=output.stat().st_size,
                operation="merge",
            )

        except PDFToolsError:
            if output is not None:
                self._cleanup_output(output)
            raise

        except Exception as exc:
            if output is not None:
                self._cleanup_output(output)

            raise PDFOperationError(
                f"Failed to merge PDFs: {exc}"
            ) from exc

    # ==================================================================
    # Split
    # ==================================================================

    def split_pdf(
        self,
        pdf_path: str | Path,
        output_directory: str | Path | None = None,
        overwrite: bool = False,
    ) -> List[PDFResult]:
        """
        Split every page of a PDF into a separate PDF.
        """

        self._validate_overwrite(overwrite)

        source = self._normalize_single_pdf_path(pdf_path)
        reader = self._open_reader(source)

        if output_directory is None:
            output_dir = (
                source.parent
                / f"{source.stem}_pages"
            )
        else:
            try:
                output_dir = Path(output_directory)
            except (TypeError, ValueError) as exc:
                raise OutputFileError(
                    f"Invalid output directory: {exc}"
                ) from exc

        try:
            output_dir.mkdir(
                parents=True,
                exist_ok=True,
            )
        except OSError as exc:
            raise OutputFileError(
                f"Unable to create output directory: "
                f"{output_dir}"
            ) from exc

        results: List[PDFResult] = []

        for index, page in enumerate(
            reader.pages,
            start=1,
        ):
            output = (
                output_dir
                / f"{source.stem}_page_{index}.pdf"
            )

            if output.exists() and not overwrite:
                output = self._find_available_path(output)

            self._ensure_output_is_not_input(
                output,
                [source],
            )

            writer = PdfWriter()
            writer.add_page(page)

            try:
                self._write_pdf(
                    writer,
                    output,
                )

                self._validate_output(
                    output,
                    expected_pages=1,
                )

                results.append(
                    PDFResult(
                        success=True,
                        output_path=str(output),
                        input_files=[str(source)],
                        page_count=1,
                        output_size=output.stat().st_size,
                        operation="split",
                    )
                )

            except PDFToolsError:
                self._cleanup_output(output)
                raise

            except Exception as exc:
                self._cleanup_output(output)

                raise PDFOperationError(
                    f"Failed to split page {index}: {exc}"
                ) from exc

        return results

    # ==================================================================
    # Extract Pages
    # ==================================================================

    def extract_pages(
        self,
        pdf_path: str | Path,
        pages: str | Iterable[int],
        output_path: str | Path | None = None,
        overwrite: bool = False,
    ) -> PDFResult:
        """
        Extract selected pages from a PDF.

        Examples:
            pages="1-5"
            pages="1,3,7"
            pages="1-3,7,10-12"
            pages=[1, 3, 7]
        """

        self._validate_overwrite(overwrite)

        source = self._normalize_single_pdf_path(pdf_path)
        reader = self._open_reader(source)

        total_pages = len(reader.pages)

        page_numbers = self.parse_page_ranges(
            pages,
            total_pages,
        )

        if not page_numbers:
            raise InvalidPageRangeError(
                "No pages were selected."
            )

        output = self._prepare_output_path(
            input_files=[source],
            output_path=output_path,
            default_name=f"{source.stem}_extracted.pdf",
            overwrite=overwrite,
        )

        self._ensure_output_is_not_input(
            output,
            [source],
        )

        writer = PdfWriter()

        for page_number in page_numbers:
            writer.add_page(
                reader.pages[page_number - 1]
            )

        try:
            self._write_pdf(
                writer,
                output,
            )

            self._validate_output(
                output,
                expected_pages=len(page_numbers),
            )

        except PDFToolsError:
            self._cleanup_output(output)
            raise

        except Exception as exc:
            self._cleanup_output(output)

            raise PDFOperationError(
                f"Failed to extract pages: {exc}"
            ) from exc

        return PDFResult(
            success=True,
            output_path=str(output),
            input_files=[str(source)],
            page_count=len(page_numbers),
            output_size=output.stat().st_size,
            operation="extract",
        )

    # ==================================================================
    # Page Range Parsing
    # ==================================================================

    @classmethod
    def parse_page_ranges(
        cls,
        pages: str | Iterable[int],
        total_pages: int,
    ) -> List[int]:
        """
        Parse page selections.

        Supported:
            "1"
            "1,3,5"
            "1-5"
            "1-3,7,10-12"
            [1, 3, 5]
        """

        if (
            not isinstance(total_pages, int)
            or isinstance(total_pages, bool)
        ):
            raise InvalidPageRangeError(
                "total_pages must be an integer."
            )

        if total_pages <= 0:
            raise InvalidPageRangeError(
                "PDF contains no pages."
            )

        if pages is None:
            raise InvalidPageRangeError(
                "pages cannot be empty."
            )

        if isinstance(pages, str):
            value = pages.strip()

            if not value:
                raise InvalidPageRangeError(
                    "Page range cannot be empty."
                )

            tokens = [
                token.strip()
                for token in value.split(",")
                if token.strip()
            ]

        else:
            try:
                tokens = list(pages)
            except TypeError as exc:
                raise InvalidPageRangeError(
                    "pages must be a string or iterable "
                    "of page numbers."
                ) from exc

        if not tokens:
            raise InvalidPageRangeError(
                "No pages were specified."
            )

        selected = set()

        for token in tokens:

            if isinstance(token, bool):
                raise InvalidPageError(
                    "Page number must be an integer."
                )

            if isinstance(token, int):
                cls._validate_page_number(
                    token,
                    total_pages,
                )

                selected.add(token)
                continue

            token = str(token).strip()

            if not token:
                raise InvalidPageRangeError(
                    "Empty page selection is not valid."
                )

            if "-" in token:
                parts = token.split("-")

                if len(parts) != 2:
                    raise InvalidPageRangeError(
                        f"Invalid page range: {token}"
                    )

                start_text, end_text = parts

                if (
                    not start_text.strip()
                    or not end_text.strip()
                ):
                    raise InvalidPageRangeError(
                        f"Invalid page range: {token}"
                    )

                try:
                    start = int(start_text.strip())
                    end = int(end_text.strip())

                except ValueError as exc:
                    raise InvalidPageRangeError(
                        f"Invalid page range: {token}"
                    ) from exc

                if start > end:
                    raise InvalidPageRangeError(
                        f"Invalid range '{token}': "
                        "start is greater than end."
                    )

                cls._validate_page_number(
                    start,
                    total_pages,
                )

                cls._validate_page_number(
                    end,
                    total_pages,
                )

                selected.update(
                    range(start, end + 1)
                )

            else:
                try:
                    page_number = int(token)

                except ValueError as exc:
                    raise InvalidPageRangeError(
                        f"Invalid page number: {token}"
                    ) from exc

                cls._validate_page_number(
                    page_number,
                    total_pages,
                )

                selected.add(page_number)

        return sorted(selected)

    @staticmethod
    def _validate_page_number(
        page_number: int,
        total_pages: int,
    ) -> None:
        """Validate a 1-based page number."""

        if (
            isinstance(page_number, bool)
            or not isinstance(page_number, int)
        ):
            raise InvalidPageError(
                "Page number must be an integer."
            )

        if page_number < 1:
            raise InvalidPageError(
                f"Invalid page number: {page_number}. "
                "Pages start at 1."
            )

        if page_number > total_pages:
            raise InvalidPageError(
                f"Page {page_number} does not exist. "
                f"PDF contains {total_pages} pages."
            )

    # ==================================================================
    # Output Handling
    # ==================================================================

    @staticmethod
    def _prepare_output_path(
        input_files: List[Path],
        output_path: str | Path | None,
        default_name: str,
        overwrite: bool,
    ) -> Path:
        """Prepare a safe PDF output path."""

        if not isinstance(overwrite, bool):
            raise OutputFileError(
                "overwrite must be a boolean."
            )

        if output_path is not None:
            try:
                output = Path(output_path)
            except (TypeError, ValueError) as exc:
                raise OutputFileError(
                    f"Invalid output path: {exc}"
                ) from exc

            if not output.name:
                raise OutputFileError(
                    "Output path must include a filename."
                )

            if output.suffix.lower() != ".pdf":
                output = output.with_suffix(".pdf")

        else:
            if not input_files:
                raise OutputFileError(
                    "At least one input file is required."
                )

            output = (
                input_files[0].parent
                / default_name
            )

        try:
            output.parent.mkdir(
                parents=True,
                exist_ok=True,
            )
        except OSError as exc:
            raise OutputFileError(
                f"Unable to create output directory: "
                f"{output.parent}"
            ) from exc

        if output.exists() and not overwrite:
            output = PDFTools._find_available_path(
                output
            )

        return output

    @staticmethod
    def _ensure_output_is_not_input(
        output_path: Path,
        input_files: List[Path],
    ) -> None:
        """Prevent output from replacing an input PDF."""

        try:
            output_resolved = output_path.resolve()

            for input_file in input_files:
                if output_resolved == input_file.resolve():
                    raise OutputFileError(
                        "Output PDF cannot be the same as "
                        "an input PDF."
                    )

        except OutputFileError:
            raise

        except OSError as exc:
            raise OutputFileError(
                f"Unable to validate output path: {exc}"
            ) from exc

    @staticmethod
    def _find_available_path(
        path: Path,
    ) -> Path:
        """Generate a unique path."""

        counter = 1

        while True:
            candidate = (
                path.parent
                / f"{path.stem}_{counter}{path.suffix}"
            )

            if not candidate.exists():
                return candidate

            counter += 1

    @staticmethod
    def _normalize_single_pdf_path(
        pdf_path: str | Path,
    ) -> Path:
        """Normalize one PDF path safely."""

        if pdf_path is None:
            raise InvalidPDFError(
                "PDF path cannot be empty."
            )

        try:
            path = Path(pdf_path)
        except (TypeError, ValueError) as exc:
            raise InvalidPDFError(
                f"Invalid PDF path: {exc}"
            ) from exc

        PDFTools._validate_file(path)

        return path

    # ==================================================================
    # Writing
    # ==================================================================

    @staticmethod
    def _write_pdf(
        writer: PdfWriter,
        output_path: Path,
    ) -> None:
        """Write a PdfWriter to disk."""

        try:
            output_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            with output_path.open("wb") as file:
                writer.write(file)

        except Exception as exc:
            raise OutputFileError(
                f"Unable to write PDF "
                f"'{output_path}': {exc}"
            ) from exc

    # ==================================================================
    # Output Validation
    # ==================================================================

    @classmethod
    def _validate_output(
        cls,
        output_path: Path,
        expected_pages: int | None = None,
    ) -> None:
        """Validate generated PDF."""

        if not output_path.exists():
            raise OutputFileError(
                "Output PDF was not created."
            )

        if not output_path.is_file():
            raise OutputFileError(
                "Output path is not a file."
            )

        try:
            file_size = output_path.stat().st_size
        except OSError as exc:
            raise OutputFileError(
                "Unable to read output PDF information."
            ) from exc

        if file_size == 0:
            raise OutputFileError(
                "Output PDF is empty."
            )

        if output_path.suffix.lower() != ".pdf":
            raise OutputFileError(
                "Output file does not have a .pdf extension."
            )

        try:
            with output_path.open("rb") as file:
                header = file.read(5)

        except OSError as exc:
            raise OutputFileError(
                f"Unable to inspect generated PDF: {exc}"
            ) from exc

        if header != b"%PDF-":
            raise OutputFileError(
                "Generated file does not contain "
                "a valid PDF header."
            )

        try:
            reader = PdfReader(str(output_path))

            if reader.is_encrypted:
                raise OutputFileError(
                    "Generated PDF is encrypted unexpectedly."
                )

            actual_pages = len(reader.pages)

            if (
                expected_pages is not None
                and actual_pages != expected_pages
            ):
                raise OutputFileError(
                    f"Output page count mismatch. "
                    f"Expected {expected_pages}, "
                    f"got {actual_pages}."
                )

        except OutputFileError:
            raise

        except Exception as exc:
            raise OutputFileError(
                f"Generated PDF failed validation: {exc}"
            ) from exc

    @staticmethod
    def _cleanup_output(
        output_path: Path,
    ) -> None:
        """Remove a partially generated output file."""

        try:
            if output_path.exists():
                output_path.unlink()

        except OSError:
            # Cleanup failure must not hide the original exception.
            pass

    # ==================================================================
    # Helpers
    # ==================================================================

    @staticmethod
    def _normalize_pdf_files(
        input_files: Iterable[str | Path],
    ) -> List[Path]:
        """Normalize and validate a list of PDFs."""

        if input_files is None:
            raise InvalidPDFError(
                "input_files cannot be empty."
            )

        if isinstance(
            input_files,
            (str, Path),
        ):
            files = [Path(input_files)]

        else:
            try:
                files = [
                    Path(file_path)
                    for file_path in input_files
                ]

            except (TypeError, ValueError) as exc:
                raise InvalidPDFError(
                    "input_files must be an iterable "
                    "of PDF paths."
                ) from exc

        if not files:
            raise InvalidPDFError(
                "At least one PDF is required."
            )

        normalized: List[Path] = []

        for path in files:
            PDFTools._validate_file(path)
            normalized.append(path)

        return normalized


# ======================================================================
# Convenience API
# ======================================================================


_default_pdf_tools = PDFTools()


def validate_pdf(
    pdf_path: str | Path,
) -> bool:
    """Validate a PDF."""

    return _default_pdf_tools.validate_pdf(
        pdf_path
    )


def get_pdf_info(
    pdf_path: str | Path,
) -> PDFInfo:
    """Get PDF information."""

    return _default_pdf_tools.get_pdf_info(
        pdf_path
    )


def merge_pdfs(
    input_files: Iterable[str | Path],
    output_path: str | Path | None = None,
    overwrite: bool = False,
) -> PDFResult:
    """Merge PDFs."""

    return _default_pdf_tools.merge_pdfs(
        input_files=input_files,
        output_path=output_path,
        overwrite=overwrite,
    )


def split_pdf(
    pdf_path: str | Path,
    output_directory: str | Path | None = None,
    overwrite: bool = False,
) -> List[PDFResult]:
    """Split PDF into individual pages."""

    return _default_pdf_tools.split_pdf(
        pdf_path=pdf_path,
        output_directory=output_directory,
        overwrite=overwrite,
    )


def extract_pages(
    pdf_path: str | Path,
    pages: str | Iterable[int],
    output_path: str | Path | None = None,
    overwrite: bool = False,
) -> PDFResult:
    """Extract selected pages."""

    return _default_pdf_tools.extract_pages(
        pdf_path=pdf_path,
        pages=pages,
        output_path=output_path,
        overwrite=overwrite,
    )