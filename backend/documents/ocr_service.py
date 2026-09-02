"""
StudyGemma - OCR Service

Responsibilities:
- OCR images and scanned document pages
- Support configurable OCR languages
- Preprocess images before OCR
- Return extracted text and OCR metadata
- Perform basic quality/confidence checks
- Handle OCR errors safely

This module does NOT:
- Generate embeddings
- Chunk documents
- Call Gemma
- Store vectors
"""

from __future__ import annotations

import io
import logging
import shutil
from pathlib import Path
from typing import Any, BinaryIO, Optional, Union

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

try:
    import pytesseract
    from pytesseract import Output
except ImportError:
    pytesseract = None
    Output = None


logger = logging.getLogger(__name__)


ImageInput = Union[
    str,
    Path,
    bytes,
    bytearray,
    BinaryIO,
    Image.Image,
]


class OCRService:
    """
    Central OCR service used by StudyGemma document processors.

    Example:

        ocr = OCRService()

        result = ocr.extract_text(
            "sample.png",
            language="eng"
        )

        print(result["text"])
    """

    DEFAULT_LANGUAGE = "eng"

    SUPPORTED_LANGUAGES = {
        "eng": "English",
        "hin": "Hindi",
        "mar": "Marathi",
        "urd": "Urdu",
        "eng+hin": "English + Hindi",
        "eng+mar": "English + Marathi",
        "eng+urd": "English + Urdu",
        "hin+mar": "Hindi + Marathi",
        "eng+hin+mar": "English + Hindi + Marathi",
        "eng+hin+mar+urd": (
            "English + Hindi + Marathi + Urdu"
        ),
    }

    # Images below this width can often produce
    # poor OCR results.
    MIN_IMAGE_WIDTH = 500

    # Prevent extremely large images from consuming
    # excessive memory.
    MAX_IMAGE_PIXELS = 50_000_000

    # Minimum amount of useful text expected from OCR.
    MIN_USEFUL_TEXT_LENGTH = 3

    def __init__(
        self,
        tesseract_cmd: Optional[str] = None,
        default_language: str = DEFAULT_LANGUAGE,
        preprocess: bool = True,
        confidence_threshold: float = 40.0,
    ):
        self.default_language = default_language
        self.preprocess_enabled = preprocess
        self.confidence_threshold = confidence_threshold

        self._configure_pytesseract(
            tesseract_cmd
        )

    # =========================================================
    # CONFIGURATION
    # =========================================================

    def _configure_pytesseract(
        self,
        tesseract_cmd: Optional[str],
    ) -> None:
        """
        Configure the Tesseract executable.
        """

        if pytesseract is None:
            return

        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = (
                tesseract_cmd
            )

    # =========================================================
    # ENGINE CHECK
    # =========================================================

    def is_available(self) -> bool:
        """
        Check whether the OCR engine is available.
        """

        if pytesseract is None:
            return False

        try:
            pytesseract.get_tesseract_version()
            return True

        except Exception:
            return False

    def get_engine_info(self) -> dict[str, Any]:
        """
        Return OCR engine status.
        """

        if pytesseract is None:

            return {
                "available": False,
                "engine": "Tesseract",
                "reason": (
                    "pytesseract is not installed."
                ),
            }

        try:

            version = (
                pytesseract.get_tesseract_version()
            )

            return {
                "available": True,
                "engine": "Tesseract",
                "version": str(version),
            }

        except Exception as error:

            return {
                "available": False,
                "engine": "Tesseract",
                "reason": str(error),
            }

    # =========================================================
    # LANGUAGE
    # =========================================================

    def validate_language(
        self,
        language: Optional[str],
    ) -> str:
        """
        Validate the requested OCR language.

        Tesseract language codes are expected here.
        """

        language = (
            language
            or self.default_language
        ).strip()

        if not language:
            language = self.DEFAULT_LANGUAGE

        return language

    def get_supported_languages(self) -> dict[str, str]:
        """
        Return commonly configured languages.

        Actual availability depends on the language
        data installed with Tesseract.
        """

        return dict(
            self.SUPPORTED_LANGUAGES
        )

    def get_installed_languages(
        self,
    ) -> list[str]:
        """
        Return languages actually installed
        in the local Tesseract installation.
        """

        if not self.is_available():
            return []

        try:

            languages = (
                pytesseract.get_languages(
                    config=""
                )
            )

            return sorted(
                languages
            )

        except Exception as error:

            logger.warning(
                "Unable to detect OCR languages: %s",
                error,
            )

            return []

    # =========================================================
    # MAIN OCR METHOD
    # =========================================================

    def extract_text(
        self,
        image_input: ImageInput,
        language: Optional[str] = None,
        preprocess: Optional[bool] = None,
        detect_orientation: bool = True,
    ) -> dict[str, Any]:
        """
        Extract text from an image.

        Returns:
            {
                "success": bool,
                "text": str,
                "language": str,
                "confidence": float,
                "word_count": int,
                "character_count": int,
                "quality": str,
                "orientation": ...,
                "error": None
            }
        """

        requested_language = (
            self.validate_language(
                language
            )
        )

        if not self.is_available():

            return self._error_result(
                error=(
                    "OCR engine is not available. "
                    "Install Tesseract and make sure "
                    "pytesseract can access it."
                ),
                language=requested_language,
            )

        try:

            image = self.load_image(
                image_input
            )

            original_size = image.size

            should_preprocess = (
                self.preprocess_enabled
                if preprocess is None
                else preprocess
            )

            if should_preprocess:

                image = self.preprocess_image(
                    image
                )

            orientation = None

            if detect_orientation:

                orientation = (
                    self.detect_orientation(
                        image
                    )
                )

            text = pytesseract.image_to_string(
                image,
                lang=requested_language,
            )

            text = self.clean_text(
                text
            )

            confidence = (
                self.calculate_confidence(
                    image,
                    requested_language
                )
            )

            quality = (
                self.evaluate_quality(
                    text,
                    confidence
                )
            )

            return {
                "success": bool(text),
                "text": text,
                "language": requested_language,
                "confidence": confidence,
                "word_count": len(
                    text.split()
                ),
                "character_count": len(
                    text
                ),
                "quality": quality,
                "orientation": orientation,
                "original_size": {
                    "width": original_size[0],
                    "height": original_size[1],
                },
                "processed_size": {
                    "width": image.width,
                    "height": image.height,
                },
                "preprocessed": should_preprocess,
                "error": None,
            }

        except Exception as error:

            logger.exception(
                "OCR extraction failed."
            )

            return self._error_result(
                error=str(error),
                language=requested_language,
            )

    # =========================================================
    # ALIAS
    # =========================================================

    def extract_text_from_image(
        self,
        image_input: ImageInput,
        language: Optional[str] = None,
        preprocess: Optional[bool] = None,
    ) -> str:
        """
        Simple interface for document processors.

        Returns only the extracted text.
        """

        result = self.extract_text(
            image_input=image_input,
            language=language,
            preprocess=preprocess,
        )

        return result.get(
            "text",
            ""
        )

    # =========================================================
    # LOAD IMAGE
    # =========================================================

    def load_image(
        self,
        image_input: ImageInput,
    ) -> Image.Image:
        """
        Load image from:
        - file path
        - bytes
        - file-like object
        - PIL Image
        """

        if isinstance(
            image_input,
            Image.Image
        ):

            image = image_input.copy()

        elif isinstance(
            image_input,
            (str, Path)
        ):

            image = Image.open(
                image_input
            )

        elif isinstance(
            image_input,
            (bytes, bytearray)
        ):

            image = Image.open(
                io.BytesIO(
                    bytes(image_input)
                )
            )

        elif hasattr(
            image_input,
            "read"
        ):

            image = Image.open(
                image_input
            )

        else:

            raise TypeError(
                "Unsupported image input type."
            )

        # Prevent decompression-bomb style
        # extremely large images.
        if (
            image.width * image.height
            > self.MAX_IMAGE_PIXELS
        ):

            raise ValueError(
                "Image is too large for OCR processing."
            )

        # Load actual image data before closing
        # any source file.
        image.load()

        return image

    # =========================================================
    # PREPROCESSING
    # =========================================================

    def preprocess_image(
        self,
        image: Image.Image,
    ) -> Image.Image:
        """
        Prepare an image for better OCR.

        Pipeline:
            RGB
             ↓
            EXIF rotation
             ↓
            Grayscale
             ↓
            Upscale if required
             ↓
            Contrast enhancement
             ↓
            Sharpening
        """

        image = ImageOps.exif_transpose(
            image
        )

        # OCR generally works better with RGB/L.
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

        # Upscale small images.
        if image.width < self.MIN_IMAGE_WIDTH:

            scale = (
                self.MIN_IMAGE_WIDTH
                / image.width
            )

            new_width = int(
                image.width * scale
            )

            new_height = int(
                image.height * scale
            )

            image = image.resize(
                (
                    new_width,
                    new_height,
                ),
                Image.Resampling.LANCZOS,
            )

        # Improve contrast.
        image = ImageEnhance.Contrast(
            image
        ).enhance(1.5)

        # Slight sharpening.
        image = ImageEnhance.Sharpness(
            image
        ).enhance(1.5)

        image = image.filter(
            ImageFilter.SHARPEN
        )

        return image

    # =========================================================
    # ORIENTATION
    # =========================================================

    def detect_orientation(
        self,
        image: Image.Image,
    ) -> Optional[int]:
        """
        Detect text orientation using Tesseract OSD.

        Returns an angle such as:
            0
            90
            180
            270

        Returns None when detection fails.
        """

        if pytesseract is None:
            return None

        try:

            osd = pytesseract.image_to_osd(
                image
            )

            match = re_search(
                r"Rotate:\s*(\d+)",
                osd
            )

            if match:

                return int(
                    match.group(1)
                )

        except Exception:

            pass

        return None

    # =========================================================
    # CONFIDENCE
    # =========================================================

    def calculate_confidence(
        self,
        image: Image.Image,
        language: str,
    ) -> float:
        """
        Calculate average OCR confidence.

        Tesseract returns confidence values
        for detected words.
        """

        if pytesseract is None:
            return 0.0

        if Output is None:
            return 0.0

        try:

            data = pytesseract.image_to_data(
                image,
                lang=language,
                output_type=Output.DICT,
            )

            confidence_values = []

            for value in data.get(
                "conf",
                []
            ):

                try:

                    confidence = float(
                        value
                    )

                    if confidence >= 0:

                        confidence_values.append(
                            confidence
                        )

                except (
                    ValueError,
                    TypeError,
                ):

                    continue

            if not confidence_values:
                return 0.0

            average = (
                sum(confidence_values)
                / len(confidence_values)
            )

            return round(
                average,
                2
            )

        except Exception as error:

            logger.warning(
                "Unable to calculate OCR confidence: %s",
                error,
            )

            return 0.0

    # =========================================================
    # QUALITY
    # =========================================================

    def evaluate_quality(
        self,
        text: str,
        confidence: float,
    ) -> str:
        """
        Classify OCR result quality.
        """

        if not text:
            return "EMPTY"

        if len(text.strip()) < (
            self.MIN_USEFUL_TEXT_LENGTH
        ):

            return "VERY_LOW"

        if confidence >= 80:
            return "HIGH"

        if confidence >= self.confidence_threshold:
            return "MEDIUM"

        return "LOW"

    # =========================================================
    # TEXT CLEANING
    # =========================================================

    @staticmethod
    def clean_text(
        text: str,
    ) -> str:
        """
        Clean common OCR whitespace problems.
        """

        if not text:
            return ""

        text = text.replace(
            "\r\n",
            "\n"
        )

        text = text.replace(
            "\r",
            "\n"
        )

        text = text.replace(
            "\xa0",
            " "
        )

        lines = []

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

                    lines.append("")

                previous_blank = True

            else:

                lines.append(
                    line
                )

                previous_blank = False

        return "\n".join(
            lines
        ).strip()

    # =========================================================
    # BATCH OCR
    # =========================================================

    def extract_text_batch(
        self,
        images: list[ImageInput],
        language: Optional[str] = None,
        preprocess: Optional[bool] = None,
    ) -> list[dict[str, Any]]:
        """
        Process multiple images/pages.
        """

        results = []

        for index, image in enumerate(
            images,
            start=1
        ):

            result = self.extract_text(
                image_input=image,
                language=language,
                preprocess=preprocess,
            )

            result["page_number"] = index

            results.append(
                result
            )

        return results

    # =========================================================
    # ERROR RESULT
    # =========================================================

    def _error_result(
        self,
        error: str,
        language: str,
    ) -> dict[str, Any]:
        """
        Standard OCR error response.
        """

        return {
            "success": False,
            "text": "",
            "language": language,
            "confidence": 0.0,
            "word_count": 0,
            "character_count": 0,
            "quality": "FAILED",
            "orientation": None,
            "original_size": None,
            "processed_size": None,
            "preprocessed": False,
            "error": error,
        }


# =============================================================
# SMALL INTERNAL REGEX HELPER
# =============================================================

def re_search(
    pattern: str,
    text: str,
):
    """
    Small wrapper so orientation detection
    remains isolated.
    """

    import re

    return re.search(
        pattern,
        text,
        flags=re.IGNORECASE,
    )


# =============================================================
# DEFAULT SERVICE INSTANCE
# =============================================================

ocr_service = OCRService()
