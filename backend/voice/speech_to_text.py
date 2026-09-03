"""
StudyGemma - Speech to Text
backend/voice/speech_to_text.py

Converts audio into text with:
- Multi-language support
- Local/offline engine support
- Audio validation
- Format detection
- Long-audio handling
- Text cleaning
- Confidence metadata when available
- Structured results
- Engine abstraction
"""

from __future__ import annotations

import re
import uuid
import wave
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


# ============================================================
# Exceptions
# ============================================================

class VoiceError(Exception):
    """Base exception for voice-related errors."""


class STTRecognitionError(VoiceError):
    """Raised when speech recognition fails."""


class UnsupportedLanguageError(VoiceError):
    """Raised when the requested language is unsupported."""


class UnsupportedAudioFormatError(VoiceError):
    """Raised when the audio format is unsupported."""


class InvalidAudioError(VoiceError):
    """Raised when the audio file is invalid."""


class AudioProcessingError(VoiceError):
    """Raised when audio preprocessing fails."""


# ============================================================
# Result
# ============================================================

@dataclass
class STTResult:
    """Structured result returned by speech-to-text."""

    success: bool
    text: str = ""
    audio_path: Optional[str] = None
    language: Optional[str] = None
    confidence: Optional[float] = None
    duration: Optional[float] = None
    chunks: int = 0
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "text": self.text,
            "audio_path": self.audio_path,
            "language": self.language,
            "confidence": self.confidence,
            "duration": self.duration,
            "chunks": self.chunks,
            "error": self.error,
            "metadata": self.metadata,
        }


# ============================================================
# Configuration
# ============================================================

@dataclass
class STTConfig:
    """Speech-to-text configuration."""

    language: str = "en"

    # Maximum supported audio duration before chunking.
    chunk_duration: int = 60

    # Maximum accepted audio duration.
    max_duration: int = 3600

    # Supported audio extensions.
    supported_formats: tuple = (
        ".wav",
        ".mp3",
        ".ogg",
        ".flac",
        ".m4a",
        ".webm",
    )

    def validate(self) -> None:
        if self.chunk_duration <= 0:
            raise ValueError(
                "chunk_duration must be greater than 0."
            )

        if self.max_duration <= 0:
            raise ValueError(
                "max_duration must be greater than 0."
            )

        if self.chunk_duration > self.max_duration:
            raise ValueError(
                "chunk_duration cannot exceed max_duration."
            )


# ============================================================
# Speech To Text
# ============================================================

