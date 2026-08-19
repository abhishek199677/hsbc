"""
Prediction API — Uses trained ML model to predict interview scores.

Flask server on port 8004.
Falls back to returning null if no model is trained yet.

Usage:
    cd ml
    pip install -r requirements.txt
    python server.py
"""

import os
import json
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model_bundle = None


def load_model():
    global model_bundle
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            model_bundle = pickle.load(f)
        print(f"Model loaded: {model_bundle['training_samples']} training samples")
        return True
    print("No trained model found. Run: python train.py")
    return False


def encode_feature(value, mapping, default=0):
    """Encode a categorical string to its integer label."""
    if value in mapping:
        return mapping[value]
    return default


def compute_performance_stats(scores):
    """Compute statistics from per-question scores array."""
    if isinstance(scores, list) and len(scores) > 0:
        return {
            "perf_mean": float(np.mean(scores)),
            "perf_std": float(np.std(scores)),
            "perf_min": float(min(scores)),
            "perf_max": float(max(scores)),
            "perf_last": float(scores[-1]),
        }
    return {"perf_mean": 5.0, "perf_std": 0.0, "perf_min": 0.0, "perf_max": 10.0, "perf_last": 5.0}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "modelLoaded": model_bundle is not None,
        "trainingSamples": model_bundle["training_samples"] if model_bundle else 0,
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict interview score from features.

    Request body:
    {
        "wordCount": 250,
        "avgResponseLen": 25.0,
        "technicalTerms": 15,
        "positiveSignals": 8,
        "negativeSignals": 1,
        "questionCount": 8,
        "experienceLevel": "mid",
        "role": "Software Engineer",
        "difficulty": "medium",
        "codingPassRate": 0.75,
        "proctorFlags": 0,
        "performanceScores": [7, 8, 6, 9, 7, 8]
    }
    """
    if not model_bundle:
        return jsonify({"error": "No trained model. Run: python train.py", "prediction": None}), 200

    data = request.json
    if not data:
        return jsonify({"error": "Request body required"}), 400

    metadata = model_bundle["metadata"]
    model = model_bundle["model"]
    scaler = model_bundle["scaler"]
    encoders = metadata["encoders"]

    # Build feature vector
    perf_stats = compute_performance_stats(data.get("performanceScores", []))

    features = [
        data.get("wordCount", 0),
        data.get("avgResponseLen", 0),
        data.get("technicalTerms", 0),
        data.get("positiveSignals", 0),
        data.get("negativeSignals", 0),
        data.get("questionCount", 0),
        encode_feature(data.get("experienceLevel", "mid"), encoders["experienceLevel"]),
        encode_feature(data.get("role", "unknown"), encoders["role"]),
        encode_feature(data.get("difficulty", "medium"), encoders["difficulty"]),
        data.get("codingPassRate", 0) or 0,
        data.get("proctorFlags", 0),
        perf_stats["perf_mean"],
        perf_stats["perf_std"],
        perf_stats["perf_min"],
        perf_stats["perf_max"],
        perf_stats["perf_last"],
    ]

    X = np.array([features])
    X_scaled = scaler.transform(X)
    prediction = float(model.predict(X_scaled)[0])
    prediction = max(0, min(10, prediction))  # Clamp to 0-10

    # Get confidence from ensemble variance if available
    confidence = None
    if hasattr(model, "estimators_"):
        # For tree-based ensembles, get predictions from individual trees
        preds = [tree.predict(X_scaled)[0] for tree in model.estimators_]
        confidence = 1.0 - float(np.std(preds))  # Lower std = higher confidence
        confidence = max(0, min(1, confidence))

    return jsonify({
        "prediction": round(prediction, 2),
        "confidence": round(confidence, 3) if confidence else None,
        "modelType": type(model).__name__,
        "trainingSamples": model_bundle["training_samples"],
    })


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    """Predict scores for multiple interviews at once."""
    if not model_bundle:
        return jsonify({"error": "No trained model"}), 200

    data = request.json
    if not data or "interviews" not in data:
        return jsonify({"error": "Request body with 'interviews' array required"}), 400

    results = []
    for interview in data["interviews"]:
        perf_stats = compute_performance_stats(interview.get("performanceScores", []))
        metadata = model_bundle["metadata"]
        encoders = metadata["encoders"]

        features = [
            interview.get("wordCount", 0),
            interview.get("avgResponseLen", 0),
            interview.get("technicalTerms", 0),
            interview.get("positiveSignals", 0),
            interview.get("negativeSignals", 0),
            interview.get("questionCount", 0),
            encode_feature(interview.get("experienceLevel", "mid"), encoders["experienceLevel"]),
            encode_feature(interview.get("role", "unknown"), encoders["role"]),
            encode_feature(interview.get("difficulty", "medium"), encoders["difficulty"]),
            interview.get("codingPassRate", 0) or 0,
            interview.get("proctorFlags", 0),
            perf_stats["perf_mean"],
            perf_stats["perf_std"],
            perf_stats["perf_min"],
            perf_stats["perf_max"],
            perf_stats["perf_last"],
        ]

        X = np.array([features])
        X_scaled = model_bundle["scaler"].transform(X)
        pred = float(model_bundle["model"].predict(X_scaled)[0])
        pred = max(0, min(10, pred))
        results.append({"prediction": round(pred, 2)})

    return jsonify({"results": results})


if __name__ == "__main__":
    loaded = load_model()
    if not loaded:
        print("Starting in fallback mode (no model). Predictions will return null.")
    print("Prediction API running on http://localhost:8004")
    app.run(host="0.0.0.0", port=8004, debug=False)
