"""
Migration: Add entity search tables

Creates:
- entities table: Master list of unique entity types
- video_entity_detections table: Junction table with statistics

Run this migration:
    python -m api.migrations.001_add_entity_search
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import create_engine, text
from api.database import Base, get_db_url
from api.models.video import Video
from api.models.entity import Entity, VideoEntityDetection


def run_migration():
    """Create entity search tables."""
    db_url = get_db_url()
    engine = create_engine(db_url)

    print("Running migration: 001_add_entity_search")
    print(f"Database: {db_url}")

    # Create tables
    print("\nCreating tables...")
    Base.metadata.create_all(bind=engine, tables=[
        Entity.__table__,
        VideoEntityDetection.__table__
    ])

    # Verify tables exist
    with engine.connect() as conn:
        # Check if using SQLite or PostgreSQL
        if 'sqlite' in db_url:
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('entities', 'video_entity_detections')"
            ))
            tables = [row[0] for row in result]
            print(f"\nTables created: {', '.join(tables)}")

            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name IN ('entities', 'video_entity_detections')"
            ))
            indexes = [row[0] for row in result]
            print(f"\nIndexes created: {', '.join(indexes)}")
        else:
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name IN ('entities', 'video_entity_detections')"
            ))
            tables = [row[0] for row in result]
            print(f"\nTables created: {', '.join(tables)}")

            result = conn.execute(text(
                "SELECT indexname FROM pg_indexes "
                "WHERE tablename IN ('entities', 'video_entity_detections') "
                "ORDER BY indexname"
            ))
            indexes = [row[0] for row in result]
            print(f"\nIndexes created: {', '.join(indexes)}")

    print("\n✓ Migration completed successfully!")
    print("\nNext steps:")
    print("1. Restart the API server")
    print("2. Run the reindex endpoint: POST /api/v1/admin/reindex-entities")
    print("3. Verify entities are indexed")


def rollback_migration():
    """Drop entity search tables."""
    db_url = get_db_url()
    engine = create_engine(db_url)

    print("Rolling back migration: 001_add_entity_search")
    print(f"Database: {db_url}")

    with engine.connect() as conn:
        print("\nDropping tables...")
        conn.execute(text("DROP TABLE IF EXISTS video_entity_detections CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS entities CASCADE"))
        conn.commit()

    print("\n✓ Rollback completed successfully!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        run_migration()