class SpeechToText:
    """
    Main Speech-to-Text service.

    The actual recognition engine is isolated behind an adapter,
    allowing the engine to be replaced without changing
    StudyGemma's application code.
    """

    SUPPORTED_LANGUAGES = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
        "ur": "Urdu",
    }

    LANGUAGE_ALIASES = {
        "english": "en",
        "en-us": "en",
        "en-in": "en",
        "hindi": "hi",
        "hi-in": "hi",
        "marathi": "mr",
        "mr-in": "mr",
        "urdu": "ur",
        "ur-in": "ur",
    }

    def __init__(
        self,
        engine: Any = None,
        config: Optional[STTConfig] = None,
    ):
        self.config = config or STTConfig()
        self.config.validate()

        self.engine = engine or self._create_default_engine()

    # ========================================================
    # Public API
    # ========================================================

    def transcribe(
        self,
        audio_path: str | Path,
        language: Optional[str] = None,
    ) -> STTResult:
        """
        Convert an audio file into text.
        """

        path = Path(audio_path).expanduser().resolve()

        try:
            self._validate_audio_file(path)

            selected_language = self.normalize_language(
                language or self.config.language
            )

            audio_info = self.get_audio_info(path)

            duration = audio_info.get("duration")

            if duration is not None:
                if duration > self.config.max_duration:
                    raise InvalidAudioError(
                        f"Audio duration exceeds the maximum "
                        f"allowed duration of "
                        f"{self.config.max_duration} seconds."
                    )

            audio_chunks = self._prepare_chunks(
                path,
                duration,
            )

            recognized_parts: List[str] = []
            confidences: List[float] = []

            for chunk in audio_chunks:
                result = self._recognize_chunk(
                    chunk=chunk,
                    language=selected_language,
                )

                chunk_text = self._clean_text(
                    result.get("text", "")
                )

                if chunk_text:
                    recognized_parts.append(chunk_text)

                confidence = result.get("confidence")

                if isinstance(confidence, (int, float)):
                    if 0 <= confidence <= 1:
                        confidences.append(float(confidence))

            final_text = self._combine_text(
                recognized_parts
            )

            average_confidence = (
                sum(confidences) / len(confidences)
                if confidences
                else None
            )

            return STTResult(
                success=True,
                text=final_text,
                audio_path=str(path),
                language=selected_language,
                confidence=average_confidence,
                duration=duration,
                chunks=len(audio_chunks),
                metadata={
                    "language_name": self.SUPPORTED_LANGUAGES[
                        selected_language
                    ],
                    "audio_format": audio_info.get("format"),
                    "sample_rate": audio_info.get("sample_rate"),
                    "channels": audio_info.get("channels"),
                },
            )

        except VoiceError as exc:
            return STTResult(
                success=False,
                audio_path=str(path),
                language=language,
                error=str(exc),
            )

        except Exception as exc:
            return STTResult(
                success=False,
                audio_path=str(path),
                language=language,
                error=f"Speech recognition failed: {exc}",
            )

    def speech_to_text(
        self,
        audio_path: str | Path,
        **kwargs,
    ) -> STTResult:
        """Alias for transcribe()."""
        return self.transcribe(audio_path, **kwargs)

    def recognize(
        self,
        audio_path: str | Path,
        **kwargs,
    ) -> STTResult:
        """Alias for transcribe()."""
        return self.transcribe(audio_path, **kwargs)

    # ========================================================
    # Language
    # ========================================================

    def normalize_language(self, language: str) -> str:
        """Normalize language name/code."""

        if not language:
            raise UnsupportedLanguageError(
                "Language must be provided."
            )

        normalized = str(language).strip().lower()

        normalized = self.LANGUAGE_ALIASES.get(
            normalized,
            normalized,
        )

        if normalized not in self.SUPPORTED_LANGUAGES:
            supported = ", ".join(
                self.SUPPORTED_LANGUAGES.values()
            )

            raise UnsupportedLanguageError(
                f"Unsupported language '{language}'. "
                f"Supported languages: {supported}."
            )

        return normalized

    def get_supported_languages(self) -> Dict[str, str]:
        """Return supported languages."""

        return dict(self.SUPPORTED_LANGUAGES)

    # ========================================================
    # Audio Validation
    # ========================================================

    def _validate_audio_file(self, path: Path) -> None:
        """Validate basic audio file properties."""

        if not path.exists():
            raise InvalidAudioError(
                f"Audio file does not exist: {path}"
            )

        if not path.is_file():
            raise InvalidAudioError(
                "The supplied audio path is not a file."
            )

        if path.stat().st_size == 0:
            raise InvalidAudioError(
                "Audio file is empty."
            )

        extension = path.suffix.lower()

        if extension not in self.config.supported_formats:
            raise UnsupportedAudioFormatError(
                f"Unsupported audio format '{extension}'. "
                f"Supported formats: "
                f"{', '.join(self.config.supported_formats)}."
            )

    # ========================================================
    # Audio Information
    # ========================================================

    def get_audio_info(
        self,
        audio_path: str | Path,
    ) -> Dict[str, Any]:
        """
        Return basic audio information.

        WAV files can be inspected without requiring an
        additional dependency. Other formats are delegated
        to the configured engine when possible.
        """

        path = Path(audio_path).expanduser().resolve()

        self._validate_audio_file(path)

        extension = path.suffix.lower()

        info: Dict[str, Any] = {
            "path": str(path),
            "format": extension.lstrip("."),
            "size": path.stat().st_size,
            "duration": None,
            "sample_rate": None,
            "channels": None,
            "sample_width": None,
        }

        if extension == ".wav":
            try:
                with wave.open(str(path), "rb") as wav:
                    frames = wav.getnframes()
                    rate = wav.getframerate()

                    info["sample_rate"] = rate
                    info["channels"] = wav.getnchannels()
                    info["sample_width"] = wav.getsampwidth()

                    if rate > 0:
                        info["duration"] = (
                            frames / float(rate)
                        )

            except Exception as exc:
                raise InvalidAudioError(
                    f"Invalid WAV audio: {exc}"
                ) from exc

        else:
            engine_info = getattr(
                self.engine,
                "get_audio_info",
                None,
            )

            if callable(engine_info):
                try:
                    engine_data = engine_info(path)

                    if isinstance(engine_data, dict):
                        info.update(engine_data)

                except Exception:
                    # Metadata is useful but should not prevent
                    # recognition when the engine can process it.
                    pass

        return info

    # ========================================================
    # Audio Chunking
    # ========================================================

    def _prepare_chunks(
        self,
        path: Path,
        duration: Optional[float],
    ) -> List[Path]:
        """
        Prepare audio chunks.

        For engines that can process the complete file, the
        original file is returned as one chunk.

        Actual physical audio splitting is delegated to the
        engine when necessary.
        """

        if duration is None:
            return [path]

        if duration <= self.config.chunk_duration:
            return [path]

        splitter = getattr(
            self.engine,
            "split_audio",
            None,
        )

        if not callable(splitter):
            # Let the engine receive the original file if it
            # supports long audio itself.
            return [path]

        try:
            chunks = splitter(
                path,
                chunk_duration=self.config.chunk_duration,
            )

            if not chunks:
                raise AudioProcessingError(
                    "Audio splitting produced no chunks."
                )

            return [
                Path(chunk).resolve()
                for chunk in chunks
            ]

        except VoiceError:
            raise

        except Exception as exc:
            raise AudioProcessingError(
                f"Failed to split audio: {exc}"
            ) from exc

    # ========================================================
    # Recognition
    # ========================================================

    def _recognize_chunk(
        self,
        chunk: Path,
        language: str,
    ) -> Dict[str, Any]:
        """Recognize one audio chunk."""

        if not self.engine:
            raise STTRecognitionError(
                "No speech recognition engine is configured."
            )

        recognize_method = getattr(
            self.engine,
            "recognize",
            None,
        )

        if not callable(recognize_method):
            raise STTRecognitionError(
                "Configured STT engine does not provide "
                "a recognize() method."
            )

        try:
            result = recognize_method(
                audio_path=chunk,
                language=language,
            )

            if isinstance(result, str):
                return {"text": result}

            if isinstance(result, dict):
                return result

            raise STTRecognitionError(
                "STT engine returned an invalid result."
            )

        except VoiceError:
            raise

        except Exception as exc:
            raise STTRecognitionError(
                f"Recognition failed: {exc}"
            ) from exc

    # ========================================================
    # Text Processing
    # ========================================================

    def _clean_text(self, text: str) -> str:
        """Clean recognized speech."""

        if not text:
            return ""

        text = str(text)

        # Remove control characters.
        text = re.sub(
            r"[\x00-\x08\x0B\x0C\x0E-\x1F]",
            " ",
            text,
        )

        # Normalize whitespace.
        text = re.sub(
            r"[ \t]+",
            " ",
            text,
        )

        text = re.sub(
            r"\n{3,}",
            "\n\n",
            text,
        )

        return text.strip()

    def _combine_text(
        self,
        parts: List[str],
    ) -> str:
        """Combine recognized chunks in their original order."""

        cleaned_parts = [
            part.strip()
            for part in parts
            if part and part.strip()
        ]

        if not cleaned_parts:
            return ""

        return " ".join(cleaned_parts).strip()

    # ========================================================
    # Engine
    # ========================================================

    def _create_default_engine(self):
        """
        Create the default local STT engine.

        SpeechRecognition is used as an adapter when available.
        The actual recognition backend remains isolated from
        StudyGemma.
        """

        try:
            import speech_recognition as sr

            return _SpeechRecognitionEngine(sr)

        except ImportError:
            return _UnavailableSTTEngine()


