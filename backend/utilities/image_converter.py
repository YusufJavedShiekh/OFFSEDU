"""
StudyGemma - Image Converter

Converts images between supported formats with:
- Automatic input format detection
- JPEG, PNG, WEBP, BMP and TIFF support
- Quality control
- Optional resizing
- Aspect-ratio preservation
- EXIF orientation correction
- Transparency handling
- Safe output path generation
- Output validation
- Structured conversion results
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps


class ImageConversionError(Exception):
    """Base exception for image conversion errors."""


class InvalidImageError(ImageConversionError):
    """Raised when the input image is invalid."""


class UnsupportedFormatError(ImageConversionError):
    """Raised when an image format is unsupported."""


class InvalidConversionParameterError(ImageConversionError):
    """Raised when conversion parameters are invalid."""


@dataclass
class ConversionResult:
    """Result of an image conversion."""

    success: bool
    input_path: str
    output_path: Optional[str] = None

    input_format: Optional[str] = None
    output_format: Optional[str] = None

    original_size: int = 0
    output_size: int = 0

    original_dimensions: tuple[int, int] = (0, 0)
    output_dimensions: tuple[int, int] = (0, 0)

    quality: Optional[int] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert result to a dictionary."""

        return {
            "success": self.success,
            "input_path": self.input_path,
            "output_path": self.output_path,
            "input_format": self.input_format,
            "output_format": self.output_format,
            "original_size": self.original_size,
            "output_size": self.output_size,
            "original_dimensions": self.original_dimensions,
            "output_dimensions": self.output_dimensions,
            "quality": self.quality,
            "error": self.error,
        }


