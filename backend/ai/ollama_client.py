import requests

from config import OLLAMA_URL, OLLAMA_MODEL


class OllamaClient:
    """Client for communicating with the local Ollama server."""

    def __init__(
        self,
        base_url=OLLAMA_URL,
        model=OLLAMA_MODEL,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def generate(self, prompt, system=None, images=None):
        """Generate a response from the configured Ollama model."""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        if system:
            payload["system"] = system

        if images:
            payload["images"] = images
        print(
                "[OLLAMA VISION DEBUG] images:",
                bool(images),
                "image_count:",
                len(images) if images else 0,
                "image_length:",
                len(images[0]) if images else 0,
            )
        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()
        print("[OLLAMA RESPONSE DEBUG]", data.get("response", "")[:1000])

        return data.get("response", "")

    def is_available(self):
        """Check whether the Ollama server is reachable."""

        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5,
            )

            return response.ok

        except requests.RequestException:
            return False


ollama_client = OllamaClient()