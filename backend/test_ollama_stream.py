import json
import requests

url = "http://127.0.0.1:11434/api/generate"

payload = {
    "model": "gemma3:4b",
    "prompt": "Explain Vastu Shastra in simple terms.",
    "stream": True,
}

print("Connecting to Ollama...")

try:
    response = requests.post(
        url,
        json=payload,
        stream=True,
        timeout=(10, 120),
    )

    print("HTTP STATUS:", response.status_code)
    response.raise_for_status()

    print("Connected. Receiving chunks...\n")

    for line in response.iter_lines(decode_unicode=True):
        if not line:
            continue

        print("RAW:", line)

        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            print("Invalid JSON chunk")
            continue

        chunk = data.get("response", "")

        if chunk:
            print("CHUNK:", repr(chunk))

        if data.get("done"):
            print("\nOllama finished.")
            break

except Exception as error:
    print("\nERROR:")
    print(type(error).__name__)
    print(str(error))

finally:
    try:
        response.close()
    except:
        pass