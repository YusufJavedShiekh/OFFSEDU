"""
StudyGemma - File Manager

Responsibilities:
- Secure file storage
- File validation
- Filename sanitization
- Unique file IDs
- File type detection
- MIME type detection
- File size validation
- Upload/processed/generated storage
- File retrieval
- File deletion
- File metadata

This module does NOT:
- Process PDF/DOCX/PPTX/image contents
- Perform OCR
- Generate embeddings
- Call Gemma
- Handle RAG
"""

from __future__ import annotations

import hashlib
import logging
import mimetypes
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, BinaryIO, Optional, Union


logger = logging.getLogger(__name__)


FileInput = Union[
    str,
    Path,
    bytes,
    bytearray,
    BinaryIO,
]


class FileManager:
    """
    Centralized file management service for StudyGemma.

    Storage structure:

        backend/
            storage/
                uploads/
                processed/
                generated/
                compressed/
                pdfs/
    """

    # =========================================================
    # SUPPORTED FILE TYPES
    # =========================================================

    SUPPORTED_EXTENSIONS = {
        ".pdf": "pdf",
        ".txt": "text",
        ".text": "text",
        ".docx": "docx",
        ".pptx": "pptx",
        ".jpg": "image",
        ".jpeg": "image",
        ".png": "image",
        ".webp": "image",
        ".bmp": "image",
        ".tif": "image",
        ".tiff": "image",
    }

    SUPPORTED_MIME_TYPES = {
        "application/pdf": "pdf",
        "text/plain": "text",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "image/jpeg": "image",
        "image/png": "image",
        "image/webp": "image",
        "image/bmp": "image",
        "image/tiff": "image",
    }

    # =========================================================
    # STORAGE
    # =========================================================

    STORAGE_DIRECTORIES = {
        "uploads": "uploads",
        "processed": "processed",
        "generated": "generated",
        "compressed": "compressed",
        "pdfs": "pdfs",
    }

    DEFAULT_STORAGE = "uploads"

    # =========================================================
    # LIMITS
    # =========================================================

    DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024

    # =========================================================
    # INITIALIZATION
    # =========================================================

    def __init__(
        self,
        storage_root: Optional[Union[str, Path]] = None,
        max_file_size: int = DEFAULT_MAX_FILE_SIZE,
    ):
        """
        Initialize FileManager.

        If storage_root is not supplied:

            backend/documents/file_manager.py
                                  ↓
                            ../storage/

        """

        if storage_root is None:

            self.storage_root = (
                Path(__file__).resolve().parent.parent
                / "storage"
            )

        else:

            self.storage_root = Path(
                storage_root
            ).resolve()

        self.max_file_size = max_file_size

        self._initialize_storage()

    # =========================================================
    # STORAGE INITIALIZATION
    # =========================================================

    def _initialize_storage(self) -> None:
        """
        Create all required storage directories.
        """

        for directory in (
            self.STORAGE_DIRECTORIES.values()
        ):

            path = (
                self.storage_root
                / directory
            )

            path.mkdir(
                parents=True,
                exist_ok=True,
            )

    # =========================================================
    # MAIN SAVE METHOD
    # =========================================================

    def save_file(
        self,
        file_input: FileInput,
        filename: Optional[str] = None,
        storage: str = DEFAULT_STORAGE,
        validate: bool = True,
    ) -> dict[str, Any]:
        """
        Save a file securely.

        Returns metadata including:
        - file_id
        - filename
        - stored_filename
        - path
        - size
        - extension
        - mime_type
        - document_type
        - hash
        """

        try:

            # -------------------------------------------------
            # Validate storage location
            # -------------------------------------------------

            storage_path = self.get_storage_path(
                storage
            )

            # -------------------------------------------------
            # Determine filename
            # -------------------------------------------------

            original_filename = (
                filename
                or self._get_filename(
                    file_input
                )
            )

            if not original_filename:

                return self._failure(
                    "Filename is required."
                )

            # -------------------------------------------------
            # Sanitize filename
            # -------------------------------------------------

            safe_filename = (
                self.sanitize_filename(
                    original_filename
                )
            )

            if not safe_filename:

                return self._failure(
                    "Invalid filename."
                )

            # -------------------------------------------------
            # Determine type
            # -------------------------------------------------

            extension = (
                Path(
                    safe_filename
                ).suffix.lower()
            )

            document_type = (
                self.get_document_type(
                    extension
                )
            )

            if document_type is None:

                return self._failure(
                    f"Unsupported file extension: {extension}"
                )

            # -------------------------------------------------
            # Get bytes
            # -------------------------------------------------

            file_bytes = self._read_bytes(
                file_input
            )

            if not file_bytes:

                return self._failure(
                    "File is empty."
                )

            # -------------------------------------------------
            # Size validation
            # -------------------------------------------------

            if len(file_bytes) > (
                self.max_file_size
            ):

                return self._failure(
                    "File exceeds the maximum "
                    "allowed file size."
                )

            # -------------------------------------------------
            # MIME detection
            # -------------------------------------------------

            mime_type = (
                self.detect_mime_type(
                    filename=safe_filename,
                    data=file_bytes,
                )
            )

            # -------------------------------------------------
            # Content validation
            # -------------------------------------------------

            if validate:

                validation = (
                    self.validate_file(
                        filename=safe_filename,
                        data=file_bytes,
                        mime_type=mime_type,
                    )
                )

                if not validation["valid"]:

                    return self._failure(
                        validation["error"]
                    )

            # -------------------------------------------------
            # Generate unique ID
            # -------------------------------------------------

            file_id = str(
                uuid.uuid4()
            )

            # -------------------------------------------------
            # Generate secure stored name
            # -------------------------------------------------

            stored_filename = (
                f"{file_id}{extension}"
            )

            destination = (
                storage_path
                / stored_filename
            )

            # -------------------------------------------------
            # Security check
            # -------------------------------------------------

            if not self._is_safe_path(
                destination,
                storage_path,
            ):

                return self._failure(
                    "Unsafe file path detected."
                )

            # -------------------------------------------------
            # Save
            # -------------------------------------------------

            destination.write_bytes(
                file_bytes
            )

            # -------------------------------------------------
            # Hash
            # -------------------------------------------------

            file_hash = (
                self.calculate_hash(
                    file_bytes
                )
            )

            # -------------------------------------------------
            # Metadata
            # -------------------------------------------------

            created_at = (
                datetime.now(
                    timezone.utc
                ).isoformat()
            )

            metadata = {
                "success": True,
                "file_id": file_id,
                "filename": original_filename,
                "safe_filename": safe_filename,
                "stored_filename": stored_filename,
                "storage": storage,
                "path": str(
                    destination
                ),
                "relative_path": str(
                    destination.relative_to(
                        self.storage_root
                    )
                ),
                "extension": extension,
                "mime_type": mime_type,
                "document_type": document_type,
                "size": len(file_bytes),
                "size_mb": round(
                    len(file_bytes)
                    / (1024 * 1024),
                    3,
                ),
                "sha256": file_hash,
                "created_at": created_at,
            }

            logger.info(
                "File saved successfully: %s",
                file_id,
            )

            return metadata

        except Exception as error:

            logger.exception(
                "Failed to save file."
            )

            return self._failure(
                str(error)
            )

    # =========================================================
    # VALIDATE FILE
    # =========================================================

    def validate_file(
        self,
        filename: str,
        data: bytes,
        mime_type: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Validate filename, extension, size and
        basic file signature.
        """

        if not filename:

            return {
                "valid": False,
                "error": "Filename is required.",
            }

        extension = (
            Path(filename)
            .suffix
            .lower()
        )

        if extension not in (
            self.SUPPORTED_EXTENSIONS
        ):

            return {
                "valid": False,
                "error": (
                    f"Unsupported file extension: "
                    f"{extension}"
                ),
            }

        if not data:

            return {
                "valid": False,
                "error": "File is empty.",
            }

        if len(data) > (
            self.max_file_size
        ):

            return {
                "valid": False,
                "error": (
                    "File exceeds maximum "
                    "allowed size."
                ),
            }

        # -----------------------------------------------------
        # MIME consistency
        # -----------------------------------------------------

        expected_type = (
            self.SUPPORTED_EXTENSIONS[
                extension
            ]
        )

        if mime_type:

            detected_type = (
                self.SUPPORTED_MIME_TYPES.get(
                    mime_type
                )
            )

            # Do not reject generic MIME values too aggressively.
            if (
                detected_type
                and detected_type != expected_type
            ):

                return {
                    "valid": False,
                    "error": (
                        "File extension and MIME type "
                        "do not match."
                    ),
                }

        # -----------------------------------------------------
        # File signatures
        # -----------------------------------------------------

        signature_result = (
            self.validate_file_signature(
                extension,
                data,
            )
        )

        if not signature_result["valid"]:

            return signature_result

        return {
            "valid": True,
            "error": None,
        }

    # =========================================================
    # FILE SIGNATURE VALIDATION
    # =========================================================

    @staticmethod
    def validate_file_signature(
        extension: str,
        data: bytes,
    ) -> dict[str, Any]:
        """
        Perform lightweight magic-byte validation.

        This prevents obvious extension spoofing such as:

            malicious.exe → renamed.pdf
        """

        signatures = {
            ".pdf": [
                b"%PDF-",
            ],

            ".jpg": [
                b"\xff\xd8\xff",
            ],

            ".jpeg": [
                b"\xff\xd8\xff",
            ],

            ".png": [
                b"\x89PNG\r\n\x1a\n",
            ],

            ".webp": [
                b"RIFF",
            ],

            ".bmp": [
                b"BM",
            ],

            ".tif": [
                b"II*\x00",
                b"MM\x00*",
            ],

            ".tiff": [
                b"II*\x00",
                b"MM\x00*",
            ],

            ".docx": [
                b"PK\x03\x04",
            ],

            ".pptx": [
                b"PK\x03\x04",
            ],
        }

        expected_signatures = signatures.get(
            extension
        )

        # TXT has no reliable magic-byte signature.
        if expected_signatures is None:

            return {
                "valid": True,
                "error": None,
            }

        if not any(
            data.startswith(signature)
            for signature in expected_signatures
        ):

            return {
                "valid": False,
                "error": (
                    "File content does not match "
                    "its extension."
                ),
            }

        return {
            "valid": True,
            "error": None,
        }

    # =========================================================
    # FILENAME SANITIZATION
    # =========================================================

    @staticmethod
    def sanitize_filename(
        filename: str,
    ) -> str:
        """
        Sanitize user-provided filename.

        Prevents:
        - Path traversal
        - Directory separators
        - Control characters
        - Dangerous filename patterns
        """

        if not filename:

            return ""

        # Remove path components.
        filename = Path(
            filename
        ).name

        # Replace path separators.
        filename = filename.replace(
            "/",
            "_",
        )

        filename = filename.replace(
            "\\",
            "_",
        )

        # Remove control characters.
        filename = re.sub(
            r"[\x00-\x1f\x7f]",
            "",
            filename,
        )

        # Replace unsupported characters.
        filename = re.sub(
            r'[<>:"|?*]',
            "_",
            filename,
        )

        # Collapse repeated spaces.
        filename = re.sub(
            r"\s+",
            " ",
            filename,
        ).strip()

        # Prevent hidden/special names.
        if filename in {
            ".",
            "..",
        }:

            return ""

        # Prevent Windows reserved names.
        stem = Path(
            filename
        ).stem.upper()

        reserved_names = {
            "CON",
            "PRN",
            "AUX",
            "NUL",
            "COM1",
            "COM2",
            "COM3",
            "COM4",
            "COM5",
            "COM6",
            "COM7",
            "COM8",
            "COM9",
            "LPT1",
            "LPT2",
            "LPT3",
            "LPT4",
            "LPT5",
            "LPT6",
            "LPT7",
            "LPT8",
            "LPT9",
        }

        if stem in reserved_names:

            filename = (
                f"file_{filename}"
            )

        # Keep filename reasonably sized.
        extension = (
            Path(filename)
            .suffix
        )

        stem = (
            Path(filename)
            .stem
        )

        stem = stem[:150]

        filename = (
            f"{stem}{extension}"
        )

        return filename

    # =========================================================
    # DOCUMENT TYPE
    # =========================================================

    @classmethod
    def get_document_type(
        cls,
        extension: str,
    ) -> Optional[str]:
        """
        Return normalized document type.
        """

        return cls.SUPPORTED_EXTENSIONS.get(
            extension.lower()
        )

    # =========================================================
    # MIME TYPE
    # =========================================================

    @classmethod
    def detect_mime_type(
        cls,
        filename: str,
        data: Optional[bytes] = None,
    ) -> str:
        """
        Determine MIME type.

        Extension is used as the primary signal,
        while known file signatures can override
        generic guesses.
        """

        extension = (
            Path(filename)
            .suffix
            .lower()
        )

        # Known supported extension.
        extension_mime = {
            ".pdf": "application/pdf",
            ".txt": "text/plain",
            ".text": "text/plain",
            ".docx": (
                "application/"
                "vnd.openxmlformats-officedocument."
                "wordprocessingml.document"
            ),
            ".pptx": (
                "application/"
                "vnd.openxmlformats-officedocument."
                "presentationml.presentation"
            ),
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
            ".tif": "image/tiff",
            ".tiff": "image/tiff",
        }

        known = extension_mime.get(
            extension
        )

        if known:

            return known

        guessed, _ = mimetypes.guess_type(
            filename
        )

        return (
            guessed
            or "application/octet-stream"
        )

    # =========================================================
    # STORAGE PATH
    # =========================================================

    def get_storage_path(
        self,
        storage: str,
    ) -> Path:
        """
        Get a safe storage directory.
        """

        if storage not in (
            self.STORAGE_DIRECTORIES
        ):

            raise ValueError(
                f"Unknown storage location: {storage}"
            )

        directory = (
            self.STORAGE_DIRECTORIES[
                storage
            ]
        )

        path = (
            self.storage_root
            / directory
        ).resolve()

        if not self._is_safe_path(
            path,
            self.storage_root,
        ):

            raise ValueError(
                "Unsafe storage path."
            )

        path.mkdir(
            parents=True,
            exist_ok=True,
        )

        return path

    # =========================================================
    # GET FILE
    # =========================================================

    def get_file(
        self,
        file_id: str,
        storage: str = DEFAULT_STORAGE,
    ) -> Optional[Path]:
        """
        Retrieve a stored file by file ID.

        Returns None if the file does not exist.
        """

        if not self._is_valid_file_id(
            file_id
        ):

            return None

        storage_path = self.get_storage_path(
            storage
        )

        matches = list(
            storage_path.glob(
                f"{file_id}.*"
            )
        )

        if not matches:

            return None

        file_path = matches[0]

        if not self._is_safe_path(
            file_path,
            storage_path,
        ):

            logger.warning(
                "Unsafe file access attempted."
            )

            return None

        return file_path

    # =========================================================
    # FILE EXISTS
    # =========================================================

    def file_exists(
        self,
        file_id: str,
        storage: str = DEFAULT_STORAGE,
    ) -> bool:
        """
        Check whether a stored file exists.
        """

        return (
            self.get_file(
                file_id=file_id,
                storage=storage,
            )
            is not None
        )

    # =========================================================
    # DELETE FILE
    # =========================================================

    def delete_file(
        self,
        file_id: str,
        storage: str = DEFAULT_STORAGE,
    ) -> dict[str, Any]:
        """
        Delete a stored file securely.
        """

        try:

            file_path = self.get_file(
                file_id=file_id,
                storage=storage,
            )

            if file_path is None:

                return {
                    "success": False,
                    "error": "File not found.",
                }

            file_path.unlink()

            logger.info(
                "File deleted: %s",
                file_id,
            )

            return {
                "success": True,
                "file_id": file_id,
                "error": None,
            }

        except Exception as error:

            logger.exception(
                "Failed to delete file."
            )

            return {
                "success": False,
                "file_id": file_id,
                "error": str(error),
            }

    # =========================================================
    # MOVE FILE
    # =========================================================

    def move_file(
        self,
        file_id: str,
        source_storage: str = DEFAULT_STORAGE,
        destination_storage: str = "processed",
    ) -> dict[str, Any]:
        """
        Move a stored file between storage areas.
        """

        try:

            source = self.get_file(
                file_id=file_id,
                storage=source_storage,
            )

            if source is None:

                return self._failure(
                    "Source file not found."
                )

            destination_dir = (
                self.get_storage_path(
                    destination_storage
                )
            )

            destination = (
                destination_dir
                / source.name
            )

            if not self._is_safe_path(
                destination,
                destination_dir,
            ):

                return self._failure(
                    "Unsafe destination path."
                )

            source.replace(
                destination
            )

            return {
                "success": True,
                "file_id": file_id,
                "source": str(source),
                "destination": str(
                    destination
                ),
                "error": None,
            }

        except Exception as error:

            logger.exception(
                "Failed to move file."
            )

            return self._failure(
                str(error)
            )

    # =========================================================
    # COPY FILE
    # =========================================================

    def copy_file(
        self,
        file_id: str,
        source_storage: str = DEFAULT_STORAGE,
        destination_storage: str = "processed",
    ) -> dict[str, Any]:
        """
        Copy a stored file to another storage area.
        """

        try:

            source = self.get_file(
                file_id=file_id,
                storage=source_storage,
            )

            if source is None:

                return self._failure(
                    "Source file not found."
                )

            destination_dir = (
                self.get_storage_path(
                    destination_storage
                )
            )

            destination = (
                destination_dir
                / source.name
            )

            if not self._is_safe_path(
                destination,
                destination_dir,
            ):

                return self._failure(
                    "Unsafe destination path."
                )

            destination.write_bytes(
                source.read_bytes()
            )

            return {
                "success": True,
                "file_id": file_id,
                "source": str(source),
                "destination": str(
                    destination
                ),
                "error": None,
            }

        except Exception as error:

            logger.exception(
                "Failed to copy file."
            )

            return self._failure(
                str(error)
            )

    # =========================================================
    # FILE INFO
    # =========================================================

    def get_file_info(
        self,
        file_id: str,
        storage: str = DEFAULT_STORAGE,
    ) -> Optional[dict[str, Any]]:
        """
        Return information about a stored file.
        """

        file_path = self.get_file(
            file_id=file_id,
            storage=storage,
        )

        if file_path is None:

            return None

        try:

            data = file_path.read_bytes()

            mime_type = (
                self.detect_mime_type(
                    file_path.name,
                    data,
                )
            )

            extension = (
                file_path.suffix.lower()
            )

            stat = file_path.stat()

            return {
                "file_id": file_path.stem,
                "filename": file_path.name,
                "path": str(
                    file_path
                ),
                "storage": storage,
                "extension": extension,
                "document_type": (
                    self.get_document_type(
                        extension
                    )
                ),
                "mime_type": mime_type,
                "size": stat.st_size,
                "size_mb": round(
                    stat.st_size
                    / (1024 * 1024),
                    3,
                ),
                "sha256": self.calculate_hash(
                    data
                ),
                "created_at": datetime.fromtimestamp(
                    stat.st_ctime,
                    tz=timezone.utc,
                ).isoformat(),
                "modified_at": datetime.fromtimestamp(
                    stat.st_mtime,
                    tz=timezone.utc,
                ).isoformat(),
            }

        except Exception as error:

            logger.exception(
                "Unable to get file information."
            )

            return {
                "file_id": file_id,
                "error": str(error),
            }

    # =========================================================
    # LIST FILES
    # =========================================================

    def list_files(
        self,
        storage: str = DEFAULT_STORAGE,
    ) -> list[dict[str, Any]]:
        """
        List stored files in a storage directory.
        """

        storage_path = self.get_storage_path(
            storage
        )

        results = []

        for path in storage_path.iterdir():

            if not path.is_file():
                continue

            if not self._is_safe_path(
                path,
                storage_path,
            ):
                continue

            info = self.get_file_info(
                file_id=path.stem,
                storage=storage,
            )

            if info:

                results.append(
                    info
                )

        results.sort(
            key=lambda item: item.get(
                "created_at",
                "",
            ),
            reverse=True,
        )

        return results

    # =========================================================
    # FILE HASH
    # =========================================================

    @staticmethod
    def calculate_hash(
        data: bytes,
    ) -> str:
        """
        Calculate SHA-256 hash.

        Used for:
        - File integrity
        - Duplicate detection later
        - Tracking processed files
        """

        return hashlib.sha256(
            data
        ).hexdigest()

    # =========================================================
    # FILENAME FROM INPUT
    # =========================================================

    @staticmethod
    def _get_filename(
        file_input: FileInput,
    ) -> Optional[str]:
        """
        Try to obtain filename from input.
        """

        if isinstance(
            file_input,
            (str, Path),
        ):

            return Path(
                file_input
            ).name

        filename = getattr(
            file_input,
            "filename",
            None,
        )

        if filename:

            return str(
                filename
            )

        name = getattr(
            file_input,
            "name",
            None,
        )

        if name:

            return Path(
                str(name)
            ).name

        return None

    # =========================================================
    # READ BYTES
    # =========================================================

    @staticmethod
    def _read_bytes(
        file_input: FileInput,
    ) -> bytes:
        """
        Convert supported input types to bytes.
        """

        if isinstance(
            file_input,
            Path,
        ):

            return file_input.read_bytes()

        if isinstance(
            file_input,
            str,
        ):

            path = Path(
                file_input
            )

            if path.exists():

                return path.read_bytes()

            # Treat raw string as content.
            return file_input.encode(
                "utf-8"
            )

        if isinstance(
            file_input,
            (bytes, bytearray),
        ):

            return bytes(
                file_input
            )

        if hasattr(
            file_input,
            "read",
        ):

            try:

                file_input.seek(0)

            except Exception:
                pass

            data = file_input.read()

            if isinstance(
                data,
                str,
            ):

                return data.encode(
                    "utf-8"
                )

            return data

        raise TypeError(
            "Unsupported file input type."
        )

    # =========================================================
    # PATH SECURITY
    # =========================================================

    @staticmethod
    def _is_safe_path(
        target: Path,
        base: Path,
    ) -> bool:
        """
        Verify target stays inside base directory.
        """

        try:

            target_resolved = (
                target.resolve()
            )

            base_resolved = (
                base.resolve()
            )

            target_resolved.relative_to(
                base_resolved
            )

            return True

        except ValueError:

            return False

    # =========================================================
    # FILE ID VALIDATION
    # =========================================================

    @staticmethod
    def _is_valid_file_id(
        file_id: str,
    ) -> bool:
        """
        Validate UUID-based file IDs.
        """

        if not file_id:
            return False

        try:

            uuid.UUID(
                file_id
            )

            return True

        except (
            ValueError,
            AttributeError,
            TypeError,
        ):

            return False

    # =========================================================
    # FAILURE RESPONSE
    # =========================================================

    @staticmethod
    def _failure(
        error: str,
    ) -> dict[str, Any]:
        """
        Standard failure response.
        """

        return {
            "success": False,
            "error": error,
        }


# =============================================================
# DEFAULT INSTANCE
# =============================================================

file_manager = FileManager()