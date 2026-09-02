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
# API Routes
# ============================================================

from api.chat_routes import chat_bp
from api.document_routes import document_bp
from api.explanation_routes import explanation_bp
from api.quiz_routes import quiz_bp
from api.study_plans_routes import study_plans_bp
from api.utility_routes import utility_bp
from api.voice_routes import voice_bp
from api.test_paper_routes import test_paper_bp


app.register_blueprint(chat_bp)
app.register_blueprint(document_bp)
app.register_blueprint(explanation_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(study_plans_bp)
app.register_blueprint(utility_bp)
app.register_blueprint(voice_bp)
app.register_blueprint(test_paper_bp)


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
