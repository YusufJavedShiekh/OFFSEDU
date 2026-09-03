"""
StudyGemma - Image Compressor

Provides safe and configurable image compression with:

- JPEG, PNG, WEBP, BMP and TIFF support
- Quality control
- Optional resizing
- Aspect-ratio preservation
- Transparency preservation
- Output validation
- Compression statistics
- Safe output-file handling
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps


class ImageCompressionError(Exception):
    """Base exception for image compression errors."""


class InvalidImageError(ImageCompressionError):
    """Raised when an image cannot be opened or processed."""


class InvalidCompressionParameterError(ImageCompressionError):
    """Raised when compression parameters are invalid."""


@dataclass
class CompressionResult:
    """Contains the result and statistics of an image compression."""

    success: bool
    input_path: str
    output_path: Optional[str] = None
    original_size: int = 0
    compressed_size: int = 0
    space_saved: int = 0
    compression_percentage: float = 0.0
    original_dimensions: tuple[int, int] = (0, 0)
    output_dimensions: tuple[int, int] = (0, 0)
    original_format: Optional[str] = None
    output_format: Optional[str] = None
    quality: Optional[int] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert result to a dictionary."""

        return {
            "success": self.success,
            "input_path": self.input_path,
            "output_path": self.output_path,
            "original_size": self.original_size,
            "compressed_size": self.compressed_size,
            "space_saved": self.space_saved,
            "compression_percentage": self.compression_percentage,
            "original_dimensions": self.original_dimensions,
            "output_dimensions": self.output_dimensions,
            "original_format": self.original_format,
            "output_format": self.output_format,
            "quality": self.quality,
            "error": self.error,
        }


