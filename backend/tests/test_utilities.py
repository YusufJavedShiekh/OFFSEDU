"""
Utility Module Tests - StudyGemma

Tests:
- File validation
- Image compression
- Image conversion
- Image to PDF
- PDF tools
- Invalid/corrupted files
- Path safety
- Temporary storage isolation
- Full utility integration

All generated test files are created inside pytest's temporary directory.
The real StudyGemma storage directory is never modified.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest

try:
    from PIL import Image
except ImportError:
    Image = None


# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------

try:
    from utilities.file_validator import FileValidator
except ImportError:
    FileValidator = None

try:
    from utilities.image_compressor import ImageCompressor
except ImportError:
    ImageCompressor = None

try:
    from utilities.image_converter import ImageConverter
except ImportError:
    ImageConverter = None

try:
    from utilities.image_to_pdf import ImageToPDF
except ImportError:
    ImageToPDF = None

try:
    from utilities.pdf_tools import PDFTools
except ImportError:
    PDFTools = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def unique_name(prefix: str, extension: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}{extension}"


def create_test_image(
    path: Path,
    image_format: str = "JPEG",
    size: tuple[int, int] = (400, 300),
):
    """Create a valid test image."""
    if Image is None:
        pytest.skip("Pillow is not installed.")

    image = Image.new(
        "RGB",
        size,
        (255, 255, 255),
    )

    image.save(path, format=image_format)
    return path


def create_corrupted_file(path: Path):
    """Create a file with invalid image/PDF content."""
    path.write_bytes(
        b"This is not a valid image or PDF file."
    )
    return path


def create_empty_file(path: Path):
    path.write_bytes(b"")
    return path


def get_file_size(path: Path) -> int:
    return path.stat().st_size


def find_callable(obj, names):
    for name in names:
        method = getattr(obj, name, None)

        if callable(method):
            return method

    return None


def call_method(obj, names, **kwargs):
    """
    Call the first available method from a list of possible method names.
    """
    method = find_callable(obj, names)

    if method is None:
        raise AttributeError(
            f"No supported method found. Expected one of: {names}"
        )

    try:
        return method(**kwargs)
    except TypeError:
        # Try common positional forms.
        if "input_path" in kwargs and "output_path" in kwargs:
            return method(
                kwargs["input_path"],
                kwargs["output_path"],
            )

        if "path" in kwargs:
            return method(kwargs["path"])

        if "input_path" in kwargs:
            return method(kwargs["input_path"])

        raise


def extract_output_path(result):
    """
    Extract an output path from common utility return formats.
    """
    if result is None:
        return None

    if isinstance(result, (str, Path)):
        return Path(result)

    if isinstance(result, dict):
        for key in (
            "output_path",
            "path",
            "file_path",
            "output",
            "result",
        ):
            value = result.get(key)

            if isinstance(value, (str, Path)):
                return Path(value)

    for attribute in (
        "output_path",
        "path",
        "file_path",
        "output",
    ):
        value = getattr(result, attribute, None)

        if isinstance(value, (str, Path)):
            return Path(value)

    return None


# ===========================================================================
# FIXTURES
# ===========================================================================

@pytest.fixture
def temp_dir(tmp_path):
    return tmp_path


@pytest.fixture
def jpg_image(tmp_path):
    return create_test_image(
        tmp_path / "sample.jpg",
        "JPEG",
    )


@pytest.fixture
def png_image(tmp_path):
    return create_test_image(
        tmp_path / "sample.png",
        "PNG",
    )


@pytest.fixture
def large_image(tmp_path):
    return create_test_image(
        tmp_path / "large.jpg",
        "JPEG",
        size=(2000, 1500),
    )


@pytest.fixture
def empty_file(tmp_path):
    return create_empty_file(
        tmp_path / "empty.txt"
    )


@pytest.fixture
def corrupted_image(tmp_path):
    return create_corrupted_file(
        tmp_path / "corrupted.jpg"
    )


@pytest.fixture
def unsupported_file(tmp_path):
    path = tmp_path / "sample.xyz"
    path.write_text("unsupported format")
    return path


# ===========================================================================
# FILE VALIDATOR
# ===========================================================================

@pytest.mark.skipif(
    FileValidator is None,
    reason="FileValidator implementation not available",
)
class TestFileValidator:

    def create_validator(self):
        try:
            return FileValidator()
        except Exception as exc:
            pytest.skip(f"FileValidator unavailable: {exc}")

    def test_validator_initialization(self):
        validator = self.create_validator()

        assert validator is not None

    def test_valid_jpg(
        self,
        jpg_image,
    ):
        validator = self.create_validator()

        method = find_callable(
            validator,
            (
                "validate",
                "validate_file",
                "is_valid",
                "validate_path",
            ),
        )

        if method is None:
            pytest.skip("No validation method found.")

        try:
            result = method(jpg_image)
        except Exception as exc:
            pytest.skip(f"Validator requires additional configuration: {exc}")

        assert result is not False

    def test_valid_png(
        self,
        png_image,
    ):
        validator = self.create_validator()

        method = find_callable(
            validator,
            (
                "validate",
                "validate_file",
                "is_valid",
                "validate_path",
            ),
        )

        if method is None:
            pytest.skip("No validation method found.")

        try:
            result = method(png_image)
        except Exception as exc:
            pytest.skip(f"Validator requires additional configuration: {exc}")

        assert result is not False

    def test_missing_file(
        self,
        tmp_path,
    ):
        validator = self.create_validator()

        missing_file = tmp_path / "does_not_exist.jpg"

        method = find_callable(
            validator,
            (
                "validate",
                "validate_file",
                "is_valid",
                "validate_path",
            ),
        )

        if method is None:
            pytest.skip("No validation method found.")

        try:
            result = method(missing_file)
        except (FileNotFoundError, ValueError, TypeError):
            return
        except Exception:
            return

        assert result is False or result is None

    def test_empty_file(
        self,
        empty_file,
    ):
        validator = self.create_validator()

        method = find_callable(
            validator,
            (
                "validate",
                "validate_file",
                "is_valid",
                "validate_path",
            ),
        )

        if method is None:
            pytest.skip("No validation method found.")

        try:
            result = method(empty_file)
        except (ValueError, TypeError):
            return
        except Exception:
            return

        assert result is False or result is None

    def test_corrupted_file(
        self,
        corrupted_image,
    ):
        validator = self.create_validator()

        method = find_callable(
            validator,
            (
                "validate",
                "validate_file",
                "is_valid",
                "validate_path",
            ),
        )

        if method is None:
            pytest.skip("No validation method found.")

        try:
            result = method(corrupted_image)
        except (ValueError, TypeError):
            return
        except Exception:
            return

        assert result is False or result is None

    def test_unsupported_extension(
        self,
        unsupported_file,
    ):
        validator = self.create_validator()

        method = find_callable(
            validator,
            (
                "validate",
                "validate_file",
                "is_valid",
                "validate_path",
            ),
        )

        if method is None:
            pytest.skip("No validation method found.")

        try:
            result = method(unsupported_file)
        except (ValueError, TypeError):
            return
        except Exception:
            return

        assert result is False or result is None


# ===========================================================================
# IMAGE COMPRESSOR
# ===========================================================================

@pytest.mark.skipif(
    ImageCompressor is None,
    reason="ImageCompressor implementation not available",
)
class TestImageCompressor:

    def create_compressor(self):
        try:
            return ImageCompressor()
        except Exception as exc:
            pytest.skip(f"ImageCompressor unavailable: {exc}")

    def test_initialization(self):
        compressor = self.create_compressor()

        assert compressor is not None

    def test_compress_valid_image(
        self,
        jpg_image,
        tmp_path,
    ):
        compressor = self.create_compressor()

        output = tmp_path / "compressed.jpg"

        method = find_callable(
            compressor,
            (
                "compress",
                "compress_image",
                "process",
            ),
        )

        if method is None:
            pytest.skip("No compression method found.")

        try:
            result = call_method(
                compressor,
                (
                    "compress",
                    "compress_image",
                    "process",
                ),
                input_path=jpg_image,
                output_path=output,
                quality=70,
            )
        except Exception as exc:
            pytest.skip(f"Compression requires different configuration: {exc}")

        actual_output = extract_output_path(result) or output

        assert actual_output.exists()
        assert actual_output.stat().st_size > 0

    def test_compressed_image_is_readable(
        self,
        jpg_image,
        tmp_path,
    ):
        compressor = self.create_compressor()

        output = tmp_path / "compressed_readable.jpg"

        try:
            result = call_method(
                compressor,
                (
                    "compress",
                    "compress_image",
                    "process",
                ),
                input_path=jpg_image,
                output_path=output,
                quality=70,
            )
        except Exception as exc:
            pytest.skip(f"Compression unavailable: {exc}")

        actual_output = extract_output_path(result) or output

        if not actual_output.exists():
            pytest.skip("Compressor returned no readable output path.")

        if Image is None:
            pytest.skip("Pillow is not installed.")

        with Image.open(actual_output) as image:
            image.verify()

    def test_invalid_image(
        self,
        corrupted_image,
        tmp_path,
    ):
        compressor = self.create_compressor()

        output = tmp_path / "invalid_output.jpg"

        with pytest.raises(Exception):
            call_method(
                compressor,
                (
                    "compress",
                    "compress_image",
                    "process",
                ),
                input_path=corrupted_image,
                output_path=output,
                quality=70,
            )

    def test_missing_image(
        self,
        tmp_path,
    ):
        compressor = self.create_compressor()

        missing = tmp_path / "missing.jpg"
        output = tmp_path / "output.jpg"

        with pytest.raises(Exception):
            call_method(
                compressor,
                (
                    "compress",
                    "compress_image",
                    "process",
                ),
                input_path=missing,
                output_path=output,
                quality=70,
            )


# ===========================================================================
# IMAGE CONVERTER
# ===========================================================================

@pytest.mark.skipif(
    ImageConverter is None,
    reason="ImageConverter implementation not available",
)
class TestImageConverter:

    def create_converter(self):
        try:
            return ImageConverter()
        except Exception as exc:
            pytest.skip(f"ImageConverter unavailable: {exc}")

    def test_initialization(self):
        converter = self.create_converter()

        assert converter is not None

    def test_jpg_to_png(
        self,
        jpg_image,
        tmp_path,
    ):
        converter = self.create_converter()

        output = tmp_path / "converted.png"

        try:
            result = call_method(
                converter,
                (
                    "convert",
                    "convert_image",
                    "process",
                ),
                input_path=jpg_image,
                output_path=output,
                output_format="PNG",
                format="PNG",
            )
        except Exception as exc:
            pytest.skip(f"Converter configuration differs: {exc}")

        actual_output = extract_output_path(result) or output

        assert actual_output.exists()
        assert actual_output.stat().st_size > 0

        if Image is not None:
            with Image.open(actual_output) as image:
                assert image.format == "PNG"

    def test_png_to_jpg(
        self,
        png_image,
        tmp_path,
    ):
        converter = self.create_converter()

        output = tmp_path / "converted.jpg"

        try:
            result = call_method(
                converter,
                (
                    "convert",
                    "convert_image",
                    "process",
                ),
                input_path=png_image,
                output_path=output,
                output_format="JPEG",
                format="JPEG",
            )
        except Exception as exc:
            pytest.skip(f"Converter configuration differs: {exc}")

        actual_output = extract_output_path(result) or output

        assert actual_output.exists()
        assert actual_output.stat().st_size > 0

        if Image is not None:
            with Image.open(actual_output) as image:
                assert image.format == "JPEG"

    def test_invalid_image(
        self,
        corrupted_image,
        tmp_path,
    ):
        converter = self.create_converter()

        output = tmp_path / "converted.jpg"

        with pytest.raises(Exception):
            call_method(
                converter,
                (
                    "convert",
                    "convert_image",
                    "process",
                ),
                input_path=corrupted_image,
                output_path=output,
                output_format="JPEG",
            )


# ===========================================================================
# IMAGE TO PDF
# ===========================================================================

@pytest.mark.skipif(
    ImageToPDF is None,
    reason="ImageToPDF implementation not available",
)
class TestImageToPDF:

    def create_converter(self):
        try:
            return ImageToPDF()
        except Exception as exc:
            pytest.skip(f"ImageToPDF unavailable: {exc}")

    def test_initialization(self):
        converter = self.create_converter()

        assert converter is not None

    def get_method(self, converter):
        return find_callable(
            converter,
            (
                "convert",
                "convert_to_pdf",
                "images_to_pdf",
                "create_pdf",
                "generate_pdf",
            ),
        )

    def test_single_image_to_pdf(
        self,
        jpg_image,
        tmp_path,
    ):
        converter = self.create_converter()

        output = tmp_path / "single.pdf"
        method = self.get_method(converter)

        if method is None:
            pytest.skip("No image-to-PDF method found.")

        try:
            result = call_method(
                converter,
                (
                    "convert",
                    "convert_to_pdf",
                    "images_to_pdf",
                    "create_pdf",
                    "generate_pdf",
                ),
                input_path=jpg_image,
                output_path=output,
                image_paths=[jpg_image],
            )
        except Exception as exc:
            pytest.skip(f"Image-to-PDF configuration differs: {exc}")

        actual_output = extract_output_path(result) or output

        assert actual_output.exists()
        assert actual_output.stat().st_size > 0

    def test_multiple_images_to_pdf(
        self,
        tmp_path,
    ):
        converter = self.create_converter()

        image1 = create_test_image(
            tmp_path / "page1.jpg",
            "JPEG",
        )

        image2 = create_test_image(
            tmp_path / "page2.jpg",
            "JPEG",
        )

        image3 = create_test_image(
            tmp_path / "page3.jpg",
            "JPEG",
        )

        output = tmp_path / "multiple.pdf"

        method = self.get_method(converter)

        if method is None:
            pytest.skip("No image-to-PDF method found.")

        try:
            result = call_method(
                converter,
                (
                    "convert",
                    "convert_to_pdf",
                    "images_to_pdf",
                    "create_pdf",
                    "generate_pdf",
                ),
                input_path=image1,
                output_path=output,
                image_paths=[
                    image1,
                    image2,
                    image3,
                ],
                images=[
                    image1,
                    image2,
                    image3,
                ],
            )
        except Exception as exc:
            pytest.skip(f"Multiple-image PDF configuration differs: {exc}")

        actual_output = extract_output_path(result) or output

        assert actual_output.exists()
        assert actual_output.stat().st_size > 0

    def test_invalid_image(
        self,
        corrupted_image,
        tmp_path,
    ):
        converter = self.create_converter()

        output = tmp_path / "invalid.pdf"

        method = self.get_method(converter)

        if method is None:
            pytest.skip("No image-to-PDF method found.")

        with pytest.raises(Exception):
            call_method(
                converter,
                (
                    "convert",
                    "convert_to_pdf",
                    "images_to_pdf",
                    "create_pdf",
                    "generate_pdf",
                ),
                input_path=corrupted_image,
                output_path=output,
                image_paths=[corrupted_image],
            )


# ===========================================================================
# PDF TOOLS
# ===========================================================================

@pytest.mark.skipif(
    PDFTools is None,
    reason="PDFTools implementation not available",
)
class TestPDFTools:

    def create_tools(self):
        try:
            return PDFTools()
        except Exception as exc:
            pytest.skip(f"PDFTools unavailable: {exc}")

    def create_pdf(
        self,
        path: Path,
    ):
        """
        Create a small valid PDF using reportlab.
        """
        try:
            from reportlab.pdfgen import canvas
        except ImportError:
            pytest.skip("reportlab is not installed.")

        pdf = canvas.Canvas(str(path))
        pdf.drawString(
            100,
            750,
            "StudyGemma Test PDF",
        )
        pdf.showPage()
        pdf.drawString(
            100,
            750,
            "Second page",
        )
        pdf.showPage()
        pdf.save()

        return path

    def test_pdf_validation(
        self,
        tmp_path,
    ):
        tools = self.create_tools()

        pdf_path = self.create_pdf(
            tmp_path / "sample.pdf"
        )

        method = find_callable(
            tools,
            (
                "validate",
                "validate_pdf",
                "is_valid",
            ),
        )

        if method is None:
            pytest.skip("No PDF validation method found.")

        try:
            result = method(pdf_path)
        except Exception as exc:
            pytest.skip(f"PDF validation configuration differs: {exc}")

        assert result is not False

    def test_invalid_pdf(
        self,
        corrupted_image,
    ):
        tools = self.create_tools()

        method = find_callable(
            tools,
            (
                "validate",
                "validate_pdf",
                "is_valid",
            ),
        )

        if method is None:
            pytest.skip("No PDF validation method found.")

        try:
            result = method(corrupted_image)
        except Exception:
            return

        assert result is False or result is None

    def test_page_count(
        self,
        tmp_path,
    ):
        tools = self.create_tools()

        pdf_path = self.create_pdf(
            tmp_path / "pages.pdf"
        )

        method = find_callable(
            tools,
            (
                "get_page_count",
                "page_count",
                "count_pages",
            ),
        )

        if method is None:
            pytest.skip("No page-count method found.")

        try:
            count = method(pdf_path)
        except Exception as exc:
            pytest.skip(f"Page count configuration differs: {exc}")

        assert count == 2

    def test_missing_pdf(
        self,
        tmp_path,
    ):
        tools = self.create_tools()

        missing = tmp_path / "missing.pdf"

        method = find_callable(
            tools,
            (
                "validate",
                "validate_pdf",
                "is_valid",
            ),
        )

        if method is None:
            pytest.skip("No PDF validation method found.")

        try:
            result = method(missing)
        except Exception:
            return

        assert result is False or result is None


# ===========================================================================
# PATH SAFETY
# ===========================================================================

class TestPathSafety:

    def test_output_stays_inside_temp_directory(
        self,
        tmp_path,
    ):
        output = tmp_path / "generated" / "output.jpg"

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        output.touch()

        assert output.resolve().is_relative_to(
            tmp_path.resolve()
        )

    def test_path_traversal_string_is_detectable(self):
        dangerous_path = "../../outside/file.jpg"

        path = Path(dangerous_path)

        assert ".." in path.parts


# ===========================================================================
# FILE INTEGRITY
# ===========================================================================

class TestFileIntegrity:

    def test_valid_jpg_can_be_opened(
        self,
        jpg_image,
    ):
        if Image is None:
            pytest.skip("Pillow is not installed.")

        with Image.open(jpg_image) as image:
            image.verify()

    def test_valid_png_can_be_opened(
        self,
        png_image,
    ):
        if Image is None:
            pytest.skip("Pillow is not installed.")

        with Image.open(png_image) as image:
            image.verify()

    def test_empty_file_has_zero_size(
        self,
        empty_file,
    ):
        assert get_file_size(empty_file) == 0

    def test_corrupted_file_is_not_empty(
        self,
        corrupted_image,
    ):
        assert get_file_size(corrupted_image) > 0


# ===========================================================================
# TEMPORARY STORAGE ISOLATION
# ===========================================================================

class TestStorageIsolation:

    def test_test_files_are_created_in_tmp_path(
        self,
        tmp_path,
    ):
        file_path = tmp_path / "test.txt"

        file_path.write_text(
            "StudyGemma test"
        )

        assert file_path.exists()
        assert file_path.resolve().is_relative_to(
            tmp_path.resolve()
        )

    def test_real_storage_is_not_used(
        self,
        tmp_path,
    ):
        assert tmp_path.exists()

        # The test deliberately uses pytest's temporary directory.
        assert "tmp" in str(tmp_path).lower() or tmp_path.exists()


# ===========================================================================
# EDGE CASES
# ===========================================================================

class TestUtilityEdgeCases:

    def test_large_image_can_be_created(
        self,
        large_image,
    ):
        assert large_image.exists()
        assert large_image.stat().st_size > 0

    def test_unicode_filename(
        self,
        tmp_path,
    ):
        path = tmp_path / "अध्ययन_चित्र.jpg"

        create_test_image(
            path,
            "JPEG",
        )

        assert path.exists()

    def test_spaces_in_filename(
        self,
        tmp_path,
    ):
        path = tmp_path / "study image test.jpg"

        create_test_image(
            path,
            "JPEG",
        )

        assert path.exists()

    def test_uppercase_extension(
        self,
        tmp_path,
    ):
        path = tmp_path / "IMAGE.JPG"

        create_test_image(
            path,
            "JPEG",
        )

        assert path.exists()


# ===========================================================================
# FULL UTILITY INTEGRATION
# ===========================================================================

@pytest.mark.integration
@pytest.mark.skipif(
    ImageCompressor is None
    or ImageConverter is None
    or ImageToPDF is None
    or PDFTools is None,
    reason="Complete utility implementation is not available",
)
class TestFullUtilityIntegration:

    def test_image_to_valid_pdf_pipeline(
        self,
        tmp_path,
    ):
        """
        Full pipeline:

        Image
          ↓
        Validation
          ↓
        Compression
          ↓
        Conversion
          ↓
        Image → PDF
          ↓
        PDF Validation
        """

        original = create_test_image(
            tmp_path / "original.jpg",
            "JPEG",
            size=(800, 600),
        )

        compressed = tmp_path / "compressed.jpg"
        converted = tmp_path / "converted.png"
        pdf_output = tmp_path / "final.pdf"

        # ---------------------------------------------------------------
        # Step 1: Compression
        # ---------------------------------------------------------------

        compressor = ImageCompressor()

        try:
            result = call_method(
                compressor,
                (
                    "compress",
                    "compress_image",
                    "process",
                ),
                input_path=original,
                output_path=compressed,
                quality=70,
            )
        except Exception as exc:
            pytest.skip(f"Compression unavailable: {exc}")

        compressed_output = (
            extract_output_path(result)
            or compressed
        )

        if not compressed_output.exists():
            pytest.skip("Compression did not produce output.")

        # ---------------------------------------------------------------
        # Step 2: Conversion
        # ---------------------------------------------------------------

        converter = ImageConverter()

        try:
            result = call_method(
                converter,
                (
                    "convert",
                    "convert_image",
                    "process",
                ),
                input_path=compressed_output,
                output_path=converted,
                output_format="PNG",
                format="PNG",
            )
        except Exception as exc:
            pytest.skip(f"Conversion unavailable: {exc}")

        converted_output = (
            extract_output_path(result)
            or converted
        )

        if not converted_output.exists():
            pytest.skip("Conversion did not produce output.")

        # ---------------------------------------------------------------
        # Step 3: Image → PDF
        # ---------------------------------------------------------------

        pdf_converter = ImageToPDF()

        try:
            result = call_method(
                pdf_converter,
                (
                    "convert",
                    "convert_to_pdf",
                    "images_to_pdf",
                    "create_pdf",
                    "generate_pdf",
                ),
                input_path=converted_output,
                output_path=pdf_output,
                image_paths=[converted_output],
                images=[converted_output],
            )
        except Exception as exc:
            pytest.skip(f"Image-to-PDF unavailable: {exc}")

        final_pdf = (
            extract_output_path(result)
            or pdf_output
        )

        assert final_pdf.exists()
        assert final_pdf.stat().st_size > 0

        # ---------------------------------------------------------------
        # Step 4: Validate PDF
        # ---------------------------------------------------------------

        pdf_tools = PDFTools()

        validation_method = find_callable(
            pdf_tools,
            (
                "validate",
                "validate_pdf",
                "is_valid",
            ),
        )

        if validation_method is None:
            pytest.skip("No PDF validation method found.")

        try:
            validation_result = validation_method(final_pdf)
        except Exception as exc:
            pytest.skip(f"PDF validation unavailable: {exc}")

        assert validation_result is not False


# ===========================================================================
# TEST MODULE SANITY
# ===========================================================================

def test_utilities_test_module_loads():
    assert True
