from flask import Flask, jsonify
from flask_cors import CORS

from config import (
    FRONTEND_URL,
    HOST,
    PORT,
    DEBUG,
)
from database.database import init_db


# ============================================================
# Flask Application
# ============================================================

app = Flask(__name__)


# ============================================================
# CORS
# ============================================================

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                FRONTEND_URL,
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)


# ============================================================
# Database
# ============================================================

init_db()


# ============================================================
# Basic Routes
# ============================================================

@app.route("/")
def home():
    return jsonify({
        "name": "OFFSEDU",
        "status": "running",
        "message": "OFFSEDU backend is running"
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "healthy"
    })


# ============================================================
# Run Server
# ============================================================

if __name__ == "__main__":
    app.run(
        host=HOST,
        port=PORT,
        debug=DEBUG,
    )
