bash
'''
thales-video-indexing/
├─ README.md
├─ requirements.txt
├─ .gitignore
├─ data/
│  ├─ videos/           # .mp4 sources (non versionnés)
│  ├─ audio/            # wav extraits (auto)
│  ├─ frames/           # frames extraites (auto)
│  └─ metadata/         # manifest.csv, stt_*.csv, vision_*.csv, schema_fusion.json
├─ notebooks/
│  ├─ 00_dataset_preparation.ipynb
│  ├─ 01_speech_to_text.ipynb
│  └─ 02_video_pipeline.ipynb
└─ src/
   ├─ __init__.py
   ├─ dataset_preparation.py   # module commun (scan, manifest, extract, helpers)

