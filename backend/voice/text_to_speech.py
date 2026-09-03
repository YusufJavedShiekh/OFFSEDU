"""
StudyGemma - Text to Speech
backend/voice/text_to_speech.py

Converts text into speech with:
- Multi-language support
- Configurable speed and volume
- Long-text handling
- Text cleaning
- Safe audio output
- Output validation
- Structured results
- Engine abstraction

The implementation prefers a local/offline TTS engine.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


# ============================================================
# Exceptions
# ============================================================

class VoiceError(Exception):
    """Base exception for voice-related errors."""


class TTSGenerationError(VoiceError):
    """Raised when speech generation fails."""


class UnsupportedLanguageError(VoiceError):
    """Raised when the requested language is not supported."""


class InvalidTextError(VoiceError):
    """Raised when the input text is invalid."""


class AudioOutputError(VoiceError):
    """Raised when generated audio is invalid or cannot be saved."""


# ============================================================
# Result
# ============================================================

@dataclass
class TTSResult:
    """Structured result returned after text-to-speech generation."""

    success: bool
    audio_path: Optional[str] = None
    language: Optional[str] = None
    voice: Optional[str] = None
    output_format: Optional[str] = None
    text_length: int = 0
    duration: Optional[float] = None
    chunks: int = 0
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "audio_path": self.audio_path,
            "language": self.language,
            "voice": self.voice,
            "output_format": self.output_format,
            "text_length": self.text_length,
            "duration": self.duration,
            "chunks": self.chunks,
            "error": self.error,
            "metadata": self.metadata,
        }


# ============================================================
# Configuration
# ============================================================

@dataclass
class TTSConfig:
    """Configuration used by the TTS engine."""

    language: str = "en"
    voice: Optional[str] = None
    speed: float = 1.0
    volume: float = 1.0
    output_format: str = "wav"

    # Maximum characters sent to the engine at once.
    max_chunk_length: int = 2500

    # Prevent accidentally huge requests.
    max_text_length: int = 100_000

    def validate(self) -> None:
        if self.speed <= 0:
            raise ValueError("Speed must be greater than 0.")

        if self.volume < 0 or self.volume > 1:
            raise ValueError("Volume must be between 0 and 1.")

        if self.max_chunk_length <= 0:
            raise ValueError("max_chunk_length must be greater than 0.")

        if self.max_text_length <= 0:
            raise ValueError("max_text_length must be greater than 0.")

        self.output_format = self.output_format.lower().lstrip(".")


# ============================================================
# Text To Speech
# ============================================================

class TextToSpeech:
    """
    Main Text-to-Speech service.

    The service keeps the application independent from the
    underlying TTS engine.
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

    SUPPORTED_FORMATS = {
        "wav",
        "mp3",
        "ogg",
    }

    def __init__(
        self,
        output_dir: Optional[str | Path] = None,
        engine: Any = None,
        config: Optional[TTSConfig] = None,
    ):
        self.config = config or TTSConfig()
        self.config.validate()

        self.output_dir = Path(
            output_dir or "backend/storage/generated"
        ).resolve()

        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.engine = engine or self._create_default_engine()

    # --------------------------------------------------------
    # Public API
    # --------------------------------------------------------

    def synthesize(
        self,
        text: str,
        language: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        volume: Optional[float] = None,
        output_format: Optional[str] = None,
        output_path: Optional[str | Path] = None,
        overwrite: bool = False,
    ) -> TTSResult:
        """
        Convert text to speech.

        Returns a TTSResult instead of exposing engine-specific
        implementation details.
        """

        try:
            cleaned_text = self._prepare_text(text)

            selected_language = self.normalize_language(
                language or self.config.language
            )

            selected_voice = voice or self.config.voice
            selected_speed = (
                self.config.speed if speed is None else speed
            )
            selected_volume = (
                self.config.volume if volume is None else volume
            )

            selected_format = (
                output_format or self.config.output_format
            ).lower().lstrip(".")

            self._validate_parameters(
                selected_speed,
                selected_volume,
                selected_format,
            )

            chunks = self._split_text(
                cleaned_text,
                self.config.max_chunk_length,
            )

            if not chunks:
                raise InvalidTextError("No usable text was provided.")

            final_path = self._prepare_output_path(
                output_path=output_path,
                output_format=selected_format,
                overwrite=overwrite,
            )

            audio_result = self._generate_audio(
                chunks=chunks,
                language=selected_language,
                voice=selected_voice,
                speed=selected_speed,
                volume=selected_volume,
                output_format=selected_format,
                output_path=final_path,
            )

            self._validate_audio_output(final_path)

            return TTSResult(
                success=True,
                audio_path=str(final_path),
                language=selected_language,
                voice=selected_voice,
                output_format=selected_format,
                text_length=len(cleaned_text),
                duration=audio_result.get("duration"),
                chunks=len(chunks),
                metadata={
                    "language_name": self.SUPPORTED_LANGUAGES[
                        selected_language
                    ],
                    "speed": selected_speed,
                    "volume": selected_volume,
                },
            )

        except VoiceError as exc:
            return TTSResult(
                success=False,
                language=language,
                error=str(exc),
            )

        except Exception as exc:
            return TTSResult(
                success=False,
                language=language,
                error=f"TTS generation failed: {exc}",
            )

    def text_to_speech(self, text: str, **kwargs) -> TTSResult:
        """Alias for synthesize()."""
        return self.synthesize(text, **kwargs)

    def generate(self, text: str, **kwargs) -> TTSResult:
        """Alias for synthesize()."""
        return self.synthesize(text, **kwargs)

    # --------------------------------------------------------
    # Language
    # --------------------------------------------------------

    def normalize_language(self, language: str) -> str:
        """Normalize language names/codes."""

        if not language:
            raise UnsupportedLanguageError(
                "Language must be provided."
            )

        normalized = language.strip().lower()

        normalized = self.LANGUAGE_ALIASES.get(
            normalized,
            normalized,
        )

        if normalized not in self.SUPPORTED_LANGUAGES:
            supported = ", ".join(self.SUPPORTED_LANGUAGES.values())

            raise UnsupportedLanguageError(
                f"Unsupported language '{language}'. "
                f"Supported languages: {supported}."
            )

        return normalized

    def get_supported_languages(self) -> Dict[str, str]:
        """Return supported language codes and names."""
        return dict(self.SUPPORTED_LANGUAGES)

    # --------------------------------------------------------
    # Text processing
    # --------------------------------------------------------

    def _prepare_text(self, text: str) -> str:
        """Validate and clean text before synthesis."""

        if text is None:
            raise InvalidTextError("Text cannot be None.")

        if not isinstance(text, str):
            raise InvalidTextError("Text must be a string.")

        text = text.strip()

        if not text:
            raise InvalidTextError("Text cannot be empty.")

        if len(text) > self.config.max_text_length:
            raise InvalidTextError(
                f"Text exceeds the maximum allowed length "
                f"of {self.config.max_text_length} characters."
            )

        # Remove null/control characters while preserving
        # normal whitespace and newlines.
        text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text)

        # Normalize excessive whitespace.
        text = re.sub(r"[ \t]+", " ", text)

        # Prevent excessive blank lines.
        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()

    # --------------------------------------------------------
    # Chunking
    # --------------------------------------------------------

    def _split_text(
        self,
        text: str,
        max_length: int,
    ) -> List[str]:
        """
        Split long text while trying to preserve sentences and
        paragraph boundaries.
        """

        if len(text) <= max_length:
            return [text]

        paragraphs = re.split(r"\n\s*\n", text)

        chunks: List[str] = []
        current = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()

            if not paragraph:
                continue

            if len(paragraph) <= max_length:
                candidate = (
                    f"{current}\n\n{paragraph}"
                    if current
                    else paragraph
                )

                if len(candidate) <= max_length:
                    current = candidate
                    continue

                if current:
                    chunks.append(current)
                    current = ""

                current = paragraph
                continue

            # Paragraph itself is too large.
            sentences = re.split(
                r"(?<=[.!?।])\s+",
                paragraph,
            )

            for sentence in sentences:
                sentence = sentence.strip()

                if not sentence:
                    continue

                if len(sentence) > max_length:
                    # Hard split only when one sentence itself
                    # exceeds the allowed size.
                    if current:
                        chunks.append(current)
                        current = ""

                    for i in range(0, len(sentence), max_length):
                        chunks.append(
                            sentence[i:i + max_length].strip()
                        )
                    continue

                candidate = (
                    f"{current} {sentence}"
                    if current
                    else sentence
                )

                if len(candidate) <= max_length:
                    current = candidate
                else:
                    if current:
                        chunks.append(current)
                    current = sentence

        if current:
            chunks.append(current)

        return [chunk for chunk in chunks if chunk.strip()]

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    def _validate_parameters(
        self,
        speed: float,
        volume: float,
        output_format: str,
    ) -> None:

        if speed <= 0:
            raise ValueError("Speed must be greater than 0.")

        if volume < 0 or volume > 1:
            raise ValueError(
                "Volume must be between 0 and 1."
            )

        if output_format not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported output format '{output_format}'. "
                f"Supported formats: "
                f"{', '.join(sorted(self.SUPPORTED_FORMATS))}."
            )

    # --------------------------------------------------------
    # Output handling
    # --------------------------------------------------------

    def _prepare_output_path(
        self,
        output_path: Optional[str | Path],
        output_format: str,
        overwrite: bool,
    ) -> Path:

        if output_path:
            path = Path(output_path).expanduser().resolve()
        else:
            filename = (
                f"studygemma_tts_"
                f"{uuid.uuid4().hex}.{output_format}"
            )
            path = self.output_dir / filename

        # Ensure parent directory exists.
        path.parent.mkdir(parents=True, exist_ok=True)

        if path.exists() and not overwrite:
            raise AudioOutputError(
                f"Output file already exists: {path}"
            )

        return path

    def _validate_audio_output(self, path: Path) -> None:
        """Basic validation of generated audio."""

        if not path.exists():
            raise AudioOutputError(
                "TTS engine did not create an audio file."
            )

        if not path.is_file():
            raise AudioOutputError(
                "Generated audio path is not a file."
            )

        if path.stat().st_size == 0:
            raise AudioOutputError(
                "Generated audio file is empty."
            )

    # --------------------------------------------------------
    # Engine
    # --------------------------------------------------------

    def _create_default_engine(self):
        """
        Create the default local TTS engine.

        pyttsx3 is used when available because it can work
        locally without sending study content to a remote API.

        The actual engine is isolated behind this class so it
        can be replaced later.
        """

        try:
            import pyttsx3

            return _Pyttsx3Engine(pyttsx3)

        except ImportError:
            return _UnavailableTTSEngine()

    def _generate_audio(
        self,
        chunks: List[str],
        language: str,
        voice: Optional[str],
        speed: float,
        volume: float,
        output_format: str,
        output_path: Path,
    ) -> Dict[str, Any]:
        """
        Generate audio through the configured engine.
        """

        if not self.engine:
            raise TTSGenerationError(
                "No TTS engine is configured."
            )

        try:
            result = self.engine.generate(
                chunks=chunks,
                language=language,
                voice=voice,
                speed=speed,
                volume=volume,
                output_format=output_format,
                output_path=output_path,
            )

            if result is None:
                return {}

            if isinstance(result, dict):
                return result

            return {}

        except VoiceError:
            raise

        except Exception as exc:
            raise TTSGenerationError(
                f"Speech generation failed: {exc}"
            ) from exc


