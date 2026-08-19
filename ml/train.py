"""
ML Training Script — Predicts interview scores from transcript features.

Uses scikit-learn Random Forest + Gradient Boosting.
Trains on exported InterviewMetrics data.

Usage:
    cd ml
    pip install -r requirements.txt
    python train.py

Input:  training_data.csv (from scripts/exportTrainingData.ts)
Output: model.pkl (trained model + metadata)
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error

DATA_PATH = os.path.join(os.path.dirname(__file__), "training_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "feature_names.json")


def load_data():
    """Load and validate training data."""
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: {DATA_PATH} not found.")
        print("Run: npx tsx scripts/exportTrainingData.ts")
        exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    if len(df) < 10:
        print(f"WARNING: Only {len(df)} samples. Need at least 10 for training.")
        print("Run more interviews to collect data. Exiting.")
        exit(0)

    return df


def preprocess(df):
    """Feature engineering and encoding."""
    # Encode categorical features
    le_exp = LabelEncoder()
    le_role = LabelEncoder()
    le_diff = LabelEncoder()
    le_rec = LabelEncoder()

    df["experienceLevel_enc"] = le_exp.fit_transform(df["experienceLevel"].fillna("mid"))
    df["role_enc"] = le_role.fit_transform(df["role"].fillna("unknown"))
    df["difficulty_enc"] = le_diff.fit_transform(df["difficulty"].fillna("medium"))
    df["recommendation_enc"] = le_rec.fit_transform(df["recommendation"].fillna("Consider"))

    # Fill NaN in codingPassRate
    df["codingPassRate"] = df["codingPassRate"].fillna(0)

    # Feature columns
    feature_cols = [
        "wordCount",
        "avgResponseLen",
        "technicalTerms",
        "positiveSignals",
        "negativeSignals",
        "questionCount",
        "experienceLevel_enc",
        "role_enc",
        "difficulty_enc",
        "codingPassRate",
        "proctorFlags",
    ]

    # Parse performanceScores JSON array and extract stats
    def parse_scores(s):
        try:
            scores = json.loads(s) if isinstance(s, str) else s
            if isinstance(scores, list) and len(scores) > 0:
                return {
                    "perf_mean": np.mean(scores),
                    "perf_std": np.std(scores),
                    "perf_min": min(scores),
                    "perf_max": max(scores),
                    "perf_last": scores[-1],
                }
        except (json.JSONDecodeError, TypeError):
            pass
        return {"perf_mean": 5, "perf_std": 0, "perf_min": 0, "perf_max": 10, "perf_last": 5}

    perf_stats = df["performanceScores"].apply(parse_scores).apply(pd.Series)
    df = pd.concat([df, perf_stats], axis=1)
    feature_cols.extend(["perf_mean", "perf_std", "perf_min", "perf_max", "perf_last"])

    X = df[feature_cols].values
    y = df["llmScore"].values

    # Save feature names and encoders for inference
    metadata = {
        "feature_cols": feature_cols,
        "encoders": {
            "experienceLevel": {cls: int(i) for i, cls in enumerate(le_exp.classes_)},
            "role": {cls: int(i) for i, cls in enumerate(le_role.classes_)},
            "difficulty": {cls: int(i) for i, cls in enumerate(le_diff.classes_)},
            "recommendation": {cls: int(i) for i, cls in enumerate(le_rec.classes_)},
        },
    }

    return X, y, metadata


def train_and_evaluate(X, y):
    """Train models and evaluate performance."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Random Forest": RandomForestRegressor(
            n_estimators=100, max_depth=10, min_samples_split=5, random_state=42
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42
        ),
    }

    results = {}
    best_model = None
    best_score = -999

    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=min(5, len(X_train)), scoring="r2")

        print(f"  MAE:  {mae:.3f}")
        print(f"  RMSE: {rmse:.3f}")
        print(f"  R²:   {r2:.3f}")
        print(f"  CV R²: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

        results[name] = {"mae": mae, "rmse": rmse, "r2": r2, "cv_r2": cv_scores.mean()}

        if r2 > best_score:
            best_score = r2
            best_model = model

    # Feature importance
    if hasattr(best_model, "feature_importances_"):
        print(f"\nTop 10 Feature Importances ({type(best_model).__name__}):")
        importances = best_model.feature_importances_
        indices = np.argsort(importances)[::-1][:10]
        for i, idx in enumerate(indices):
            print(f"  {i+1}. Feature {idx}: {importances[idx]:.3f}")

    return best_model, scaler, results


def main():
    df = load_data()
    X, y, metadata = preprocess(df)
    print(f"Features: {X.shape[1]}, Samples: {X.shape[0]}")

    model, scaler, results = train_and_evaluate(X, y)

    # Save model bundle
    bundle = {
        "model": model,
        "scaler": scaler,
        "metadata": metadata,
        "training_samples": len(X),
        "results": results,
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)

    with open(FEATURES_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Feature metadata saved to {FEATURES_PATH}")

    # Print best model performance
    best_name = max(results, key=lambda k: results[k]["r2"])
    best = results[best_name]
    print(f"\nBest model: {best_name}")
    print(f"  MAE:  {best['mae']:.3f}")
    print(f"  R²:   {best['r2']:.3f}")
    print(f"  Ready for prediction API.")


if __name__ == "__main__":
    main()
