"""
HireMind — FAISS Vector Store
Stores question/resume embeddings for semantic retrieval.
Use for resume-aware question targeting and question deduplication.
"""

import os
import json
import numpy as np
from pathlib import Path
from typing import Optional

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("⚠️  faiss-cpu not installed. Embedding retrieval disabled.")


class FAISSVectorStore:
    """
    Lightweight FAISS wrapper for storing and retrieving embeddings.
    dimension: 1536 for text-embedding-3-small, 768 for sentence-transformers
    """

    def __init__(self, dimension: int = 1536, index_path: Optional[str] = None):
        self.dimension = dimension
        self.index_path = Path(index_path) if index_path else \
            Path(__file__).parent / "index"
        self.index_path.mkdir(parents=True, exist_ok=True)
        self.index_file = self.index_path / "faiss.index"
        self.meta_file = self.index_path / "metadata.json"

        self.metadata: list = []
        self._load_or_create()

    def _load_or_create(self):
        if not FAISS_AVAILABLE:
            self.index = None
            return

        if self.index_file.exists():
            self.index = faiss.read_index(str(self.index_file))
            if self.meta_file.exists():
                with open(self.meta_file, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
        else:
            # L2 index — inner product after normalizing = cosine similarity
            self.index = faiss.IndexFlatL2(self.dimension)

    def add(self, embedding: list[float], metadata: dict) -> int:
        """Add a vector + metadata. Returns the vector's ID."""
        if not FAISS_AVAILABLE or self.index is None:
            return -1

        vec = np.array([embedding], dtype="float32")
        self.index.add(vec)
        idx = len(self.metadata)
        self.metadata.append(metadata)
        self._save()
        return idx

    def search(self, query_embedding: list[float], top_k: int = 5) -> list[dict]:
        """Return top-k most similar entries."""
        if not FAISS_AVAILABLE or self.index is None or self.index.ntotal == 0:
            return []

        query_vec = np.array([query_embedding], dtype="float32")
        distances, indices = self.index.search(query_vec, min(top_k, self.index.ntotal))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.metadata):
                results.append({
                    "score": float(1 / (1 + dist)),  # convert L2 to similarity
                    "metadata": self.metadata[idx],
                })
        return results

    def _save(self):
        if not FAISS_AVAILABLE or self.index is None:
            return
        faiss.write_index(self.index, str(self.index_file))
        with open(self.meta_file, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2)

    def count(self) -> int:
        if self.index is None:
            return 0
        return self.index.ntotal


# ── Singleton ────────────────────────────────────────────────────────
_store: Optional[FAISSVectorStore] = None


def get_vector_store() -> FAISSVectorStore:
    global _store
    if _store is None:
        index_path = os.environ.get(
            "FAISS_INDEX_PATH",
            str(Path(__file__).parent / "index")
        )
        _store = FAISSVectorStore(dimension=1536, index_path=index_path)
    return _store
