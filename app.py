"""
Brain Tumor Detection - Flask Backend
======================================
This is the main application file that handles:
- Serving the web interface
- Receiving uploaded MRI images
- Running the AI model for prediction
- Returning results to the frontend
"""

import os
import numpy as np
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from PIL import Image

# ─── App Configuration ────────────────────────────────────────────────────────
app = Flask(__name__)

# Folder where uploaded MRI images are saved
UPLOAD_FOLDER = "uploads"
# Only allow image files
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "bmp", "webp"}
# Maximum file size: 16 MB
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── Model Loading ────────────────────────────────────────────────────────────
# Try to load a real TensorFlow/Keras model if it exists.
# If not found, we fall back to a demo mode so the UI still works.
model = None
MODEL_PATH = os.path.join("model", "brain_tumor_model.h5")

try:
    import tensorflow as tf
    if os.path.exists(MODEL_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        print(f"⚠️  Model file not found at '{MODEL_PATH}'. Running in DEMO mode.")
        print("    Place your trained .h5 model there to enable real predictions.")
except ImportError:
    print("⚠️  TensorFlow not installed. Running in DEMO mode.")
    print("    Install it with: pip install tensorflow")

# ─── Helper Functions ─────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def preprocess_image(image_path: str) -> np.ndarray:
    """
    Load and preprocess an MRI image so it matches the model's expected input.
    - Resizes to 224×224 (standard for most CNN models)
    - Normalises pixel values to [0, 1]
    - Adds a batch dimension
    """
    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0          # Normalise
    img_array = np.expand_dims(img_array, axis=0)  # Shape: (1, 224, 224, 3)
    return img_array


def demo_prediction(image_path: str) -> dict:
    """
    Fake prediction used when no real model is loaded.
    Generates a plausible-looking result so the UI can be tested.
    Returns a dict with 'tumor_detected' (bool) and 'confidence' (float 0-1).
    """
    import hashlib, struct
    # Use the file contents to produce a deterministic 'random' result
    with open(image_path, "rb") as f:
        file_hash = hashlib.md5(f.read()).digest()
    seed = struct.unpack("<I", file_hash[:4])[0]
    rng = np.random.default_rng(seed)
    confidence = float(rng.uniform(0.70, 0.99))
    tumor_detected = bool(rng.integers(0, 2))  # 50/50 in demo
    return {"tumor_detected": tumor_detected, "confidence": confidence}


def run_model_prediction(image_path: str) -> dict:
    """
    Run the real Keras model on the preprocessed image.
    Assumes the model outputs a single sigmoid probability (binary classification):
      - Output > 0.5  →  Tumor detected
      - Output ≤ 0.5  →  No tumor
    Adjust the threshold or class logic here if your model differs.
    """
    img_array = preprocess_image(image_path)
    prediction = model.predict(img_array, verbose=0)  # Shape: (1, 1) for binary

    # Handle both binary (sigmoid) and multi-class (softmax) outputs
    if prediction.shape[-1] == 1:
        # Binary classification
        confidence = float(prediction[0][0])
        tumor_detected = confidence > 0.5
        if not tumor_detected:
            confidence = 1.0 - confidence  # Flip so confidence refers to the result
    else:
        # Multi-class: assume class index 1 = tumor
        tumor_class_prob = float(prediction[0][1])
        no_tumor_class_prob = float(prediction[0][0])
        tumor_detected = tumor_class_prob > no_tumor_class_prob
        confidence = tumor_class_prob if tumor_detected else no_tumor_class_prob

    return {"tumor_detected": tumor_detected, "confidence": confidence}


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    """
    Endpoint: POST /predict
    Expects a multipart form with a file field named 'mri_image'.
    Returns JSON: { tumor_detected, confidence, label, message, demo_mode }
    """
    # ── Validate the request ──────────────────────────────────────────────────
    if "mri_image" not in request.files:
        return jsonify({"error": "No image file provided in the request."}), 400

    file = request.files["mri_image"]

    if file.filename == "":
        return jsonify({"error": "No file selected. Please upload an MRI image."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type. Please upload a PNG or JPEG image."}), 400

    # ── Save the uploaded file ────────────────────────────────────────────────
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)

    # ── Run prediction ────────────────────────────────────────────────────────
    try:
        if model is not None:
            result = run_model_prediction(save_path)
            demo_mode = False
        else:
            result = demo_prediction(save_path)
            demo_mode = True
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # ── Build the response ────────────────────────────────────────────────────
    tumor_detected = result["tumor_detected"]
    confidence = result["confidence"]

    response = {
        "tumor_detected": tumor_detected,
        "confidence": round(confidence * 100, 2),  # e.g. 94.73
        "label": "Tumor Detected" if tumor_detected else "No Tumor Detected",
        "message": (
            "⚠️ Potential tumor detected. Please consult a medical professional immediately."
            if tumor_detected
            else "✅ No tumor indicators found. Continue regular check-ups."
        ),
        "demo_mode": demo_mode,  # Let the UI show a 'demo' badge if needed
    }

    return jsonify(response)


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n🧠 Brain Tumor Detection System")
    print("   Running at http://localhost:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
