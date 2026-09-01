"""
StudyGemma - Image Processor

Responsibilities:
- Validate image files
- Load and decode images
- Extract image metadata
- Analyze basic image quality
- Handle EXIF orientation
- Preprocess images for OCR
- Call the central OCR service
- Clean OCR text
- Detect basic document structure
- Produce standardized RAG-ready output

This module does NOT:
- Generate embeddings
- Store vectors
- Call Gemma
- Compress images permanently
- Convert images to PDF
"""

from __future__ import annotations

import io
import logging
import mimetypes
from pathlib import Path
from typing import Any, BinaryIO, Optional, Union

from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageStat

try:
    from .ocr_service import ocr_service
except ImportError:
    from ocr_service import ocr_service


logger = logging.getLogger(__name__)


ImageInput = Union[
    str,
    Path,
    bytes,
    bytearray,
    BinaryIO,
    Image.Image,
]


class ImageProcessor:
    """
    Main image processing coordinator for StudyGemma.
    """

    SUPPORTED_EXTENSIONS = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".tif",
        ".tiff",
    }

    SUPPORTED_MIME_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
    }

    MAX_FILE_SIZE = 25 * 1024 * 1024

    MIN_WIDTH = 200
    MIN_HEIGHT = 200

    def __init__(
        self,
        ocr_service_instance=None,
        max_file_size: int = MAX_FILE_SIZE,
    ):
        self.ocr = (
            ocr_service_instance
            or ocr_service
        )

        self.max_file_size = max_file_size

    # =========================================================
    # MAIN PROCESSING PIPELINE
    # =========================================================

    def process(
        self,
        image_input: ImageInput,
        filename: Optional[str] = None,
        language: str = "eng",
        perform_ocr: bool = True,
        preprocess: bool = True,
    ) -> dict[str, Any]:
        """
        Complete image processing pipeline.

        Pipeline:

            Validate
                ↓
            Load
                ↓
            Metadata
                ↓
            Quality
                ↓
            Orientation
                ↓
            Preprocessing
                ↓
            OCR
                ↓
            Cleaning
                ↓
            Structure
                ↓
            RAG-ready output
        """

        warnings: list[str] = []

        try:

            # -------------------------------------------------
            # 1. VALIDATION
            # -------------------------------------------------

            validation = self.validate_image(
                image_input=image_input,
                filename=filename,
            )

            if not validation["valid"]:

                return self._failure_result(
                    error=validation["error"],
                    warnings=validation.get(
                        "warnings",
                        [],
                    ),
                )

            warnings.extend(
                validation.get(
                    "warnings",
                    [],
                )
            )

            # -------------------------------------------------
            # 2. LOAD IMAGE
            # -------------------------------------------------

            image = self._load_image(
                image_input
            )

            # -------------------------------------------------
            # 3. METADATA
            # -------------------------------------------------

            metadata = self.extract_metadata(
                image=image,
                filename=filename,
                image_input=image_input,
            )

            # -------------------------------------------------
            # 4. QUALITY ANALYSIS
            # -------------------------------------------------

            quality = self.analyze_quality(
                image
            )

            warnings.extend(
                quality.get(
                    "warnings",
                    [],
                )
            )

            # -------------------------------------------------
            # 5. ORIENTATION
            # -------------------------------------------------

            image = ImageOps.exif_transpose(
                image
            )

            orientation = self.detect_orientation(
                image
            )

            # -------------------------------------------------
            # 6. PREPROCESSING
            # -------------------------------------------------

            processed_image = image

            if preprocess:

                processed_image = (
                    self.preprocess_image(
                        image
                    )
                )

            # -------------------------------------------------
            # 7. OCR
            # -------------------------------------------------

            ocr_result = {
                "performed": False,
                "success": False,
                "text": "",
                "language": language,
                "confidence": 0.0,
                "quality": "NOT_PERFORMED",
                "error": None,
            }

            if perform_ocr:

                raw_ocr = self.ocr.extract_text(
                    processed_image,
                    language=language,
                    preprocess=False,
                )

                ocr_result = {
                    "performed": True,
                    "success": raw_ocr.get(
                        "success",
                        False,
                    ),
                    "text": raw_ocr.get(
                        "text",
                        "",
                    ),
                    "language": raw_ocr.get(
                        "language",
                        language,
                    ),
                    "confidence": raw_ocr.get(
                        "confidence",
                        0.0,
                    ),
                    "quality": raw_ocr.get(
                        "quality",
                        "UNKNOWN",
                    ),
                    "error": raw_ocr.get(
                        "error"
                    ),
                }

                if raw_ocr.get("error"):

                    warnings.append(
                        "OCR processing failed."
                    )

                if raw_ocr.get(
                    "quality"
                ) in {
                    "LOW",
                    "VERY_LOW",
                    "EMPTY",
                    "FAILED",
                }:

                    warnings.append(
                        "OCR text quality is low."
                    )

            # -------------------------------------------------
            # 8. CLEAN CONTENT
            # -------------------------------------------------

            text = self.clean_text(
                ocr_result.get(
                    "text",
                    "",
                )
            )

            # -------------------------------------------------
            # 9. STRUCTURE DETECTION
            # -------------------------------------------------

            structure = self.detect_structure(
                text
            )

            # -------------------------------------------------
            # 10. RAG-READY CONTENT
            # -------------------------------------------------

            rag_ready = self.create_rag_ready(
                filename=filename,
                metadata=metadata,
                text=text,
                structure=structure,
                ocr_result=ocr_result,
                quality=quality,
                warnings=warnings,
            )

            return {
                "success": True,
                "document_type": "image",
                "filename": filename,
                "metadata": metadata,
                "orientation": orientation,
                "quality": quality,
                "ocr": ocr_result,
                "content": {
                    "text": text,
                    "character_count": len(text),
                    "word_count": len(
                        text.split()
                    ),
                    "paragraphs": structure[
                        "paragraphs"
                    ],
                    "lines": structure[
                        "lines"
                    ],
                },
                "structure": structure,
                "warnings": warnings,
                "rag_ready": rag_ready,
                "error": None,
            }

        except Exception as error:

            logger.exception(
                "Image processing failed."
            )

            return self._failure_result(
                error=str(error),
                warnings=warnings,
            )

    # =========================================================
    # VALIDATION
    # =========================================================

    def validate_image(
        self,
        image_input: ImageInput,
        filename: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Validate image input before processing.
        """

        warnings: list[str] = []

        # File-based validation
        if isinstance(
            image_input,
            (str, Path),
        ):

            path = Path(
                image_input
            )

            if not path.exists():

                return {
                    "valid": False,
                    "error": "Image file does not exist.",
                    "warnings": warnings,
                }

            if not path.is_file():

                return {
                    "valid": False,
                    "error": "Provided path is not a file.",
                    "warnings": warnings,
                }

            extension = (
                path.suffix.lower()
            )

            if extension not in (
                self.SUPPORTED_EXTENSIONS
            ):

                return {
                    "valid": False,
                    "error": (
                        f"Unsupported image format: "
                        f"{extension}"
                    ),
                    "warnings": warnings,
                }

            file_size = path.stat().st_size

            if file_size > self.max_file_size:

                return {
                    "valid": False,
                    "error": (
                        "Image exceeds the maximum "
                        "allowed file size."
                    ),
                    "warnings": warnings,
                }

        # Bytes validation
        elif isinstance(
            image_input,
            (bytes, bytearray),
        ):

            if len(image_input) > (
                self.max_file_size
            ):

                return {
                    "valid": False,
                    "error": (
                        "Image exceeds the maximum "
                        "allowed file size."
                    ),
                    "warnings": warnings,
                }

        # PIL validation
        elif isinstance(
            image_input,
            Image.Image,
        ):

            pass

        # File-like object
        elif hasattr(
            image_input,
            "read",
        ):

            try:

                current_position = (
                    image_input.tell()
                )

                image_input.seek(
                    0,
                    2,
                )

                size = image_input.tell()

                image_input.seek(
                    current_position
                )

                if size > self.max_file_size:

                    return {
                        "valid": False,
                        "error": (
                            "Image exceeds the maximum "
                            "allowed file size."
                        ),
                        "warnings": warnings,
                    }

            except Exception:

                warnings.append(
                    "Unable to determine input stream size."
                )

        else:

            return {
                "valid": False,
                "error": (
                    "Unsupported image input type."
                ),
                "warnings": warnings,
            }

        # Try opening the image to detect corruption.
        try:

            image = self._load_image(
                image_input
            )

            image.verify()

        except Exception:

            return {
                "valid": False,
                "error": (
                    "Image is corrupted or "
                    "cannot be decoded."
                ),
                "warnings": warnings,
            }

        return {
            "valid": True,
            "error": None,
            "warnings": warnings,
        }

    # =========================================================
    # IMAGE LOADING
    # =========================================================

    def _load_image(
        self,
        image_input: ImageInput,
    ) -> Image.Image:
        """
        Load an image from supported input types.
        """

        if isinstance(
            image_input,
            Image.Image,
        ):

            image = image_input.copy()

        elif isinstance(
            image_input,
            (str, Path),
        ):

            image = Image.open(
                image_input
            )

        elif isinstance(
            image_input,
            (bytes, bytearray),
        ):

            image = Image.open(
                io.BytesIO(
                    bytes(image_input)
                )
            )

        elif hasattr(
            image_input,
            "read",
        ):

            image = Image.open(
                image_input
            )

        else:

            raise TypeError(
                "Unsupported image input type."
            )

        image.load()

        return image

    # =========================================================
    # METADATA
    # =========================================================

    def extract_metadata(
        self,
        image: Image.Image,
        filename: Optional[str] = None,
        image_input: Optional[ImageInput] = None,
    ) -> dict[str, Any]:
        """
        Extract useful image metadata.
        """

        file_size = None

        if isinstance(
            image_input,
            (str, Path),
        ):

            try:

                file_size = Path(
                    image_input
                ).stat().st_size

            except OSError:

                file_size = None

        elif isinstance(
            image_input,
            (bytes, bytearray),
        ):

            file_size = len(
                image_input
            )

        metadata = {
            "filename": filename,
            "format": image.format,
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "file_size": file_size,
            "mime_type": self._get_mime_type(
                image
            ),
            "dpi": self._get_dpi(
                image
            ),
            "has_exif": bool(
                getattr(
                    image,
                    "getexif",
                    lambda: {},
                )()
            ),
        }

        return metadata

    # =========================================================
    # MIME TYPE
    # =========================================================

    @staticmethod
    def _get_mime_type(
        image: Image.Image,
    ) -> Optional[str]:
        """
        Determine MIME type from image format.
        """

        if not image.format:
            return None

        extension = (
            f".{image.format.lower()}"
        )

        if extension == ".jpg":
            extension = ".jpeg"

        return mimetypes.types_map.get(
            extension
        )

    # =========================================================
    # DPI
    # =========================================================

    @staticmethod
    def _get_dpi(
        image: Image.Image,
    ) -> Optional[dict[str, float]]:
        """
        Extract DPI information when available.
        """

        dpi = image.info.get(
            "dpi"
        )

        if not dpi:
            return None

        try:

            return {
                "x": float(
                    dpi[0]
                ),
                "y": float(
                    dpi[1]
                ),
            }

        except (
            TypeError,
            ValueError,
            IndexError,
        ):

            return None

    # =========================================================
    # QUALITY ANALYSIS
    # =========================================================

    def analyze_quality(
        self,
        image: Image.Image,
    ) -> dict[str, Any]:
        """
        Perform basic image quality analysis.

        This is not a replacement for advanced
        computer vision quality assessment.
        """

        warnings: list[str] = []

        width = image.width
        height = image.height

        # Resolution
        if (
            width < self.MIN_WIDTH
            or height < self.MIN_HEIGHT
        ):

            resolution_quality = "LOW"

            warnings.append(
                "Image resolution is low and may "
                "reduce OCR accuracy."
            )

        elif (
            width >= 1000
            and height >= 1000
        ):

            resolution_quality = "HIGH"

        else:

            resolution_quality = "MEDIUM"

        # Brightness
        grayscale = ImageOps.grayscale(
            image
        )

        statistics = ImageStat.Stat(
            grayscale
        )

        brightness = round(
            statistics.mean[0],
            2,
        )

        if brightness < 40:

            brightness_quality = "DARK"

            warnings.append(
                "Image appears too dark."
            )

        elif brightness > 220:

            brightness_quality = "BRIGHT"

            warnings.append(
                "Image may be overexposed."
            )

        else:

            brightness_quality = "NORMAL"

        # Contrast
        contrast = round(
            statistics.stddev[0],
            2,
        )

        if contrast < 20:

            contrast_quality = "LOW"

            warnings.append(
                "Image has low contrast."
            )

        else:

            contrast_quality = "NORMAL"

        # Simple blur estimation
        blur_score = self._estimate_blur(
            grayscale
        )

        if blur_score < 5:

            blur_quality = "BLURRY"

            warnings.append(
                "Image may be blurry."
            )

        elif blur_score < 15:

            blur_quality = "MODERATE"

        else:

            blur_quality = "SHARP"

        return {
            "resolution": {
                "width": width,
                "height": height,
                "quality": resolution_quality,
            },
            "brightness": {
                "value": brightness,
                "quality": brightness_quality,
            },
            "contrast": {
                "value": contrast,
                "quality": contrast_quality,
            },
            "blur": {
                "score": blur_score,
                "quality": blur_quality,
            },
            "warnings": warnings,
        }

    # =========================================================
    # BLUR ESTIMATION
    # =========================================================

    @staticmethod
    def _estimate_blur(
        image: Image.Image,
    ) -> float:
        """
        Estimate image sharpness using
        Laplacian-like edge differences.

        This is intentionally lightweight and
        dependency-free.
        """

        try:

            small = image.copy()

            small.thumbnail(
                (800, 800)
            )

            edges = small.filter(
                ImageFilter.FIND_EDGES
            )

            statistics = ImageStat.Stat(
                edges
            )

            value = (
                statistics.stddev[0]
                if statistics.stddev
                else 0.0
            )

            return round(
                float(value),
                2,
            )

        except Exception:

            return 0.0

    # =========================================================
    # ORIENTATION
    # =========================================================

    @staticmethod
    def detect_orientation(
        image: Image.Image,
    ) -> dict[str, Any]:
        """
        Detect basic image orientation.

        Note:
        EXIF orientation is normalized separately.
        """

        if image.width > image.height:

            orientation = "landscape"

        elif image.height > image.width:

            orientation = "portrait"

        else:

            orientation = "square"

        return {
            "type": orientation,
            "width": image.width,
            "height": image.height,
        }

    # =========================================================
    # PREPROCESSING
    # =========================================================

    @staticmethod
    def preprocess_image(
        image: Image.Image,
    ) -> Image.Image:
        """
        Prepare an image for OCR.

        Pipeline:
            EXIF correction
                ↓
            RGB/Grayscale
                ↓
            Resize if needed
                ↓
            Contrast
                ↓
            Sharpen
        """

        image = ImageOps.exif_transpose(
            image
        )

        if image.mode not in (
            "RGB",
            "L",
        ):

            image = image.convert(
                "RGB"
            )

        # Convert to grayscale.
        image = ImageOps.grayscale(
            image
        )

        # Upscale smaller images.
        minimum_width = 1000

        if image.width < minimum_width:

            scale = (
                minimum_width
                / image.width
            )

            new_size = (
                int(
                    image.width * scale
                ),
                int(
                    image.height * scale
                ),
            )

            image = image.resize(
                new_size,
                Image.Resampling.LANCZOS,
            )

        # Improve contrast.
        image = ImageEnhance.Contrast(
            image
        ).enhance(1.4)

        # Sharpen.
        image = ImageEnhance.Sharpness(
            image
        ).enhance(1.4)

        image = image.filter(
            ImageFilter.SHARPEN
        )

        return image

    # =========================================================
    # TEXT CLEANING
    # =========================================================

    @staticmethod
    def clean_text(
        text: str,
    ) -> str:
        """
        Clean OCR output while preserving
        useful line structure.
        """

        if not text:
            return ""

        text = text.replace(
            "\r\n",
            "\n",
        )

        text = text.replace(
            "\r",
            "\n",
        )

        text = text.replace(
            "\xa0",
            " ",
        )

        cleaned_lines = []

        previous_blank = False

        for line in text.split(
            "\n"
        ):

            line = line.strip()

            # Collapse repeated spaces.
            line = " ".join(
                line.split()
            )

            if not line:

                if not previous_blank:

                    cleaned_lines.append(
                        ""
                    )

                previous_blank = True

                continue

            cleaned_lines.append(
                line
            )

            previous_blank = False

        return "\n".join(
            cleaned_lines
        ).strip()

    # =========================================================
    # STRUCTURE DETECTION
    # =========================================================

    @staticmethod
    def detect_structure(
        text: str,
    ) -> dict[str, Any]:
        """
        Detect basic text structure.

        Since OCR does not always preserve
        semantic formatting, this intentionally
        stays conservative.
        """

        if not text:

            return {
                "lines": [],
                "paragraphs": [],
                "line_count": 0,
                "paragraph_count": 0,
            }

        lines = [
            line.strip()
            for line in text.split(
                "\n"
            )
            if line.strip()
        ]

        paragraphs = [
            paragraph.strip()
            for paragraph in text.split(
                "\n\n"
            )
            if paragraph.strip()
        ]

        return {
            "lines": lines,
            "paragraphs": paragraphs,
            "line_count": len(lines),
            "paragraph_count": len(
                paragraphs
            ),
        }

    # =========================================================
    # RAG READY FORMAT
    # =========================================================

    @staticmethod
    def create_rag_ready(
        filename: Optional[str],
        metadata: dict[str, Any],
        text: str,
        structure: dict[str, Any],
        ocr_result: dict[str, Any],
        quality: dict[str, Any],
        warnings: list[str],
    ) -> dict[str, Any]:
        """
        Convert processed image information
        into a standardized format for RAG.
        """

        return {
            "source": {
                "filename": filename,
                "type": "image",
            },

            "metadata": metadata,

            "content": {
                "text": text,
                "lines": structure.get(
                    "lines",
                    [],
                ),
                "paragraphs": structure.get(
                    "paragraphs",
                    [],
                ),
            },

            "ocr": {
                "performed": ocr_result.get(
                    "performed",
                    False,
                ),
                "language": ocr_result.get(
                    "language"
                ),
                "confidence": ocr_result.get(
                    "confidence",
                    0.0,
                ),
                "quality": ocr_result.get(
                    "quality"
                ),
            },

            "quality": quality,

            "warnings": warnings,

            "ready_for_rag": bool(
                text.strip()
            ),
        }

    # =========================================================
    # FAILURE RESPONSE
    # =========================================================

    @staticmethod
    def _failure_result(
        error: str,
        warnings: Optional[list[str]] = None,
    ) -> dict[str, Any]:
        """
        Standard processing failure response.
        """

        return {
            "success": False,
            "document_type": "image",
            "filename": None,
            "metadata": {},
            "orientation": None,
            "quality": {},
            "ocr": {
                "performed": False,
                "success": False,
                "text": "",
                "confidence": 0.0,
                "quality": "FAILED",
                "error": error,
            },
            "content": {
                "text": "",
                "character_count": 0,
                "word_count": 0,
                "paragraphs": [],
                "lines": [],
            },
            "structure": {
                "lines": [],
                "paragraphs": [],
                "line_count": 0,
                "paragraph_count": 0,
            },
            "warnings": warnings or [],
            "rag_ready": False,
            "error": error,
        }


# =============================================================
# DEFAULT SERVICE INSTANCE
# =============================================================

image_processor = ImageProcessor()