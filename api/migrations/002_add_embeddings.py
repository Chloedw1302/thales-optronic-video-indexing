"""
Migration: Add embedding columns for semantic search

Adds to entities table:
- embedding: Text column for JSON array of embedding vectors
- embedding_model: String column for model identifier
- embedding_generated_at: DateTime column for tracking when embedding was generated

Run this migration:
    python -m api.migrations.002_add_embeddings

Rollback this migration:
    python -m api.migrations.002_add_embeddings rollback
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import create_engine, text
from api.database import get_db_url


def run_migration():
    """Add embedding columns to entities table."""
    db_url = get_db_url()
    engine = create_engine(db_url)

    print("Running migration: 002_add_embeddings")
    print(f"Database: {db_url}")

    with engine.connect() as conn:
        # Check if using SQLite or PostgreSQL
        is_sqlite = 'sqlite' in db_url

        print("\nAdding columns to entities table...")

        try:
            # Check if columns already exist
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(entities)"))
                existing_columns = [row[1] for row in result]
            else:
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name = 'entities' AND table_schema = 'public'"
                ))
                existing_columns = [row[0] for row in result]

            # Add embedding column if it doesn't exist
            if 'embedding' not in existing_columns:
                print("  - Adding 'embedding' column...")
                conn.execute(text("ALTER TABLE entities ADD COLUMN embedding TEXT"))
            else:
                print("  - Column 'embedding' already exists, skipping")

            # Add embedding_model column if it doesn't exist
            if 'embedding_model' not in existing_columns:
                print("  - Adding 'embedding_model' column...")
                if is_sqlite:
                    conn.execute(text("ALTER TABLE entities ADD COLUMN embedding_model VARCHAR(50) DEFAULT 'mistral-embed'"))
                else:
                    conn.execute(text("ALTER TABLE entities ADD COLUMN embedding_model VARCHAR(50) DEFAULT 'mistral-embed'"))
            else:
                print("  - Column 'embedding_model' already exists, skipping")

            # Add embedding_generated_at column if it doesn't exist
            if 'embedding_generated_at' not in existing_columns:
                print("  - Adding 'embedding_generated_at' column...")
                if is_sqlite:
                    conn.execute(text("ALTER TABLE entities ADD COLUMN embedding_generated_at DATETIME"))
                else:
                    conn.execute(text("ALTER TABLE entities ADD COLUMN embedding_generated_at TIMESTAMP"))
            else:
                print("  - Column 'embedding_generated_at' already exists, skipping")

            conn.commit()

        except Exception as e:
            print(f"\n✗ Migration failed: {e}")
            conn.rollback()
            raise

    print("\n✓ Migration completed successfully!")
    print("\nNext steps:")
    print("1. Restart the API server")
    print("2. Embeddings will be automatically generated for existing entities on startup")
    print("3. Test semantic search: GET /api/v1/search/entities/semantic?query=tanks")


def rollback_migration():
    """Remove embedding columns from entities table."""
    db_url = get_db_url()
    engine = create_engine(db_url)

    print("Rolling back migration: 002_add_embeddings")
    print(f"Database: {db_url}")

    with engine.connect() as conn:
        is_sqlite = 'sqlite' in db_url

        print("\nRemoving columns from entities table...")

        try:
            if is_sqlite:
                # SQLite doesn't support DROP COLUMN directly, need to recreate table
                print("  - SQLite detected: Recreating table without embedding columns...")

                # Create new table without embedding columns
                conn.execute(text("""
                    CREATE TABLE entities_temp (
                        id CHAR(36) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL UNIQUE,
                        category VARCHAR(100),
                        created_at DATETIME NOT NULL
                    )
                """))

                # Copy data
                conn.execute(text("""
                    INSERT INTO entities_temp (id, name, category, created_at)
                    SELECT id, name, category, created_at FROM entities
                """))

                # Drop old table and rename
                conn.execute(text("DROP TABLE entities"))
                conn.execute(text("ALTER TABLE entities_temp RENAME TO entities"))

                # Recreate indexes
                conn.execute(text("CREATE INDEX ix_entities_id ON entities (id)"))
                conn.execute(text("CREATE UNIQUE INDEX ix_entities_name ON entities (name)"))

            else:
                # PostgreSQL supports DROP COLUMN
                print("  - Dropping 'embedding' column...")
                conn.execute(text("ALTER TABLE entities DROP COLUMN IF EXISTS embedding"))

                print("  - Dropping 'embedding_model' column...")
                conn.execute(text("ALTER TABLE entities DROP COLUMN IF EXISTS embedding_model"))

                print("  - Dropping 'embedding_generated_at' column...")
                conn.execute(text("ALTER TABLE entities DROP COLUMN IF EXISTS embedding_generated_at"))

            conn.commit()

        except Exception as e:
            print(f"\n✗ Rollback failed: {e}")
            conn.rollback()
            raise

    print("\n✓ Rollback completed successfully!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_migration()
    else:
        run_migration()
