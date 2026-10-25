# 🌿 Plant Disease Detection System

An AI-powered web application that detects plant diseases from leaf images using deep learning. Upload a photo of a plant leaf, and the system will analyze it to identify potential diseases, providing instant results with confidence scores and care recommendations.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15+-orange?logo=tensorflow)
![Flask](https://img.shields.io/badge/Flask-3.0+-green?logo=flask)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

- **AI-Powered Diagnosis** — CNN model (MobileNetV2) trained on 55,000+ leaf images across 38 disease classes
- **Drag & Drop Upload** — Intuitive image upload with preview and validation
- **Top-3 Predictions** — Shows the top three most likely diagnoses with confidence scores
- **Disease Information** — Descriptions and prevention tips for detected diseases
- **Responsive Design** — Works on desktop, tablet, and mobile devices
- **Real-Time Analysis** — Sub-second predictions with loading indicators
- **Confidence Warnings** — Alerts users when model confidence is low

## 📸 Screenshots

> *Add screenshots here after running the application.*

| Home Page | Upload | Results |
|-----------|--------|---------|
| ![Home](screenshots/home.png) | ![Upload](screenshots/upload.png) | ![Results](screenshots/results.png) |

---

## 🏗️ Architecture

```
User Browser ──Upload Image──► Flask Backend (app.py)
                                    │
                                    ▼
                              predict.py
                              ┌──────────────┐
                              │ Preprocess    │
                              │ (resize,      │
                              │  normalize)   │
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │ CNN Model    │
                              │ (MobileNetV2)│
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │ Top-3 Results│
                              │ + Disease    │
                              │   Info       │
                              └──────┬───────┘
                                     │
                   JSON Response ◄───┘
                        │
                        ▼
                   Browser renders results
```

## 📁 Project Structure

```
plant-disease-detection/
├── app.py                    # Flask web application
├── predict.py                # Prediction module (preprocessing + inference)
├── train_model.py            # Model training script
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── .gitignore
├── models/
│   ├── plant_disease_model.keras   # Trained model (generated)
│   ├── class_names.json            # Class label mapping (generated)
│   ├── confusion_matrix.png        # Evaluation plot (generated)
│   └── training_history.png        # Training curves (generated)
├── templates/
│   └── index.html            # Main web page
├── static/
│   ├── css/
│   │   └── style.css         # Stylesheet
│   ├── js/
│   │   └── script.js         # Frontend JavaScript
│   └── uploads/              # Uploaded images (runtime)
└── dataset/
    ├── README.md             # Dataset download instructions
    └── PlantVillage/         # Dataset directory (user-provided)
        ├── Apple___Apple_scab/
        ├── Tomato___healthy/
        └── ... (38 classes)
```

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.9 or higher
- pip package manager
- 4+ GB RAM (for model training; 2 GB sufficient for inference)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "Plant Disease Detection System"
```

### Step 2: Create a Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Download the Dataset

Follow the instructions in [`dataset/README.md`](dataset/README.md) to download the PlantVillage dataset (~2.5 GB).

**Quick download via Kaggle:**
```bash
pip install kaggle
kaggle datasets download -d abdallahalidev/plantvillage-dataset
# Extract and organize into dataset/PlantVillage/
```

### Step 5: Train the Model

```bash
python train_model.py
```

This will:
- Load images from `dataset/PlantVillage/`
- Train a MobileNetV2-based CNN (Phase 1: transfer learning, Phase 2: fine-tuning)
- Save the model to `models/plant_disease_model.keras`
- Save class names to `models/class_names.json`
- Save evaluation plots to `models/`

**Training time:** ~30–60 minutes on GPU, 2–4 hours on CPU.

### Step 6: Run the Application

```bash
python app.py
```

Open your browser and navigate to: **http://localhost:5000**

---

## 🔌 API Endpoints

| Method | Endpoint   | Description                          |
|--------|-----------|--------------------------------------|
| GET    | `/`       | Render the main web page             |
| POST   | `/predict`| Upload an image and get predictions  |
| GET    | `/health` | Check application and model status   |

### POST `/predict`

**Request:** `multipart/form-data` with a `file` field containing a JPG/PNG image (max 10 MB).

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "class_name": "Tomato___Early_blight",
      "confidence": 92.34,
      "is_healthy": false,
      "plant_name": "Tomato",
      "disease_name": "Early blight"
    },
    {
      "class_name": "Tomato___Late_blight",
      "confidence": 4.12,
      "is_healthy": false,
      "plant_name": "Tomato",
      "disease_name": "Late blight"
    },
    {
      "class_name": "Tomato___healthy",
      "confidence": 1.87,
      "is_healthy": true,
      "plant_name": "Tomato",
      "disease_name": "Healthy"
    }
  ],
  "disease_info": {
    "description": "Tomato early blight is caused by Alternaria solani...",
    "prevention": ["Rotate crops annually.", "..."]
  },
  "image_url": "/static/uploads/abc123.jpg"
}
```

---

## 🧠 Model Details

| Property          | Value                     |
|-------------------|---------------------------|
| Base Architecture | MobileNetV2 (ImageNet)    |
| Input Size        | 224 × 224 × 3 (RGB)      |
| Training Phases   | 2 (transfer + fine-tuning)|
| Dataset           | PlantVillage (~55,000 images) |
| Classes           | 38                        |
| Augmentation      | Random flip, rotation, zoom, contrast |
| Optimizer         | Adam                      |
| Loss Function     | Categorical Crossentropy  |

---

## ⚠️ Limitations

- **Not a substitute for expert diagnosis.** Predictions are model estimates and should not be used as definitive diagnoses.
- **Domain-specific.** The model is trained on the PlantVillage dataset and may not generalize well to images taken in very different conditions (lighting, angle, background).
- **Limited crop coverage.** Only the plant species present in the PlantVillage dataset are supported.
- **Image quality matters.** Blurry, distant, or poorly lit images may produce low-confidence or incorrect predictions.
- **Single leaf focus.** The model analyzes individual leaf images, not entire plants or fields.

---

## 🛠️ Troubleshooting

### "Model not loaded" error
- Ensure `models/plant_disease_model.keras` and `models/class_names.json` exist.
- Run `python train_model.py` to train the model.

### TensorFlow installation issues
- Use `pip install tensorflow` for the latest compatible version.
- On Apple Silicon (M1/M2): `pip install tensorflow-macos tensorflow-metal`

### Dataset not found
- Ensure the dataset is in `dataset/PlantVillage/` with class subdirectories.
- See `dataset/README.md` for download instructions.

### Port 5000 in use
- Change the port in `app.py`: `app.run(port=5001)`
- Or kill the process using port 5000.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **PlantVillage Dataset** — Hughes, D. P., & Salathé, M. (2015). An open access repository of images on plant health.
- **MobileNetV2** — Sandler, M., et al. (2018). MobileNetV2: Inverted Residuals and Linear Bottlenecks.
- **TensorFlow/Keras** — Open-source machine learning framework by Google.