# ============================================================
# Local pyttsx3 Adapter
# ============================================================

class _Pyttsx3Engine:
    """
    Adapter around pyttsx3.

    Keeping this separate means TextToSpeech does not depend
    directly on pyttsx3's API.
    """

    def __init__(self, pyttsx3_module):
        self.pyttsx3 = pyttsx3_module

    def generate(
        self,
        chunks: List[str],
        language: str,
        voice: Optional[str],
        speed: float,
        volume: float,
        output_format: str,
        output_path: Path,
    ) -> Dict[str, Any]:

        if output_format != "wav":
            raise TTSGenerationError(
                "The local pyttsx3 adapter currently supports "
                "WAV output. Use another engine for MP3/OGG."
            )

        engine = self.pyttsx3.init()

        try:
            # Approximate normal speech rate.
            base_rate = 150
            engine.setProperty(
                "rate",
                max(50, int(base_rate * speed)),
            )

            engine.setProperty(
                "volume",
                volume,
            )

            if voice:
                engine.setProperty("voice", voice)

            for chunk in chunks:
                engine.say(chunk)

            engine.save_to_file(
                "\n".join(chunks),
                str(output_path),
            )

            engine.runAndWait()

            return {
                "duration": None,
            }

        finally:
            try:
                engine.stop()
            except Exception:
                pass


