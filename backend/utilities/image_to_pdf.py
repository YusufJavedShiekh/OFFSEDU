"""
StudyGemma - Image to PDF Utility

Features:

- Single image -> PDF
- Multiple images -> multi-page PDF
- JPEG, PNG, WEBP, BMP and TIFF support
- EXIF orientation correction
- Transparency handling
- A4, Letter and Original page sizes
- FIT, FILL and ORIGINAL layout modes
- Configurable margins
- Aspect-ratio preservation
- Safe output naming
- Overwrite protection
- PDF validation
- Structured conversion results
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, List, Optional

from PIL import Image, ImageOps
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


# ======================================================================
# Exceptions
# ======================================================================


class ImageToPDFError(Exception):
    """Base exception for image-to-PDF errors."""


class InvalidImageError(ImageToPDFError):
    """Raised when an image is missing, invalid, or corrupted."""


class UnsupportedImageFormatError(ImageToPDFError):
    """Raised when an image format is unsupported."""


class InvalidPDFParameterError(ImageToPDFError):
    """Raised when PDF parameters are invalid."""


class PDFGenerationError(ImageToPDFError):
    """Raised when PDF generation fails."""


# ======================================================================
# Result
# ======================================================================


@dataclass
class ImagePDFResult:
    """Result returned after image-to-PDF conversion."""

    success: bool
    output_path: Optional[str] = None
    input_files: List[str] = field(default_factory=list)
    page_count: int = 0
    output_size: int = 0
    page_size: Optional[str] = None
    layout: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert result to dictionary."""

        return {
            "success": self.success,
            "output_path": self.output_path,
            "input_files": list(self.input_files),
            "page_count": self.page_count,
            "output_size": self.output_size,
            "page_size": self.page_size,
            "layout": self.layout,
            "error": self.error,
        }


# ======================================================================
# Image to PDF
# ======================================================================


