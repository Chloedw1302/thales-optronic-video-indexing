# 🎥 Thales Video Indexing

## 📘 Description

Ce projet détecte et suit automatiquement des **entités militaires** dans des vidéos à partir de transcriptions de voix horodatées.

**Pipeline actuel :**
- **Analyse textuelle** : Extraction d'entités militaires depuis des transcriptions `.txt` horodatées (Mistral LLM)
- **Analyse visuelle** : Détection d'entités dans les frames vidéo (Pixtral vision model)
- **Classification** : Catégorisation automatique des entités par apprentissage zero-shot
- **Visualisation** : Génération de dashboards HTML interactifs avec timelines et heatmaps

Le résultat final est un ensemble de **rapports JSON** et **visualisations HTML** montrant où et quand chaque entité apparaît dans les vidéos.

---

## 🧱 Structure du projet

```bash
thales-optronic-video-indexing/
├─ README.md
├─ API_README.md                    # documentation API REST
├─ requirements.txt
├─ .gitignore
├─ example_api_client.py            # client Python d'exemple pour l'API
│
├─ data/                            # données pour le mode CLI
│  ├─ voice_*.txt                   # transcriptions horodatées (format: [HH:MM:SS] texte)
│  └─ video_*.{mkv,mp4,avi,mov}     # vidéos sources (paires avec voice_*.txt)
│
├─ frames/                          # frames extraites (mode CLI)
│  └─ video_1_frame_*.jpg
│
├─ reports/                         # rapports JSON générés (mode CLI)
│  ├─ video_1_report.json           # détection par frame, statistiques, time ranges
│  └─ summary_report.json           # résumé global de tous les rapports
│
├─ viz/                             # visualisations HTML (Plotly)
│  ├─ video_1_timeline.html         # heatmap temporelle des entités
│  ├─ video_1_presence.html         # présence % par entité
│  ├─ video_1_gantt.html            # timeline type Gantt
│  └─ video_1_dashboard.html        # dashboard 4-en-1 complet
│
├─ storage/                         # stockage API (créé automatiquement)
│  ├─ uploads/                      # vidéos uploadées via API
│  └─ processed/                    # résultats de traitement API
│
├─ notebooks/                       # (placeholders, non utilisés actuellement)
│  ├─ 01_speech_to_text.ipynb
│  └─ 02_video_pipeline.ipynb
│
├─ visualize_reports.py             # génère les 4 types de visualisations HTML
│
├─ api/                             # API REST FastAPI
│  ├─ main.py                       # application FastAPI
│  ├─ config.py                     # configuration API
│  ├─ database.py                   # setup SQLAlchemy
│  ├─ models/                       # modèles SQLAlchemy
│  ├─ schemas/                      # schémas Pydantic
│  ├─ routes/                       # endpoints API
│  ├─ services/                     # logique métier
│  └─ tasks/                        # tâches asynchrones
│
└─ thales/                          # module principal
   ├─ __init__.py
   ├─ __main__.py                   # point d'entrée (python -m thales)
   ├─ cli.py                        # interface ligne de commande
   ├─ config.py                     # configuration, mappings d'entités
   ├─ voice_parser.py               # parse les fichiers voice_*.txt
   ├─ entity_extractor.py           # extraction LLM (Mistral)
   ├─ entity_categorizer.py         # classification zero-shot
   ├─ entity_detector.py            # détection vision (Pixtral)
   ├─ video_processor.py            # extraction de frames (OpenCV)
   └─ report_generator.py           # génération rapports JSON
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

### Mode CLI (Ligne de commande)

#### 1️⃣ Préparer les données

Placez vos fichiers dans le dossier `data/` avec la convention de nommage :
- `voice_1.txt` ↔ `video_1.mkv`
- `voice_2.txt` ↔ `video_2.mp4`
- etc.

**Format des transcriptions** (`voice_*.txt`) :
```
[00:00:12] Un véhicule blindé approche du checkpoint.
[00:00:45] Personnel militaire sur le terrain.
[00:01:23] Drone en surveillance aérienne.
```

### 2️⃣ Lancer le pipeline complet

```bash
python -m thales --directory data --output reports --interval 2.0
```

**Options :**
- `--directory` : dossier contenant les paires voice/video (défaut : `data`)
- `--output` : dossier pour les rapports JSON (défaut : `reports`)
- `--interval` : secondes entre chaque frame extraite (défaut : `2.0`)

Le pipeline va automatiquement :
1. Parser les transcriptions horodatées
2. Extraire les entités militaires (Mistral LLM)
3. Normaliser et catégoriser les entités
4. Extraire des frames vidéo à intervalles réguliers
5. Détecter les entités dans chaque frame (Pixtral)
6. Générer des rapports JSON détaillés

#### 3️⃣ Générer les visualisations

```bash
python visualize_reports.py
```

🟢 **Sorties :**
- `reports/video_*.json` — rapports détaillés par vidéo
- `reports/summary_report.json` — résumé global
- `viz/video_*_dashboard.html` — dashboards interactifs (4 types)
- `frames/video_*_frame_*.jpg` — frames extraites

---

### Mode API REST (FastAPI)

L'API REST permet d'uploader des vidéos, de les traiter en arrière-plan, et de consulter les résultats via des endpoints HTTP.

#### 🚀 Démarrer l'API

```bash
# Installation des dépendances API (si pas déjà fait)
pip install -r requirements.txt

