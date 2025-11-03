# 🎥 Thales Video Indexing

## 📘 Description

Ce projet a pour objectif de créer une **base de vidéos annotée automatiquement** à partir d’un dataset interne.  
Deux pipelines sont utilisés en parallèle :  
- **Speech-to-Text (STT)** pour la transcription et la traduction de l’audio.  
- **Image-to-Text (Vision)** pour la description des frames et la détection d’objets.  

Le résultat final est un fichier unique **`metadata_final.csv`** contenant les métadonnées fusionnées (audio + vidéo).

---

## 🧱 Structure du projet

```bash
thales-video-indexing/
├─ README.md
├─ requirements.txt
├─ .gitignore
│
├─ data/
│  ├─ videos/                       # .mp4 sources (non versionnés)
│  ├─ audio/                        # .wav extraits automatiquement
│  ├─ frames/                       # frames extraites automatiquement
│  └─ metadata/                     # métadonnées & sorties finales
│      ├─ manifest.csv              # inventaire auto des vidéos
│      ├─ stt_<video_id>.csv        # résultats speech-to-text
│      ├─ vision_<video_id>.csv     # résultats image-to-text / détection
│      └─ metadata_final.csv        # fichier fusionné final
│
├─ notebooks/
│  ├─ 01_speech_to_text.ipynb       # pipeline audio (Whisper/Faster-Whisper)
│  └─ 02_video_pipeline.ipynb       # pipeline vidéo (VLM/objets)
│
└─ src/
   ├─ __init__.py                   # vide (nécessaire pour les imports)
   ├─ dataset_preparation.py        # préparation dataset (scan, manifest, frames, audio)
   └─ fusion.py                     # fusion STT + Vision → metadata_final.csv
```

---

## ⚙️ Installation

```bash
# Cloner le dépôt
git clone https://github.com/<ton-utilisateur>/thales-video-indexing.git
cd thales-video-indexing

# Créer un environnement virtuel (optionnel)
python -m venv venv
source venv/bin/activate   # (Linux/macOS)
venv\Scripts\activate      # (Windows)

# Installer les dépendances
pip install -r requirements.txt
```

---

## 🚀 Utilisation

### 1️⃣ Préparation du dataset

Ce script scanne le dossier `data/videos/`, crée le `manifest.csv`, extrait des frames et des pistes audio.  
```bash
python -m src.dataset_preparation --scan --manifest --extract-frames --extract-audio
```

### 2️⃣ Lancer les pipelines (dans Jupyter)

- **01_speech_to_text.ipynb** → génère `stt_<video_id>.csv`  
- **02_video_pipeline.ipynb** → génère `vision_<video_id>.csv`

### 3️⃣ Fusion des résultats

Fusionne les résultats audio et vidéo dans un seul CSV final :  
```bash
python -m src.fusion
```

🟢 Sortie :  
`data/metadata/metadata_final.csv`

---

## 📊 Résultat attendu

Le fichier `metadata_final.csv` regroupe toutes les métadonnées audio et vidéo sous un format standardisé, par exemple :

| video_id | timestamp_frame | audio_transcription | video_description | video_objects | confidence |
|-----------|-----------------|---------------------|-------------------|----------------|-------------|
| 001 | 12.0 | "A drone is flying." | "A small drone appears in the sky." | drone | 0.87 |

---

## 🧩 Auteurs
- **Chloé de Wilde** — Data & AI Engineering  
- Projet académique Thales – *Video Indexing Pipeline*  

---

## 🛡️ Licence
Ce projet est réservé à un usage académique et interne.