class ImageToPDF:
    """
    Convert one or more images into a PDF document.

    Supported image formats:
        JPEG / JPG
        PNG
        WEBP
        BMP
        TIFF / TIF

    Page sizes:
        A4
        LETTER
        ORIGINAL

    Layout modes:
        FIT
        FILL
        ORIGINAL
    """

    SUPPORTED_FORMATS = {
        "JPEG",
        "PNG",
        "WEBP",
        "BMP",
        "TIFF",
    }

    FORMAT_ALIASES = {
        "JPG": "JPEG",
        "JPEG": "JPEG",
        "PNG": "PNG",
        "WEBP": "WEBP",
        "BMP": "BMP",
        "TIF": "TIFF",
        "TIFF": "TIFF",
    }

    PAGE_SIZES = {
        "A4": A4,
        "LETTER": LETTER,
    }

    LAYOUTS = {
        "FIT",
        "FILL",
        "ORIGINAL",
    }

    DEFAULT_MARGIN = 24.0

    # ==================================================================
    # Public API
    # ==================================================================

    def convert(
        self,
        input_files: str | Path | Iterable[str | Path],
        output_path: str | Path | None = None,
        page_size: str = "A4",
        layout: str = "FIT",
        margin: float = DEFAULT_MARGIN,
        overwrite: bool = False,
        background: str = "white",
    ) -> ImagePDFResult:
        """
        Convert one or more images into a PDF.

        Args:
            input_files:
                One image path or an iterable of image paths.

            output_path:
                Destination PDF path.

            page_size:
                A4, LETTER or ORIGINAL.

            layout:
                FIT, FILL or ORIGINAL.

            margin:
                Page margin in PDF points.

            overwrite:
                Whether an existing PDF may be replaced.

            background:
                Background color used for transparent images.

        Returns:
            ImagePDFResult
        """

        files = self._normalize_input_files(input_files)

        normalized_page_size = self._normalize_page_size(
            page_size
        )

        normalized_layout = self._normalize_layout(
            layout
        )

        self._validate_parameters(
            page_size=normalized_page_size,
            layout=normalized_layout,
            margin=margin,
            overwrite=overwrite,
            background=background,
        )

        validated_files: List[Path] = []
        final_output: Optional[Path] = None

        try:
            for file_path in files:
                self._validate_image(file_path)
                self._verify_image(file_path)
                validated_files.append(file_path)

            final_output = self._prepare_output_path(
                input_files=validated_files,
                output_path=output_path,
                overwrite=overwrite,
            )

            self._ensure_output_not_input(
                final_output,
                validated_files,
            )

            self._create_pdf(
                input_files=validated_files,
                output_path=final_output,
                page_size=normalized_page_size,
                layout=normalized_layout,
                margin=float(margin),
                background=background,
            )

            page_count = len(validated_files)

            self._validate_pdf(
                final_output,
                expected_pages=page_count,
            )

            try:
                output_size = final_output.stat().st_size
            except OSError as exc:
                self._cleanup_output(final_output)
                raise PDFGenerationError(
                    "Unable to read generated PDF."
                ) from exc

            return ImagePDFResult(
                success=True,
                output_path=str(final_output),
                input_files=[
                    str(path)
                    for path in validated_files
                ],
                page_count=page_count,
                output_size=output_size,
                page_size=normalized_page_size,
                layout=normalized_layout,
            )

        except ImageToPDFError:
            if final_output is not None:
                self._cleanup_output(final_output)
            raise

        except Exception as exc:
            if final_output is not None:
                self._cleanup_output(final_output)

            raise PDFGenerationError(
                f"Failed to create PDF: {exc}"
            ) from exc

    def convert_single(
        self,
        input_file: str | Path,
        output_path: str | Path | None = None,
        page_size: str = "A4",
        layout: str = "FIT",
        margin: float = DEFAULT_MARGIN,
        overwrite: bool = False,
        background: str = "white",
    ) -> ImagePDFResult:
        """Convert one image into a PDF."""

        return self.convert(
            input_files=input_file,
            output_path=output_path,
            page_size=page_size,
            layout=layout,
            margin=margin,
            overwrite=overwrite,
            background=background,
        )

    def convert_multiple(
        self,
        input_files: Iterable[str | Path],
        output_path: str | Path | None = None,
        page_size: str = "A4",
        layout: str = "FIT",
        margin: float = DEFAULT_MARGIN,
        overwrite: bool = False,
        background: str = "white",
    ) -> ImagePDFResult:
        """Convert multiple images into one PDF."""

        return self.convert(
            input_files=input_files,
            output_path=output_path,
            page_size=page_size,
            layout=layout,
            margin=margin,
            overwrite=overwrite,
            background=background,
        )

    def get_image_info(
        self,
        input_file: str | Path,
    ) -> dict:
        """Return image information without modifying the image."""

        path = Path(input_file)

        self._validate_image(path)

        try:
            with Image.open(path) as image:
                if not image.format:
                    raise InvalidImageError(
                        f"Unable to determine image format: "
                        f"{path.name}"
                    )

                actual_format = self._normalize_format(
                    image.format
                )

                try:
                    file_size = path.stat().st_size
                except OSError as exc:
                    raise InvalidImageError(
                        f"Unable to read image size: {path.name}"
                    ) from exc

                return {
                    "path": str(path),
                    "filename": path.name,
                    "format": actual_format,
                    "width": image.width,
                    "height": image.height,
                    "dimensions": image.size,
                    "mode": image.mode,
                    "file_size": file_size,
                    "has_transparency": self._has_transparency(
                        image
                    ),
                }

        except ImageToPDFError:
            raise

        except Exception as exc:
            raise InvalidImageError(
                f"Unable to read image: {exc}"
            ) from exc

    # ==================================================================
    # Input Handling
    # ==================================================================

    @staticmethod
    def _normalize_input_files(
        input_files: str | Path | Iterable[str | Path],
    ) -> List[Path]:
        """Normalize one or many input paths into a list."""

        if isinstance(input_files, (str, Path)):
            files = [Path(input_files)]

        else:
            try:
                files = [
                    Path(file_path)
                    for file_path in input_files
                ]
            except TypeError as exc:
                raise InvalidImageError(
                    "input_files must be a file path or "
                    "an iterable of file paths."
                ) from exc

        if not files:
            raise InvalidImageError(
                "At least one image is required."
            )

        return files

    @classmethod
    def _validate_image(
        cls,
        path: Path,
    ) -> None:
        """Validate basic image file requirements."""

        if not path.exists():
            raise InvalidImageError(
                f"Image does not exist: {path}"
            )

        if not path.is_file():
            raise InvalidImageError(
                f"Input path is not a file: {path}"
            )

        try:
            file_size = path.stat().st_size
        except OSError as exc:
            raise InvalidImageError(
                f"Unable to access image: {path}"
            ) from exc

        if file_size == 0:
            raise InvalidImageError(
                f"Image is empty: {path.name}"
            )

        extension = path.suffix.lower().lstrip(".")

        if extension not in {
            "jpg",
            "jpeg",
            "png",
            "webp",
            "bmp",
            "tif",
            "tiff",
        }:
            raise UnsupportedImageFormatError(
                f"Unsupported image format: {path.suffix}"
            )

    @classmethod
    def _verify_image(
        cls,
        path: Path,
    ) -> None:
        """Verify that Pillow can read the image."""

        try:
            with Image.open(path) as image:
                detected_format = image.format

                if not detected_format:
                    raise InvalidImageError(
                        f"Unable to determine image format: "
                        f"{path.name}"
                    )

                normalized_format = cls._normalize_format(
                    detected_format
                )

                if normalized_format not in cls.SUPPORTED_FORMATS:
                    raise UnsupportedImageFormatError(
                        f"Unsupported image format: "
                        f"{detected_format}"
                    )

                image.verify()

        except ImageToPDFError:
            raise

        except Exception as exc:
            raise InvalidImageError(
                f"Corrupted or unreadable image "
                f"'{path.name}': {exc}"
            ) from exc

    # ==================================================================
    # Parameter Validation
    # ==================================================================

    @staticmethod
    def _normalize_page_size(
        page_size: str,
    ) -> str:
        """Normalize page size."""

        if not isinstance(page_size, str):
            raise InvalidPDFParameterError(
                "page_size must be a string."
            )

        value = page_size.strip().upper()

        if value not in {
            "A4",
            "LETTER",
            "ORIGINAL",
        }:
            raise InvalidPDFParameterError(
                f"Unsupported page size: {page_size}. "
                "Use A4, LETTER or ORIGINAL."
            )

        return value

    @staticmethod
    def _normalize_layout(
        layout: str,
    ) -> str:
        """Normalize layout mode."""

        if not isinstance(layout, str):
            raise InvalidPDFParameterError(
                "layout must be a string."
            )

        value = layout.strip().upper()

        if value not in {
            "FIT",
            "FILL",
            "ORIGINAL",
        }:
            raise InvalidPDFParameterError(
                f"Unsupported layout: {layout}. "
                "Use FIT, FILL or ORIGINAL."
            )

        return value

    def _validate_parameters(
        self,
        page_size: str,
        layout: str,
        margin: float,
        overwrite: bool,
        background: str,
    ) -> None:
        """Validate PDF configuration."""

        if page_size not in (
            set(self.PAGE_SIZES.keys())
            | {"ORIGINAL"}
        ):
            raise InvalidPDFParameterError(
                f"Unsupported page size: {page_size}."
            )

        if layout not in self.LAYOUTS:
            raise InvalidPDFParameterError(
                f"Unsupported layout: {layout}."
            )

        if isinstance(margin, bool) or not isinstance(
            margin,
            (int, float),
        ):
            raise InvalidPDFParameterError(
                "margin must be a number."
            )

        if not math.isfinite(float(margin)):
            raise InvalidPDFParameterError(
                "margin must be a finite number."
            )

        if margin < 0:
            raise InvalidPDFParameterError(
                "margin cannot be negative."
            )

        if not isinstance(overwrite, bool):
            raise InvalidPDFParameterError(
                "overwrite must be a boolean."
            )

        if not isinstance(background, str):
            raise InvalidPDFParameterError(
                "background must be a color string."
            )

        background = background.strip()

        if not background:
            raise InvalidPDFParameterError(
                "background cannot be empty."
            )

        try:
            Image.new(
                "RGB",
                (1, 1),
                background,
            )
        except Exception as exc:
            raise InvalidPDFParameterError(
                f"Invalid background color: {background}"
            ) from exc

    # ==================================================================
    # Format Handling
    # ==================================================================

    @classmethod
    def _normalize_format(
        cls,
        image_format: str,
    ) -> str:
        """Normalize an image format name."""

        if image_format is None:
            raise UnsupportedImageFormatError(
                "Image format cannot be empty."
            )

        value = str(image_format).strip().upper()

        if value.startswith("."):
            value = value[1:]

        normalized = cls.FORMAT_ALIASES.get(value)

        if normalized is None:
            raise UnsupportedImageFormatError(
                f"Unsupported image format: {image_format}"
            )

        return normalized

    # ==================================================================
    # PDF Creation
    # ==================================================================

    def _create_pdf(
        self,
        input_files: List[Path],
        output_path: Path,
        page_size: str,
        layout: str,
        margin: float,
        background: str,
    ) -> None:
        """Create the PDF document."""

        pdf = None

        try:
            if page_size == "ORIGINAL":
                first_width, first_height = (
                    self._get_original_page_size(
                        input_files[0]
                    )
                )

                pdf = canvas.Canvas(
                    str(output_path),
                    pagesize=(
                        first_width,
                        first_height,
                    ),
                )

            else:
                width, height = self.PAGE_SIZES[page_size]

                pdf = canvas.Canvas(
                    str(output_path),
                    pagesize=(
                        width,
                        height,
                    ),
                )

            for image_path in input_files:

                if page_size == "ORIGINAL":
                    page_width, page_height = (
                        self._get_original_page_size(
                            image_path
                        )
                    )

                    pdf.setPageSize(
                        (
                            page_width,
                            page_height,
                        )
                    )

                else:
                    page_width, page_height = (
                        self.PAGE_SIZES[page_size]
                    )

                with Image.open(image_path) as source:
                    image = ImageOps.exif_transpose(
                        source
                    )

                    image = self._prepare_image(
                        image,
                        background=background,
                    )

                    image_width, image_height = image.size

                    (
                        draw_x,
                        draw_y,
                        draw_width,
                        draw_height,
                    ) = self._calculate_image_position(
                        image_width=image_width,
                        image_height=image_height,
                        page_width=page_width,
                        page_height=page_height,
                        margin=margin,
                        layout=layout,
                    )

                    pdf.drawImage(
                        ImageReader(image),
                        draw_x,
                        draw_y,
                        width=draw_width,
                        height=draw_height,
                        preserveAspectRatio=True,
                        mask="auto",
                    )

                pdf.showPage()

            pdf.save()
            pdf = None

        except ImageToPDFError:
            raise

        except Exception as exc:
            raise PDFGenerationError(
                f"Unable to generate PDF: {exc}"
            ) from exc

        finally:
            if pdf is not None:
                del pdf

    # ==================================================================
    # Image Preparation
    # ==================================================================

    @staticmethod
    def _has_transparency(
        image: Image.Image,
    ) -> bool:
        """Check whether image contains transparency."""

        if image.mode in ("RGBA", "LA"):
            return True

        if image.mode == "P":
            return "transparency" in image.info

        return False

    @classmethod
    def _prepare_image(
        cls,
        image: Image.Image,
        background: str,
    ) -> Image.Image:
        """
        Prepare an image for ReportLab.

        Transparent images are composited onto the requested
        background so they render correctly in the PDF.
        """

        if cls._has_transparency(image):
            rgba = image.convert("RGBA")

            canvas_image = Image.new(
                "RGB",
                rgba.size,
                background,
            )

            canvas_image.paste(
                rgba,
                mask=rgba.getchannel("A"),
            )

            return canvas_image

        if image.mode not in (
            "RGB",
            "L",
        ):
            return image.convert("RGB")

        return image

    # ==================================================================
    # Layout
    # ==================================================================

    @staticmethod
    def _calculate_image_position(
        image_width: int,
        image_height: int,
        page_width: float,
        page_height: float,
        margin: float,
        layout: str,
    ) -> tuple[float, float, float, float]:
        """Calculate image position and dimensions."""

        available_width = page_width - (2 * margin)
        available_height = page_height - (2 * margin)

        if (
            available_width <= 0
            or available_height <= 0
        ):
            raise InvalidPDFParameterError(
                "Margins are too large for the selected page size."
            )

        if (
            image_width <= 0
            or image_height <= 0
        ):
            raise InvalidImageError(
                "Image has invalid dimensions."
            )

        image_ratio = (
            image_width / image_height
        )

        available_ratio = (
            available_width / available_height
        )

        # --------------------------------------------------------------
        # ORIGINAL
        # --------------------------------------------------------------

        if layout == "ORIGINAL":
            draw_width = float(image_width)
            draw_height = float(image_height)

            if (
                draw_width > available_width
                or draw_height > available_height
            ):
                scale = min(
                    available_width / draw_width,
                    available_height / draw_height,
                )

                draw_width *= scale
                draw_height *= scale

        # --------------------------------------------------------------
        # FILL
        # --------------------------------------------------------------

        elif layout == "FILL":
            # Cover the complete available area while
            # preserving the image aspect ratio.

            scale = max(
                available_width / image_width,
                available_height / image_height,
            )

            draw_width = image_width * scale
            draw_height = image_height * scale

        # --------------------------------------------------------------
        # FIT
        # --------------------------------------------------------------

        else:
            # Keep the complete image visible.

            scale = min(
                available_width / image_width,
                available_height / image_height,
            )

            draw_width = image_width * scale
            draw_height = image_height * scale

        # Center image on page.

        draw_x = (
            page_width - draw_width
        ) / 2

        draw_y = (
            page_height - draw_height
        ) / 2

        return (
            draw_x,
            draw_y,
            draw_width,
            draw_height,
        )

    # ==================================================================
    # Page Size
    # ==================================================================

    @staticmethod
    def _get_original_page_size(
        image_path: Path,
    ) -> tuple[float, float]:
        """
        Calculate PDF page dimensions from image dimensions.

        Uses 72 DPI as the PDF point conversion, meaning
        one image pixel is treated as one PDF point.
        """

        try:
            with Image.open(image_path) as image:
                image = ImageOps.exif_transpose(image)

                width, height = image.size

                if (
                    width <= 0
                    or height <= 0
                ):
                    raise InvalidImageError(
                        f"Invalid dimensions: "
                        f"{image_path.name}"
                    )

                return (
                    float(width),
                    float(height),
                )

        except ImageToPDFError:
            raise

        except Exception as exc:
            raise InvalidImageError(
                f"Unable to determine image dimensions: {exc}"
            ) from exc

    # ==================================================================
    # Output Handling
    # ==================================================================

    @staticmethod
    def _prepare_output_path(
        input_files: List[Path],
        output_path: str | Path | None,
        overwrite: bool,
    ) -> Path:
        """Prepare a safe PDF output path."""

        if output_path is not None:
            output = Path(output_path)

            try:
                output.parent.mkdir(
                    parents=True,
                    exist_ok=True,
                )
            except OSError as exc:
                raise PDFGenerationError(
                    f"Unable to create output directory: "
                    f"{output.parent}"
                ) from exc

            if output.suffix.lower() != ".pdf":
                output = output.with_suffix(".pdf")

        else:
            first_file = input_files[0]

            output = (
                first_file.parent
                / f"{first_file.stem}.pdf"
            )

        if output.exists() and not overwrite:
            output = ImageToPDF._find_available_path(
                output
            )

        return output

    @staticmethod
    def _ensure_output_not_input(
        output_path: Path,
        input_files: List[Path],
    ) -> None:
        """Ensure output cannot overwrite an input image."""

        try:
            output_resolved = output_path.resolve()
        except OSError as exc:
            raise PDFGenerationError(
                f"Unable to resolve output path: "
                f"{output_path}"
            ) from exc

        for input_file in input_files:
            try:
                input_resolved = input_file.resolve()
            except OSError as exc:
                raise PDFGenerationError(
                    f"Unable to resolve file path: "
                    f"{input_file}"
                ) from exc

            if output_resolved == input_resolved:
                raise InvalidPDFParameterError(
                    "Output path must be different from "
                    "all input image paths."
                )

    @staticmethod
    def _find_available_path(
        path: Path,
    ) -> Path:
        """Generate a unique output filename."""

        counter = 1

        while True:
            candidate = (
                path.parent
                / f"{path.stem}_{counter}{path.suffix}"
            )

            if not candidate.exists():
                return candidate

            counter += 1

    # ==================================================================
    # PDF Validation
    # ==================================================================

    @staticmethod
    def _validate_pdf(
        pdf_path: Path,
        expected_pages: int,
    ) -> None:
        """Validate the generated PDF."""

        if not pdf_path.exists():
            raise PDFGenerationError(
                "PDF file was not created."
            )

        if not pdf_path.is_file():
            raise PDFGenerationError(
                "Generated PDF path is not a file."
            )

        try:
            file_size = pdf_path.stat().st_size
        except OSError as exc:
            raise PDFGenerationError(
                "Unable to read generated PDF."
            ) from exc

        if file_size == 0:
            raise PDFGenerationError(
                "Generated PDF is empty."
            )

        try:
            with open(
                pdf_path,
                "rb",
            ) as file:
                header = file.read(5)

            if header != b"%PDF-":
                raise PDFGenerationError(
                    "Generated file is not a valid PDF."
                )

        except PDFGenerationError:
            raise

        except OSError as exc:
            raise PDFGenerationError(
                f"Unable to read generated PDF: {exc}"
            ) from exc

        # Optional stronger validation when pypdf is installed.

        try:
            from pypdf import PdfReader
        except ImportError:
            return

        try:
            reader = PdfReader(
                str(pdf_path)
            )

            if reader.is_encrypted:
                raise PDFGenerationError(
                    "Generated PDF is unexpectedly encrypted."
                )

            actual_pages = len(reader.pages)

            if actual_pages != expected_pages:
                raise PDFGenerationError(
                    "PDF page count mismatch. "
                    f"Expected {expected_pages}, "
                    f"got {actual_pages}."
                )

        except PDFGenerationError:
            raise

        except Exception as exc:
            raise PDFGenerationError(
                f"Generated PDF failed validation: {exc}"
            ) from exc

    # ==================================================================
    # Cleanup
    # ==================================================================

    @staticmethod
    def _cleanup_output(
        output_path: Path,
    ) -> None:
        """Remove a partially generated PDF."""

        try:
            if output_path.exists():
                output_path.unlink()

        except OSError:
            # Cleanup failure must not hide the original error.
            pass


# ======================================================================
# Convenience Function
# ======================================================================


_default_converter = ImageToPDF()


def images_to_pdf(
    input_files: str | Path | Iterable[str | Path],
    output_path: str | Path | None = None,
    page_size: str = "A4",
    layout: str = "FIT",
    margin: float = ImageToPDF.DEFAULT_MARGIN,
    overwrite: bool = False,
    background: str = "white",
) -> ImagePDFResult:
    """
    Convenience function for converting images to PDF.
    """

    return _default_converter.convert(
        input_files=input_files,
        output_path=output_path,
        page_size=page_size,
        layout=layout,
        margin=margin,
        overwrite=overwrite,
        background=background,
    )