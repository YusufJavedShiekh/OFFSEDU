"""
StudyGemma - File Validator

Validates uploaded files before they are processed by
document processors or utility services.
"""

from __future__ import annotations

import mimetypes
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, Optional, Set


class FileValidationError(Exception):
    """Base exception for file validation errors."""


class UnsupportedFileTypeError(FileValidationError):
    """Raised when a file type is not supported."""


class FileSizeError(FileValidationError):
    """Raised when a file exceeds the allowed size."""


class UnsafeFilenameError(FileValidationError):
    """Raised when a filename is unsafe."""


@dataclass
class ValidationResult:
    """Result returned after validating a file."""

    valid: bool
    file_path: Optional[str] = None
    filename: Optional[str] = None
    extension: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: int = 0
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert validation result to a dictionary."""
        return {
            "valid": self.valid,
            "file_path": self.file_path,
            "filename": self.filename,
            "extension": self.extension,
            "mime_type": self.mime_type,
            "file_size": self.file_size,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class FileValidator:
    """
    Validates files used by StudyGemma.

    The validator performs:
    - existence checks
    - file checks
    - empty-file checks
    - extension checks
    - filename safety checks
    - file-size checks
    - MIME-type detection
    """

    DEFAULT_ALLOWED_EXTENSIONS: Set[str] = {
        ".pdf",
        ".docx",
        ".pptx",
        ".txt",
        ".md",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".gif",
        ".tiff",
        ".tif",
    }

    DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

    # Characters that should not appear in uploaded filenames.
    UNSAFE_FILENAME_PATTERN = re.compile(r'[<>:"/\\|?*\x00-\x1f]')

    def __init__(
        self,
        allowed_extensions: Optional[Iterable[str]] = None,
        max_file_size: int = DEFAULT_MAX_FILE_SIZE,
    ):
        """
        Initialize the validator.

        Args:
            allowed_extensions:
                Iterable of allowed extensions such as [".pdf", ".docx"].
            max_file_size:
                Maximum allowed file size in bytes.
        """

        extensions = (
            allowed_extensions
            if allowed_extensions is not None
            else self.DEFAULT_ALLOWED_EXTENSIONS
        )

        self.allowed_extensions = {
            self._normalize_extension(extension)
            for extension in extensions
        }

        if max_file_size <= 0:
            raise ValueError("max_file_size must be greater than zero.")

        self.max_file_size = max_file_size

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def validate(
        self,
        file_path: str | Path,
        raise_on_error: bool = False,
    ) -> ValidationResult:
        """
        Validate a file.

        Args:
            file_path:
                Path to the file.
            raise_on_error:
                If True, raise FileValidationError when validation fails.

        Returns:
            ValidationResult
        """

        path = Path(file_path)

        result = ValidationResult(
            valid=False,
            file_path=str(path),
            filename=path.name,
            extension=path.suffix.lower(),
        )

        # --------------------------------------------------------------
        # Existence
        # --------------------------------------------------------------

        if not path.exists():
            result.errors.append("File does not exist.")
            return self._finish(result, raise_on_error)

        if not path.is_file():
            result.errors.append("The provided path is not a file.")
            return self._finish(result, raise_on_error)

        # --------------------------------------------------------------
        # Filename
        # --------------------------------------------------------------

        try:
            self.validate_filename(path.name)
        except UnsafeFilenameError as exc:
            result.errors.append(str(exc))

        # --------------------------------------------------------------
        # File size
        # --------------------------------------------------------------

        try:
            file_size = path.stat().st_size
            result.file_size = file_size
        except OSError as exc:
            result.errors.append(f"Unable to read file information: {exc}")
            return self._finish(result, raise_on_error)

        if file_size == 0:
            result.errors.append("File is empty.")

        if file_size > self.max_file_size:
            result.errors.append(
                f"File size ({self._format_size(file_size)}) exceeds "
                f"the maximum allowed size "
                f"({self._format_size(self.max_file_size)})."
            )

        # --------------------------------------------------------------
        # Extension
        # --------------------------------------------------------------

        extension = path.suffix.lower()

        if not extension:
            result.errors.append("File has no extension.")
        elif extension not in self.allowed_extensions:
            result.errors.append(
                f"Unsupported file extension: {extension}"
            )

        # --------------------------------------------------------------
        # MIME type
        # --------------------------------------------------------------

        mime_type, _ = mimetypes.guess_type(path.name)
        result.mime_type = mime_type

        if mime_type is None:
            result.warnings.append(
                "Could not determine MIME type from the filename."
            )

        # --------------------------------------------------------------
        # Readability
        # --------------------------------------------------------------

        try:
            with path.open("rb") as file:
                file.read(1)
        except (OSError, PermissionError) as exc:
            result.errors.append(
                f"File cannot be read: {exc}"
            )

        return self._finish(result, raise_on_error)

    def is_valid(self, file_path: str | Path) -> bool:
        """
        Return True if the file passes validation.
        """
        return self.validate(file_path).valid

    def validate_filename(self, filename: str) -> bool:
        """
        Validate filename safety.

        Returns:
            True if the filename is safe.

        Raises:
            UnsafeFilenameError
        """

        if not filename or not filename.strip():
            raise UnsafeFilenameError("Filename cannot be empty.")

        if filename in {".", ".."}:
            raise UnsafeFilenameError("Invalid filename.")

        if self.UNSAFE_FILENAME_PATTERN.search(filename):
            raise UnsafeFilenameError(
                "Filename contains unsafe characters."
            )

        if ".." in filename:
            raise UnsafeFilenameError(
                "Filename contains an unsafe path traversal sequence."
            )

        return True

    def validate_extension(self, file_path: str | Path) -> bool:
        """
        Check whether the file extension is supported.
        """

        extension = Path(file_path).suffix.lower()

        return extension in self.allowed_extensions

    def validate_size(self, file_path: str | Path) -> bool:
        """
        Check whether the file is within the configured size limit.
        """

        path = Path(file_path)

        if not path.exists() or not path.is_file():
            return False

        try:
            return path.stat().st_size <= self.max_file_size
        except OSError:
            return False

    def get_file_info(self, file_path: str | Path) -> Dict:
        """
        Return basic information about a file.
        """

        path = Path(file_path)

        if not path.exists() or not path.is_file():
            raise FileValidationError("File does not exist or is not a file.")

        size = path.stat().st_size
        mime_type, _ = mimetypes.guess_type(path.name)

        return {
            "filename": path.name,
            "extension": path.suffix.lower(),
            "mime_type": mime_type,
            "size": size,
            "size_human": self._format_size(size),
            "absolute_path": str(path.resolve()),
        }

    def get_allowed_extensions(self) -> list[str]:
        """
        Return supported extensions.
        """
        return sorted(self.allowed_extensions)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _finish(
        self,
        result: ValidationResult,
        raise_on_error: bool,
    ) -> ValidationResult:
        """Finalize validation result."""

        result.valid = len(result.errors) == 0

        if not result.valid and raise_on_error:
            message = "; ".join(result.errors)
            raise FileValidationError(message)

        return result

    @staticmethod
    def _normalize_extension(extension: str) -> str:
        """
        Normalize an extension.

        Examples:
            "PDF" -> ".pdf"
            ".DOCX" -> ".docx"
        """

        extension = str(extension).strip().lower()

        if not extension:
            raise ValueError("File extension cannot be empty.")

        if not extension.startswith("."):
            extension = "." + extension

        return extension

    @staticmethod
    def _format_size(size: int) -> str:
        """Convert bytes into a human-readable size."""

        units = ["B", "KB", "MB", "GB", "TB"]

        value = float(size)

        for unit in units:
            if value < 1024 or unit == units[-1]:
                return f"{value:.2f} {unit}"

            value /= 1024

        return f"{size} B"


# ----------------------------------------------------------------------
# Convenience functions
# ----------------------------------------------------------------------

_default_validator = FileValidator()


def validate_file(
    file_path: str | Path,
    raise_on_error: bool = False,
) -> ValidationResult:
    """
    Convenience function for validating a file.
    """

    return _default_validator.validate(
        file_path,
        raise_on_error=raise_on_error,
    )


def is_valid_file(file_path: str | Path) -> bool:
    """
    Convenience function returning only True/False.
    """

    return _default_validator.is_valid(file_path)