class ImageCompressor:
    """
    Image compression service for StudyGemma.

    The original image is never modified.
    """

    SUPPORTED_FORMATS = {
        "JPEG",
        "JPG",
        "PNG",
        "WEBP",
        "BMP",
        "TIFF",
        "TIF",
    }

    FORMAT_ALIASES = {
        "JPG": "JPEG",
        "TIF": "TIFF",
    }

    DEFAULT_QUALITY = 75
    MIN_QUALITY = 1
    MAX_QUALITY = 100

    def __init__(
        self,
        default_quality: int = DEFAULT_QUALITY,
    ):
        self._validate_quality(default_quality)
        self.default_quality = default_quality

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def compress(
        self,
        input_path: str | Path,
        output_path: str | Path | None = None,
        quality: int | None = None,
        max_width: int | None = None,
        max_height: int | None = None,
        output_format: str | None = None,
        overwrite: bool = False,
    ) -> CompressionResult:
        """
        Compress an image.

        Args:
            input_path:
                Path to the source image.

            output_path:
                Optional output path. If omitted, a compressed filename
                is generated automatically.

            quality:
                Compression quality from 1 to 100.

            max_width:
                Optional maximum output width.

            max_height:
                Optional maximum output height.

            output_format:
                Optional output format such as JPEG, PNG or WEBP.

            overwrite:
                Whether an existing output file may be replaced.

        Returns:
            CompressionResult
        """

        input_file = Path(input_path)

        quality = (
            self.default_quality
            if quality is None
            else quality
        )

        self._validate_input_path(input_file)
        self._validate_quality(quality)
        self._validate_dimensions(max_width, max_height)
        self._validate_overwrite(overwrite)

        created_output: Optional[Path] = None

        try:
            with Image.open(input_file) as source_image:
                original_format = self._normalize_format(
                    source_image.format or input_file.suffix
                )

                original_dimensions = source_image.size
                original_size = input_file.stat().st_size

                target_format = self._determine_output_format(
                    original_format,
                    output_format,
                )

                final_output = self._prepare_output_path(
                    input_file=input_file,
                    output_path=output_path,
                    output_format=target_format,
                    overwrite=overwrite,
                )

                if final_output.resolve() == input_file.resolve():
                    raise InvalidCompressionParameterError(
                        "Output path must be different from the input path."
                    )

                # Correct orientation according to EXIF metadata.
                image = ImageOps.exif_transpose(source_image)

                # Resize only when necessary.
                image = self._resize_image(
                    image,
                    max_width=max_width,
                    max_height=max_height,
                )

                # Prepare image according to target format.
                image = self._prepare_image_for_format(
                    image,
                    target_format,
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

                created_output = final_output

                # Validate generated output.
                self._validate_output(final_output)

                compressed_size = final_output.stat().st_size

                space_saved = max(
                    original_size - compressed_size,
                    0,
                )

                compression_percentage = (
                    (space_saved / original_size) * 100
                    if original_size > 0
                    else 0.0
                )

                return CompressionResult(
                    success=True,
                    input_path=str(input_file),
                    output_path=str(final_output),
                    original_size=original_size,
                    compressed_size=compressed_size,
                    space_saved=space_saved,
                    compression_percentage=round(
                        compression_percentage,
                        2,
                    ),
                    original_dimensions=original_dimensions,
                    output_dimensions=image.size,
                    original_format=original_format,
                    output_format=target_format,
                    quality=quality,
                )

        except ImageCompressionError:
            if created_output is not None:
                self._cleanup_output(created_output)
            raise

        except Exception as exc:
            if created_output is not None:
                self._cleanup_output(created_output)

            raise ImageCompressionError(
                f"Failed to compress image: {exc}"
            ) from exc

    def compress_to_target_size(
        self,
        input_path: str | Path,
        output_path: str | Path | None = None,
        target_size: int = 1024 * 1024,
        max_width: int | None = None,
        max_height: int | None = None,
        output_format: str | None = None,
        overwrite: bool = False,
    ) -> CompressionResult:
        """
        Attempt to compress an image below a target size in bytes.

        The method gradually reduces quality. If the requested target
        cannot be reached, the smallest successful result is returned.

        Args:
            input_path:
                Path to the source image.

            output_path:
                Optional output path.

            target_size:
                Desired maximum size in bytes.

            max_width:
                Optional maximum output width.

            max_height:
                Optional maximum output height.

            output_format:
                Optional output format.

            overwrite:
                Whether an existing output file may be replaced.

        Returns:
            CompressionResult
        """

        if isinstance(target_size, bool) or not isinstance(
            target_size,
            int,
        ):
            raise InvalidCompressionParameterError(
                "target_size must be an integer."
            )

        if target_size <= 0:
            raise InvalidCompressionParameterError(
                "target_size must be greater than zero."
            )

        input_file = Path(input_path)
        self._validate_input_path(input_file)
        self._validate_dimensions(max_width, max_height)
        self._validate_overwrite(overwrite)

        last_result: Optional[CompressionResult] = None

        # Quality values from high to low.
        for quality in range(90, 9, -10):
            result = self.compress(
                input_path=input_file,
                output_path=output_path,
                quality=quality,
                max_width=max_width,
                max_height=max_height,
                output_format=output_format,
                overwrite=True,
            )

            last_result = result

            if result.compressed_size <= target_size:
                return result

        if last_result is not None:
            return last_result

        raise ImageCompressionError(
            "Unable to compress image."
        )

    def get_image_info(
        self,
        input_path: str | Path,
    ) -> dict:
        """
        Return basic image information without modifying the image.
        """

        path = Path(input_path)
        self._validate_input_path(path)

        try:
            with Image.open(path) as image:
                file_size = path.stat().st_size

                return {
                    "path": str(path),
                    "filename": path.name,
                    "format": self._normalize_format(
                        image.format or path.suffix
                    ),
                    "width": image.width,
                    "height": image.height,
                    "dimensions": image.size,
                    "mode": image.mode,
                    "size": file_size,
                    "size_mb": round(
                        file_size / (1024 * 1024),
                        2,
                    ),
                    "has_transparency": self._has_transparency(
                        image
                    ),
                }

        except ImageCompressionError:
            raise

        except Exception as exc:
            raise InvalidImageError(
                f"Unable to read image information: {exc}"
            ) from exc

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_input_path(path: Path) -> None:
        """Validate input image path."""

        if not path.exists():
            raise InvalidImageError(
                f"Image does not exist: {path}"
            )

        if not path.is_file():
            raise InvalidImageError(
                f"Input path is not a file: {path}"
            )

        if not path.suffix:
            raise InvalidImageError(
                "Input image must have a file extension."
            )

    @classmethod
    def _validate_quality(cls, quality: int) -> None:
        """Validate compression quality."""

        if isinstance(quality, bool) or not isinstance(
            quality,
            int,
        ):
            raise InvalidCompressionParameterError(
                "quality must be an integer."
            )

        if not (
            cls.MIN_QUALITY
            <= quality
            <= cls.MAX_QUALITY
        ):
            raise InvalidCompressionParameterError(
                f"quality must be between "
                f"{cls.MIN_QUALITY} and {cls.MAX_QUALITY}."
            )

    @staticmethod
    def _validate_dimensions(
        max_width: int | None,
        max_height: int | None,
    ) -> None:
        """Validate optional dimensions."""

        if max_width is not None:
            if isinstance(max_width, bool) or not isinstance(
                max_width,
                int,
            ):
                raise InvalidCompressionParameterError(
                    "max_width must be an integer."
                )

            if max_width <= 0:
                raise InvalidCompressionParameterError(
                    "max_width must be greater than zero."
                )

        if max_height is not None:
            if isinstance(max_height, bool) or not isinstance(
                max_height,
                int,
            ):
                raise InvalidCompressionParameterError(
                    "max_height must be an integer."
                )

            if max_height <= 0:
                raise InvalidCompressionParameterError(
                    "max_height must be greater than zero."
                )

    @staticmethod
    def _validate_overwrite(overwrite: bool) -> None:
        """Validate overwrite parameter."""

        if not isinstance(overwrite, bool):
            raise InvalidCompressionParameterError(
                "overwrite must be a boolean."
            )

    # ------------------------------------------------------------------
    # Format handling
    # ------------------------------------------------------------------

    @classmethod
    def _normalize_format(
        cls,
        image_format: str,
    ) -> str:
        """Normalize image format."""

        if image_format is None:
            raise InvalidImageError(
                "Image format could not be determined."
            )

        normalized = str(image_format).strip().upper()

        if normalized.startswith("."):
            normalized = normalized[1:]

        normalized = cls.FORMAT_ALIASES.get(
            normalized,
            normalized,
        )

        if normalized not in cls.SUPPORTED_FORMATS:
            raise InvalidImageError(
                f"Unsupported image format: {normalized}"
            )

        return normalized

    @classmethod
    def _determine_output_format(
        cls,
        original_format: str,
        output_format: str | None,
    ) -> str:
        """Determine output image format."""

        if output_format is None:
            return cls._normalize_format(original_format)

        return cls._normalize_format(output_format)

    # ------------------------------------------------------------------
    # Image processing
    # ------------------------------------------------------------------

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
        """Check whether an image contains transparency."""

        if image.mode in ("RGBA", "LA"):
            return True

        if image.mode == "P":
            return "transparency" in image.info

        return False

    def _prepare_image_for_format(
        self,
        image: Image.Image,
        output_format: str,
    ) -> Image.Image:
        """
        Prepare image mode for the target format.
        """

        has_transparency = self._has_transparency(image)

        if output_format == "JPEG":
            # JPEG does not support transparency.
            if has_transparency:
                background = Image.new(
                    "RGB",
                    image.size,
                    "white",
                )

                if image.mode != "RGBA":
                    image = image.convert("RGBA")

                background.paste(
                    image,
                    mask=image.getchannel("A"),
                )

                return background

            if image.mode not in ("RGB", "L"):
                return image.convert("RGB")

        elif output_format == "PNG":
            if image.mode not in (
                "1",
                "L",
                "P",
                "RGB",
                "RGBA",
                "LA",
            ):
                return image.convert("RGBA")

        elif output_format == "WEBP":
            if has_transparency and image.mode != "RGBA":
                return image.convert("RGBA")

            if not has_transparency and image.mode not in (
                "RGB",
                "RGBA",
                "L",
            ):
                return image.convert("RGB")

        elif output_format in ("BMP", "TIFF"):
            if image.mode not in (
                "RGB",
                "RGBA",
                "L",
            ):
                return image.convert("RGB")

        return image

    # ------------------------------------------------------------------
    # Saving
    # ------------------------------------------------------------------

    @staticmethod
    def _build_save_options(
        output_format: str,
        quality: int,
    ) -> dict:
        """Build format-specific save options."""

        if output_format == "JPEG":
            return {
                "quality": quality,
                "optimize": True,
                "progressive": True,
            }

        if output_format == "PNG":
            # PNG uses lossless compression.
            return {
                "optimize": True,
                "compress_level": 9,
            }

        if output_format == "WEBP":
            return {
                "quality": quality,
                "method": 6,
            }

        if output_format == "TIFF":
            return {
                "compression": "tiff_deflate",
            }

        if output_format == "BMP":
            return {}

        return {}

    @staticmethod
    def _prepare_output_path(
        input_file: Path,
        output_path: str | Path | None,
        output_format: str,
        overwrite: bool,
    ) -> Path:
        """Create a safe output path."""

        if output_path is not None:
            output = Path(output_path)

            try:
                output.parent.mkdir(
                    parents=True,
                    exist_ok=True,
                )
            except OSError as exc:
                raise ImageCompressionError(
                    f"Unable to create output directory: "
                    f"{output.parent}"
                ) from exc

        else:
            suffix = {
                "JPEG": ".jpg",
                "PNG": ".png",
                "WEBP": ".webp",
                "BMP": ".bmp",
                "TIFF": ".tiff",
            }.get(
                output_format,
                input_file.suffix,
            )

            output = (
                input_file.parent
                / f"{input_file.stem}_compressed{suffix}"
            )

        if output.exists() and not overwrite:
            output = ImageCompressor._find_available_path(
                output
            )

        return output

    @staticmethod
    def _find_available_path(path: Path) -> Path:
        """Generate a non-conflicting output filename."""

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
            raise ImageCompressionError(
                "Compressed image was not created."
            )

        if not output_path.is_file():
            raise ImageCompressionError(
                "Compressed output is not a file."
            )

        if output_path.stat().st_size == 0:
            raise ImageCompressionError(
                "Compressed image is empty."
            )

        try:
            with Image.open(output_path) as image:
                image.verify()

        except Exception as exc:
            raise ImageCompressionError(
                f"Generated image failed validation: {exc}"
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
            # Cleanup failure should not hide the original error.
            pass


# ----------------------------------------------------------------------
# Convenience function
# ----------------------------------------------------------------------

_default_compressor = ImageCompressor()


def compress_image(
    input_path: str | Path,
    output_path: str | Path | None = None,
    quality: int = ImageCompressor.DEFAULT_QUALITY,
    max_width: int | None = None,
    max_height: int | None = None,
    output_format: str | None = None,
    overwrite: bool = False,
) -> CompressionResult:
    """
    Convenience function for image compression.
    """

    return _default_compressor.compress(
        input_path=input_path,
        output_path=output_path,
        quality=quality,
        max_width=max_width,
        max_height=max_height,
        output_format=output_format,
        overwrite=overwrite,
    )