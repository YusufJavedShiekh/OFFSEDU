import json

import requests

from config import OLLAMA_MODEL, OLLAMA_URL


class OllamaClient:
    """Client for communicating with the local Ollama server."""

    def __init__(
        self,
        base_url=OLLAMA_URL,
        model=OLLAMA_MODEL,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def generate(
        self,
        prompt,
        system=None,
        images=None,
    ):
        """Generate a complete response from Ollama."""

        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        if system:
            payload["system"] = system

        if images:
            payload["images"] = images

        print("\n========== OLLAMA PROMPT DEBUG ==========")
        print("SYSTEM PROMPT:")
        print(system)

        print("\nUSER PROMPT:")
        print(prompt)

        print("\nPROMPT LENGTH:", len(prompt))
        print("=========================================\n")

        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        return data.get("response", "")

    def generate_stream(
        self,
        prompt,
        system=None,
        images=None,
    ):
        """
        Generate a response progressively from Ollama.

        Each yielded value contains the next text chunk.
        """

        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": True,
        }

        if system:
            payload["system"] = system

        if images:
            payload["images"] = images

        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            stream=True,
            timeout=120,
        )

        response.raise_for_status()

        try:
            for line in response.iter_lines(
                decode_unicode=True
            ):
                if not line:
                    continue

                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue

                chunk = data.get("response", "")

                if chunk:
                    yield chunk

                if data.get("done"):
                    break

        finally:
            response.close()

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