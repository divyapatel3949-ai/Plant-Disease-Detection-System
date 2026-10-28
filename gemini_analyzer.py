"""
Gemini Vision Module for Universal Plant Disease Detection
==========================================================
Identifies any plant leaf (Rice/Paddy, Wheat, Mango, Tomato, Corn, etc.)
and detects diseases using Google Gemini Multimodal Vision API.
"""

import os
import json
import base64
import urllib.request
import urllib.error
import ssl

# Default models to attempt in order
GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest"
]

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def get_api_key(custom_key: str = None) -> str:
    """Retrieve Gemini API key from parameter, .env file, or environment variable."""
    if custom_key and custom_key.strip():
        return custom_key.strip()

    # Check os environment variable
    key = os.environ.get("GEMINI_API_KEY")
    if key and key.strip():
        return key.strip()

    # Check .env file if present
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    return ""


def analyze_leaf_with_gemini(image_bytes: bytes, mime_type: str = "image/jpeg", api_key: str = None) -> dict:
    """
    Analyze any plant leaf image using Gemini Vision API.
    Returns structured diagnosis result.
    """
    active_key = get_api_key(api_key)
    if not active_key:
        return {
            "success": False,
            "error": "Gemini API Key not found. Please provide a GEMINI_API_KEY."
        }

    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        "You are an expert plant pathologist and agronomist. Analyze this leaf or crop photo.\n"
        "1. Identify the exact plant name (e.g. Rice / Paddy, Corn, Tomato, Potato, Wheat, Cotton, Sugarcane, Mango, Apple, etc.).\n"
        "2. Provide the Hindi name of the plant (e.g. धान (चावल), मक्का, टमाटर, आलू, गेहूँ, आम, आदि).\n"
        "3. Check whether the leaf is Healthy or Diseased.\n"
        "4. Identify the specific disease or pest infection (e.g. Rice Blast, Brown Spot, Bacterial Leaf Blight, Healthy, Early Blight, Late Blight, Powdery Mildew, Rust, etc.).\n"
        "5. Provide an accurate confidence score (percentage between 75.0 and 99.5).\n"
        "6. Provide top 3 diagnostic possibilities with probabilities.\n"
        "7. Provide a clear diagnostic description explaining symptoms observed.\n"
        "8. Provide 4-6 practical, actionable prevention & treatment steps (organic remedies, cultural practices, and recommended fungicides/treatments if applicable).\n\n"
        "Respond ONLY with a valid, raw JSON object (no markdown code fences, no extra text) with this exact schema:\n"
        "{\n"
        '  "plant_name": "Rice (Paddy)",\n'
        '  "hindi_name": "धान (चावल)",\n'
        '  "is_healthy": true,\n'
        '  "disease_name": "Healthy",\n'
        '  "confidence": 95.5,\n'
        '  "predictions": [\n'
        '    {"plant_name": "Rice (Paddy)", "disease_name": "Healthy", "confidence": 95.5, "is_healthy": true},\n'
        '    {"plant_name": "Rice (Paddy)", "disease_name": "Brown Spot (Early Stage)", "confidence": 3.0, "is_healthy": false},\n'
        '    {"plant_name": "Rice (Paddy)", "disease_name": "Bacterial Blight", "confidence": 1.5, "is_healthy": false}\n'
        "  ],\n"
        '  "disease_info": {\n'
        '    "description": "Comprehensive explanation of findings...",\n'
        '    "prevention": [\n'
        '      "Step 1...",\n'
        '      "Step 2...",\n'
        '      "Step 3..."\n'
        "    ]\n"
        "  }\n"
        "}"
    )

    request_body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_image
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json"
        }
    }

    body_bytes = json.dumps(request_body).encode("utf-8")
    last_error = None

    for model_name in GEMINI_MODELS:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={active_key}"
        req = urllib.request.Request(
            endpoint,
            data=body_bytes,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=30) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
                
                # Extract text from response
                candidates = resp_json.get("candidates", [])
                if not candidates:
                    continue
                
                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    continue
                
                raw_text = parts[0].get("text", "").strip()
                # Remove markdown fences if model included them
                if raw_text.startswith("```"):
                    lines = raw_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_text = "\n".join(lines).strip()

                parsed_data = json.loads(raw_text)
                return {
                    "success": True,
                    "model_used": f"Gemini Vision ({model_name})",
                    "data": parsed_data
                }
        except urllib.error.HTTPError as http_err:
            try:
                err_details = http_err.read().decode("utf-8")
            except Exception:
                err_details = str(http_err)
            last_error = f"Gemini API HTTP {http_err.code}: {err_details}"
        except Exception as e:
            last_error = str(e)

    return {
        "success": False,
        "error": f"Gemini analysis failed: {last_error}"
    }