# ============================================================
# SpeechRecognition Adapter
# ============================================================

class _SpeechRecognitionEngine:
    """
    Adapter around the SpeechRecognition package.

    This adapter intentionally keeps the main service independent
    from the underlying recognition API.
    """

    def __init__(self, speech_recognition_module):
        self.sr = speech_recognition_module

    def recognize(
        self,
        audio_path: Path,
        language: str,
    ) -> Dict[str, Any]:
        """
        Recognize speech from WAV audio.

        The SpeechRecognition package can work with several
        backends. This adapter uses the package's local audio
        loading and a configurable recognition backend.
        """

        if audio_path.suffix.lower() != ".wav":
            raise STTRecognitionError(
                "The default adapter currently requires WAV "
                "input. Convert other formats before use or "
                "provide a custom STT engine."
            )

        recognizer = self.sr.Recognizer()

        try:
            with self.sr.AudioFile(str(audio_path)) as source:
                audio = recognizer.record(source)

            # The default backend may use an online service.
            # This is kept behind the adapter so it can be
            # replaced by a fully local engine.
            text = recognizer.recognize_google(
                audio,
                language=self._language_locale(language),
            )

            return {
                "text": text,
                "confidence": None,
            }

        except self.sr.UnknownValueError as exc:
            raise STTRecognitionError(
                "Speech could not be understood."
            ) from exc

        except self.sr.RequestError as exc:
            raise STTRecognitionError(
                f"Speech recognition service error: {exc}"
            ) from exc

        except STTRecognitionError:
            raise

        except Exception as exc:
            raise STTRecognitionError(
                f"Audio recognition failed: {exc}"
            ) from exc

    @staticmethod
    def _language_locale(language: str) -> str:
        """Map StudyGemma language codes to recognition locales."""

        locales = {
            "en": "en-IN",
            "hi": "hi-IN",
            "mr": "mr-IN",
            "ur": "ur-IN",
        }

        return locales.get(language, language)


# ============================================================
# Missing Engine Adapter
# ============================================================

class _UnavailableSTTEngine:
    """Fallback when no STT dependency is installed."""

    def recognize(self, **kwargs):
        raise STTRecognitionError(
            "No speech-to-text engine is available. "
            "Install a supported STT dependency or provide "
            "a custom local engine."
        )


# ============================================================
# Convenience API
# ============================================================

_default_stt: Optional[SpeechToText] = None


def get_stt_service() -> SpeechToText:
    """Return a reusable SpeechToText instance."""

    global _default_stt

    if _default_stt is None:
        _default_stt = SpeechToText()

    return _default_stt


def speech_to_text(
    audio_path: str | Path,
    language: str = "en",
    **kwargs,
) -> STTResult:
    """Convenience function for StudyGemma."""

    service = get_stt_service()

    return service.transcribe(
        audio_path=audio_path,
        language=language,
        **kwargs,
    )


__all__ = [
    "VoiceError",
    "STTRecognitionError",
    "UnsupportedLanguageError",
    "UnsupportedAudioFormatError",
    "InvalidAudioError",
    "AudioProcessingError",
    "STTResult",
    "STTConfig",
    "SpeechToText",
    "get_stt_service",
    "speech_to_text",
]
