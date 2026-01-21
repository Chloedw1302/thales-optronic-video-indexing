"""
Embedding generation service for semantic entity search.

Uses Mistral embeddings API to generate vector representations of entity names,
enabling semantic similarity search (e.g., "tanks" matches "armored vehicle").
"""
import logging
import numpy as np
from typing import List, Optional
from mistralai import Mistral

from api.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and comparing embeddings using Mistral API."""

    # Class-level client instance (singleton)
    _client: Optional[Mistral] = None
    _model: str = "mistral-embed"

    @classmethod
    def _get_client(cls) -> Mistral:
        """
        Get or create Mistral API client.

        Returns:
            Initialized Mistral client

        Raises:
            ValueError: If MISTRAL_API_KEY is not configured
        """
        if cls._client is None:
            if not settings.mistral_api_key:
                raise ValueError(
                    "MISTRAL_API_KEY not found in configuration. "
                    "Please add MISTRAL_API_KEY to your .env file."
                )
            cls._client = Mistral(api_key=settings.mistral_api_key)
        return cls._client

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """
        Generate embedding vector for a single text string.

        Args:
            text: Text to generate embedding for

        Returns:
            List of floats representing the embedding vector (1024 dimensions)

        Raises:
            ValueError: If text is empty or API key not configured
            Exception: If Mistral API call fails
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        try:
            client = cls._get_client()
            logger.debug(f"Generating embedding for text: '{text[:50]}...'")

            response = client.embeddings.create(
                model=cls._model,
                inputs=[text]
            )

            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding with {len(embedding)} dimensions")

            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding for '{text}': {e}")
            raise

    @classmethod
    def generate_embeddings_batch(cls, texts: List[str], batch_size: int = 50) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches.

        The Mistral API supports batch embedding generation, which is more efficient
        than generating embeddings one at a time.

        Args:
            texts: List of texts to generate embeddings for
            batch_size: Maximum number of texts per API call (default: 50)

        Returns:
            List of embedding vectors, one per input text

        Raises:
            ValueError: If texts is empty or API key not configured
            Exception: If Mistral API call fails
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")

        # Filter out empty strings
        valid_texts = [t for t in texts if t and t.strip()]
        if len(valid_texts) != len(texts):
            logger.warning(f"Filtered out {len(texts) - len(valid_texts)} empty strings")

        if not valid_texts:
            raise ValueError("No valid texts to process")

        try:
            client = cls._get_client()
            all_embeddings = []

            # Process in batches
            for i in range(0, len(valid_texts), batch_size):
                batch = valid_texts[i:i + batch_size]
                logger.debug(f"Generating embeddings for batch {i // batch_size + 1} ({len(batch)} texts)")

                response = client.embeddings.create(
                    model=cls._model,
                    inputs=batch
                )

                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)

                logger.debug(f"Generated {len(batch_embeddings)} embeddings")

            logger.info(f"Successfully generated {len(all_embeddings)} embeddings")
            return all_embeddings

        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise

    @staticmethod
    def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Compute cosine similarity between two embedding vectors.

        Cosine similarity measures the cosine of the angle between two vectors,
        ranging from -1 (opposite) to 1 (identical). For embeddings, values
        are typically between 0 and 1, with higher values indicating greater similarity.

        Args:
            vec1: First embedding vector
            vec2: Second embedding vector

        Returns:
            Cosine similarity score (0 to 1, where 1 is most similar)

        Raises:
            ValueError: If vectors are empty or have different dimensions
        """
        if not vec1 or not vec2:
            raise ValueError("Vectors cannot be empty")

        if len(vec1) != len(vec2):
            raise ValueError(
                f"Vectors must have same dimension (got {len(vec1)} and {len(vec2)})"
            )

        # Convert to numpy arrays for efficient computation
        v1 = np.array(vec1)
        v2 = np.array(vec2)

        # Compute cosine similarity: dot(v1, v2) / (||v1|| * ||v2||)
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)

        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0

        similarity = dot_product / (norm_v1 * norm_v2)

        # Clip to [0, 1] range (embeddings should already be in this range)
        return float(max(0.0, min(1.0, similarity)))

    @classmethod
    def compute_similarities_batch(
        cls, query_vector: List[float], vectors: List[List[float]]
    ) -> List[float]:
        """
        Compute cosine similarities between a query vector and multiple vectors.

        More efficient than calling compute_cosine_similarity repeatedly.

        Args:
            query_vector: Query embedding vector
            vectors: List of embedding vectors to compare against

        Returns:
            List of similarity scores, one per input vector

        Raises:
            ValueError: If query_vector or vectors are empty
        """
        if not query_vector:
            raise ValueError("Query vector cannot be empty")

        if not vectors:
            raise ValueError("Vectors list cannot be empty")

        # Convert to numpy arrays
        query = np.array(query_vector)
        query_norm = np.linalg.norm(query)

        if query_norm == 0:
            return [0.0] * len(vectors)

        similarities = []
        for vec in vectors:
            v = np.array(vec)
            v_norm = np.linalg.norm(v)

            if v_norm == 0:
                similarities.append(0.0)
            else:
                dot_product = np.dot(query, v)
                similarity = dot_product / (query_norm * v_norm)
                similarities.append(float(max(0.0, min(1.0, similarity))))

        return similarities