class ImageConverter:
    """
    Image format conversion service for StudyGemma.

    Supported formats:
        JPEG / JPG
        PNG
        WEBP
        BMP
        TIFF / TIF

    The original image is never modified.
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

    EXTENSIONS = {
        "JPEG": ".jpg",
        "PNG": ".png",
        "WEBP": ".webp",
        "BMP": ".bmp",
        "TIFF": ".tiff",
    }

    DEFAULT_QUALITY = 90
    MIN_QUALITY = 1
    MAX_QUALITY = 100

    def __init__(self, default_quality: int = DEFAULT_QUALITY):
        self._validate_quality(default_quality)
        self.default_quality = default_quality

    # ==================================================================
    # Public API
    # ==================================================================

    def convert(
        self,
        input_path: str | Path,
        output_format: str,
        output_path: str | Path | None = None,
        quality: int | None = None,
        max_width: int | None = None,
        max_height: int | None = None,
        background: str = "white",
        overwrite: bool = False,
    ) -> ConversionResult:
        """
        Convert an image to another format.

        Args:
            input_path:
                Source image path.

            output_format:
                Target format such as JPEG, PNG or WEBP.

            output_path:
                Optional destination path.

            quality:
                JPEG/WEBP quality from 1 to 100.

            max_width:
                Optional maximum width.

            max_height:
                Optional maximum height.

            background:
                Background used when converting transparent images
                to JPEG.

            overwrite:
                Allow overwriting an existing output file.

        Returns:
            ConversionResult
        """

        input_file = Path(input_path)

        target_format = self._normalize_format(output_format)

        quality = (
            self.default_quality
            if quality is None
            else quality
        )

        self._validate_input(input_file)
        self._validate_quality(quality)
        self._validate_dimensions(
            max_width,
            max_height,
        )

        try:
            with Image.open(input_file) as source:

                # Verify that Pillow recognized the image.
                source_format = self._detect_format(
                    source,
                    input_file,
                )

                original_size = input_file.stat().st_size
                original_dimensions = source.size

                # Correct phone/camera EXIF orientation.
                image = ImageOps.exif_transpose(source)

                # Resize while preserving aspect ratio.
                image = self._resize_image(
                    image,
                    max_width=max_width,
                    max_height=max_height,
                )

                # Prepare image according to target format.
                image = self._prepare_image(
                    image,
                    target_format,
                    background,
                )

                final_output = self._prepare_output_path(
                    input_file=input_file,
                    output_path=output_path,
                    output_format=target_format,
                    overwrite=overwrite,
                )

                save_options = self._build_save_options(
                    target_format,
                    quality,
                )

                image.save(
                    final_output,
                    format=target_format,
                    **save_options,
                )

                # Verify generated output.
                self._validate_output(final_output)

                output_size = final_output.stat().st_size

                return ConversionResult(
                    success=True,
                    input_path=str(input_file),
                    output_path=str(final_output),
                    input_format=source_format,
                    output_format=target_format,
                    original_size=original_size,
                    output_size=output_size,
                    original_dimensions=original_dimensions,
                    output_dimensions=image.size,
                    quality=quality,
                )

        except ImageConversionError:
            raise

        except Exception as exc:
            raise ImageConversionError(
                f"Image conversion failed: {exc}"
            ) from exc

    def convert_to_jpeg(
        self,
        input_path: str | Path,
        output_path: str | Path | None = None,
        quality: int | None = None,
        background: str = "white",
        overwrite: bool = False,
    ) -> ConversionResult:
        """Convert an image to JPEG."""

        return self.convert(
            input_path=input_path,
            output_format="JPEG",
            output_path=output_path,
            quality=quality,
            background=background,
            overwrite=overwrite,
        )

    def convert_to_png(
        self,
        input_path: str | Path,
        output_path: str | Path | None = None,
        overwrite: bool = False,
    ) -> ConversionResult:
        """Convert an image to PNG."""

        return self.convert(
            input_path=input_path,
            output_format="PNG",
            output_path=output_path,
            overwrite=overwrite,
        )

    def convert_to_webp(
        self,
        input_path: str | Path,
        output_path: str | Path | None = None,
        quality: int | None = None,
        overwrite: bool = False,
    ) -> ConversionResult:
        """Convert an image to WEBP."""

        return self.convert(
            input_path=input_path,
            output_format="WEBP",
            output_path=output_path,
            quality=quality,
            overwrite=overwrite,
        )

    def get_image_info(
        self,
        input_path: str | Path,
    ) -> dict:
        """
        Return information about an image without modifying it.
        """

        path = Path(input_path)
        self._validate_input(path)

        try:
            with Image.open(path) as image:

                image_format = self._detect_format(
                    image,
                    path,
                )

                return {
                    "path": str(path),
                    "filename": path.name,
                    "format": image_format,
                    "width": image.width,
                    "height": image.height,
                    "dimensions": image.size,
                    "mode": image.mode,
                    "size": path.stat().st_size,
                    "size_mb": round(
                        path.stat().st_size / (1024 * 1024),
                        2,
                    ),
                    "has_transparency": self._has_transparency(
                        image
                    ),
                }

        except Exception as exc:
            raise InvalidImageError(
                f"Unable to read image information: {exc}"
            ) from exc

    def get_supported_formats(self) -> list[str]:
        """Return supported output formats."""

        return sorted(self.SUPPORTED_FORMATS)

    # ==================================================================
    # Validation
    # ==================================================================

    @staticmethod
    def _validate_input(path: Path) -> None:
        """Validate input path."""

        if not path.exists():
            raise InvalidImageError(
                f"Image does not exist: {path}"
            )

        if not path.is_file():
            raise InvalidImageError(
                f"Input path is not a file: {path}"
            )

        if path.stat().st_size == 0:
            raise InvalidImageError(
                "Input image is empty."
            )

    @classmethod
    def _validate_quality(cls, quality: int) -> None:
        """Validate image quality."""

        if not isinstance(quality, int):
            raise InvalidConversionParameterError(
                "quality must be an integer."
            )

        if not (
            cls.MIN_QUALITY
            <= quality
            <= cls.MAX_QUALITY
        ):
            raise InvalidConversionParameterError(
                f"quality must be between "
                f"{cls.MIN_QUALITY} and {cls.MAX_QUALITY}."
            )

    @staticmethod
    def _validate_dimensions(
        max_width: int | None,
        max_height: int | None,
    ) -> None:
        """Validate optional dimensions."""

        if max_width is not None and max_width <= 0:
            raise InvalidConversionParameterError(
                "max_width must be greater than zero."
            )

        if max_height is not None and max_height <= 0:
            raise InvalidConversionParameterError(
                "max_height must be greater than zero."
            )

    # ==================================================================
    # Format Handling
    # ==================================================================

    @classmethod
    def _normalize_format(cls, image_format: str) -> str:
        """Normalize a format name."""

        if not image_format:
            raise UnsupportedFormatError(
                "Output format cannot be empty."
            )

        value = str(image_format).strip().upper()

        if value.startswith("."):
            value = value[1:]

        normalized = cls.FORMAT_ALIASES.get(value)

        if normalized is None:
            raise UnsupportedFormatError(
                f"Unsupported image format: {image_format}"
            )

        return normalized

    @classmethod
    def _detect_format(
        cls,
        image: Image.Image,
        path: Path,
    ) -> str:
        """
        Detect the actual format using Pillow.

        Falls back to the filename extension only when Pillow does
        not provide a format.
        """

        detected = image.format

        if detected:
            try:
                return cls._normalize_format(detected)
            except UnsupportedFormatError:
                pass

        extension = path.suffix

        try:
            return cls._normalize_format(extension)
        except UnsupportedFormatError as exc:
            raise UnsupportedFormatError(
                f"Unable to determine supported image format "
                f"for: {path.name}"
            ) from exc

    # ==================================================================
    # Image Processing
    # ==================================================================

    @staticmethod
    def _resize_image(
        image: Image.Image,
        max_width: int | None,
        max_height: int | None,
    ) -> Image.Image:
        """Resize image while preserving aspect ratio."""

        if max_width is None and max_height is None:
            return image

        current_width, current_height = image.size

        if max_width is None:
            max_width = current_width

        if max_height is None:
            max_height = current_height

        if (
            current_width <= max_width
            and current_height <= max_height
        ):
            return image

        resized = image.copy()

        resized.thumbnail(
            (max_width, max_height),
            Image.Resampling.LANCZOS,
        )

        return resized

    @staticmethod
    def _has_transparency(
        image: Image.Image,
    ) -> bool:
        """Determine whether an image has transparency."""

        if image.mode in ("RGBA", "LA"):
            return True

        if image.mode == "P":
            return "transparency" in image.info

        return False

    def _prepare_image(
        self,
        image: Image.Image,
        target_format: str,
        background: str,
    ) -> Image.Image:
        """Prepare image mode for target format."""

        has_transparency = self._has_transparency(image)

        # --------------------------------------------------------------
        # JPEG
        # --------------------------------------------------------------

        if target_format == "JPEG":

            if has_transparency:

                if image.mode != "RGBA":
                    image = image.convert("RGBA")

                canvas = Image.new(
                    "RGB",
                    image.size,
                    background,
                )

                canvas.paste(
                    image,
                    mask=image.getchannel("A"),
                )

                return canvas

            if image.mode not in ("RGB", "L"):
                return image.convert("RGB")

        # --------------------------------------------------------------
        # PNG
        # --------------------------------------------------------------

        elif target_format == "PNG":

            if image.mode not in (
                "1",
                "L",
                "P",
                "RGB",
                "RGBA",
                "LA",
            ):
                return image.convert("RGBA")

        # --------------------------------------------------------------
        # WEBP
        # --------------------------------------------------------------

        elif target_format == "WEBP":

            if has_transparency:
                if image.mode != "RGBA":
                    return image.convert("RGBA")
            else:
                if image.mode not in (
                    "RGB",
                    "RGBA",
                    "L",
                ):
                    return image.convert("RGB")

        # --------------------------------------------------------------
        # BMP
        # --------------------------------------------------------------

        elif target_format == "BMP":

            # BMP support for alpha varies, so use RGB/RGBA only.
            if image.mode not in ("RGB", "RGBA", "L"):
                return image.convert("RGB")

        # --------------------------------------------------------------
        # TIFF
        # --------------------------------------------------------------

        elif target_format == "TIFF":

            if image.mode not in (
                "1",
                "L",
                "RGB",
                "RGBA",
                "CMYK",
            ):
                return image.convert("RGB")

        return image

    # ==================================================================
    # Save Configuration
    # ==================================================================

    @staticmethod
    def _build_save_options(
        target_format: str,
        quality: int,
    ) -> dict:
        """Build format-specific saving options."""

        if target_format == "JPEG":
            return {
                "quality": quality,
                "optimize": True,
                "progressive": True,
            }

        if target_format == "PNG":
            return {
                "optimize": True,
                "compress_level": 9,
            }

        if target_format == "WEBP":
            return {
                "quality": quality,
                "method": 6,
            }

        if target_format == "TIFF":
            return {
                "compression": "tiff_deflate",
            }

        if target_format == "BMP":
            return {}

        return {}

    # ==================================================================
    # Output Handling
    # ==================================================================

    @classmethod
    def _prepare_output_path(
        cls,
        input_file: Path,
        output_path: str | Path | None,
        output_format: str,
        overwrite: bool,
    ) -> Path:
        """Create a safe output path."""

        if output_path is not None:

            output = Path(output_path)

            output.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

        else:

            extension = cls.EXTENSIONS[output_format]

            output = (
                input_file.parent
                / f"{input_file.stem}_converted{extension}"
            )

        # Prevent accidental overwrite.
        if output.exists() and not overwrite:
            output = cls._find_available_path(output)

        return output

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
    def _validate_output(
        output_path: Path,
    ) -> None:
        """Validate the generated image."""

        if not output_path.exists():
            raise ImageConversionError(
                "Converted image was not created."
            )

        if output_path.stat().st_size == 0:
            raise ImageConversionError(
                "Converted image is empty."
            )

        try:
            with Image.open(output_path) as image:
                image.verify()

        except Exception as exc:
            raise ImageConversionError(
                f"Generated image failed validation: {exc}"
            ) from exc


# ======================================================================
# Convenience Functions
# ======================================================================

_default_converter = ImageConverter()


def convert_image(
    input_path: str | Path,
    output_format: str,
    output_path: str | Path | None = None,
    quality: int = ImageConverter.DEFAULT_QUALITY,
    max_width: int | None = None,
    max_height: int | None = None,
    background: str = "white",
    overwrite: bool = False,
) -> ConversionResult:
    """
    Convenience function for image conversion.
    """

    return _default_converter.convert(
        input_path=input_path,
        output_format=output_format,
        output_path=output_path,
        quality=quality,
        max_width=max_width,
        max_height=max_height,
        background=background,
        overwrite=overwrite,
    )
