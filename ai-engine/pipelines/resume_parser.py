"""
HireMind — Resume Parser Pipeline
Standalone resume processing pipeline with FAISS indexing for retrieval.
"""

from pathlib import Path
import sys
import asyncio

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from services.resume_service import process_resume
from services.ai_service import get_embedding
from embeddings.faiss_store import get_vector_store

# Add ai-engine to path for faiss_store
sys.path.insert(0, str(Path(__file__).parent.parent))


async def index_resume(file_path: str, user_id: str, target_role: str = "Software Engineer") -> dict:
    """
    Process a resume file and add it to the FAISS index.
    Returns parsed data + embedding ID.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Resume not found: {file_path}")

    with open(path, "rb") as f:
        content = f.read()

    result = await process_resume(content, path.name, target_role)

    # Index in FAISS for retrieval
    store = get_vector_store()
    embedding_id = store.add(
        embedding=result["embedding"],
        metadata={
            "user_id": user_id,
            "filename": path.name,
            "skills": result["parsed_data"].get("skills", []),
            "experience_level": result["parsed_data"].get("experience_level"),
        }
    )

    print(f"✅ Resume indexed with ID {embedding_id}")
    print(f"   Skills: {result['parsed_data'].get('skills', [])}")
    print(f"   Level: {result['parsed_data'].get('experience_level')}")

    return {
        **result,
        "embedding_id": embedding_id,
    }


async def find_similar_resumes(query_text: str, top_k: int = 3) -> list:
    """
    Given a job description or query, find the most relevant resume
    embeddings using FAISS similarity search.
    """
    embedding = await get_embedding(query_text)
    store = get_vector_store()
    return store.search(embedding, top_k=top_k)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python resume_parser.py <path-to-resume.pdf>")
        sys.exit(1)

    result = asyncio.run(index_resume(sys.argv[1], user_id="test-user"))
    import json
    print("\n📄 Parsed Resume Data:")
    print(json.dumps(result["parsed_data"], indent=2))