# Lancer le serveur de développement
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera accessible à : **http://localhost:8000**

- 📘 Documentation interactive : http://localhost:8000/docs
- 📗 Documentation alternative : http://localhost:8000/redoc

#### 📝 Exemples d'utilisation

**Upload d'une vidéo avec fichier voice :**
```bash
curl -X POST "http://localhost:8000/api/v1/videos/upload" \
  -F "video_file=@data/video_1.mkv" \
  -F "voice_file=@data/voice_1.txt" \
  -F "interval_seconds=5"
```

**Upload sans fichier voice (détection visuelle uniquement) :**
```bash
curl -X POST "http://localhost:8000/api/v1/videos/upload" \
  -F "video_file=@data/video_1.mkv" \
  -F "interval_seconds=5"
```

**Consulter le statut de traitement :**
```bash
curl "http://localhost:8000/api/v1/videos/{video_id}/status"
```

**Récupérer le rapport de détection :**
```bash
curl "http://localhost:8000/api/v1/videos/{video_id}/report"
```

**Lister toutes les vidéos :**
```bash
curl "http://localhost:8000/api/v1/videos"
```

#### 🐍 Client Python

Un exemple de client Python est fourni dans `example_api_client.py` :

```bash
python example_api_client.py
```

#### 📚 Documentation complète

Pour plus de détails sur l'API, consultez : **[API_README.md](API_README.md)**

#### 🗄️ Stockage

L'API utilise sa propre structure de stockage (indépendante du CLI) :
```
storage/
├── uploads/          # Vidéos uploadées
└── processed/        # Résultats de traitement (frames, rapports)
```

Base de données SQLite : `thales.db`

#### ✨ Fonctionnalités clés

- ✅ Upload de vidéos avec/sans transcription voice
- ✅ Traitement asynchrone en arrière-plan
- ✅ Suivi de progression en temps réel
- ✅ Téléchargement des vidéos et rapports
- ✅ Accès aux frames extraites
- ✅ API REST complète et documentée
- ✅ Compatible avec le mode CLI (stockages indépendants)

---

## 📊 Résultats générés

### Rapports JSON (`reports/video_*.json`)

```json
{
  "video_id": "video_1",
  "entity_stats": {
    "military_personnel": {
      "total_frames": 18,
      "presence_percentage": 81.82,
      "time_ranges": ["0.0-10.0s", "14.0-42.0s"]
    },
    "military_truck": {
      "total_frames": 8,
      "presence_percentage": 36.36,
      "time_ranges": ["0.0-14.0s"]
    }
  },
  "frame_detections": [
    {
      "frame_path": "frames/video_1_frame_0000.jpg",
      "timestamp": 0.0,
      "entities": ["military_personnel", "military_truck", "weapon"]
    }
  ],
  "processing_info": {
    "total_frames_analyzed": 22,
    "unique_entities": 8,
    "video_duration": "42.0s"
  }
}
```

### Visualisations HTML (`viz/`)

- **Timeline heatmap** : présence des entités dans le temps (secondes)
- **Barre de présence** : pourcentage d'apparition par entité
- **Gantt temporel** : plages horaires d'apparition
- **Dashboard 4-en-1** : vue d'ensemble complète et interactive

---

## 🤖 Technologies & Modèles

- **LLM (extraction d'entités)** : Mistral AI avec normalisation contextuelle
- **Vision model (détection)** : Pixtral (Mistral vision model)
- **Classification** : Zero-shot learning avec `facebook/bart-large-mnli`
- **Traitement vidéo** : OpenCV (extraction de frames)
- **Visualisation** : Plotly (dashboards interactifs HTML)
- **Infrastructure** : PyTorch, Transformers (Hugging Face)

**Entités détectées :**
- Personnel militaire/civil
- Véhicules (blindés, camions militaires, drones)
- Équipements (armes, tourelles, remorques)
- Infrastructures (checkpoints, plaques d'immatriculation)

---

## 🧩 Auteurs
- **Chloé de Wilde** — Data & AI Engineering  
- Projet académique Thales – *Video Indexing Pipeline*  

---

## 🛡️ Licence
Ce projet est réservé à un usage académique et interne.
