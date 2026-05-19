# Brain Tumor Detection

Small Flask-based project for detecting brain tumors in MRI images using a Keras model.

## Summary
- Web app: `app.py` serves a simple upload/predict UI (see `templates/` and `static/`).
- Prediction script: `predict.py` for single-image inference.
- Training: `train.py` (and `dataset/train.py`) for model training using images in `dataset/`.
- Pretrained model: `brain_tumor_model.h5` (included in repo).

## Requirements
- Python 3.8+ (create a virtual environment recommended)
- Install dependencies:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1   # PowerShell on Windows
pip install -r requirements.txt
```

## Run the web app

```powershell
# from project root
python app.py
# Open http://127.0.0.1:5000 in your browser
```

## Predict from script

```powershell
# quick example (see predict.py for exact CLI options)
python predict.py path/to/image.jpg
```

## Train a new model
- Prepare labeled images under `dataset/` (e.g. `dataset/yes`, `dataset/no`).
- Run the training script:

```powershell
python train.py
```

Note: `dataset/` and `uploads/` are in `.gitignore` to avoid committing large or private data.

## Project structure

- `app.py` — Flask application
- `predict.py` — inference helper / CLI
- `train.py` — top-level training orchestration
- `dataset/` — training images (ignored)
- `templates/`, `static/` — web UI assets
- `uploads/` — temporary uploaded images (ignored)
- `brain_tumor_model.h5` — model weights
- `requirements.txt` — Python dependencies

## Notes
- If `brain_tumor_model.h5` is large consider using Git LFS or hosting the model externally.
- If you want, I can add a small `README` section with example screenshots or expand instructions for deployment.

## License
MIT (feel free to change)