# ============================================================
# Missing Engine Adapter
# ============================================================

class _UnavailableTTSEngine:
    """Fallback engine when no supported TTS dependency exists."""

    def generate(self, **kwargs):
        raise TTSGenerationError(
            "No TTS engine is available. "
            "Install a supported local TTS engine "
            "or provide a custom engine."
        )


# ============================================================
# Convenience Functions
# ============================================================

_default_tts: Optional[TextToSpeech] = None


def get_tts_service(
    output_dir: Optional[str | Path] = None,
) -> TextToSpeech:
    """Return a reusable TTS service instance."""

    global _default_tts

    if _default_tts is None:
        _default_tts = TextToSpeech(
            output_dir=output_dir
        )

    return _default_tts


def text_to_speech(
    text: str,
    language: str = "en",
    output_path: Optional[str | Path] = None,
    **kwargs,
) -> TTSResult:
    """
    Convenience function for StudyGemma services.
    """

    service = get_tts_service()

    return service.synthesize(
        text=text,
        language=language,
        output_path=output_path,
        **kwargs,
    )


__all__ = [
    "VoiceError",
    "TTSGenerationError",
    "UnsupportedLanguageError",
    "InvalidTextError",
    "AudioOutputError",
    "TTSResult",
    "TTSConfig",
    "TextToSpeech",
    "get_tts_service",
    "text_to_speech",
]
