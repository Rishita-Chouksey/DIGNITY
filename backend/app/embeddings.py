from functools import lru_cache
@lru_cache
def model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer('all-MiniLM-L6-v2')
def embed(text:str)->list[float]: return model().encode(text, normalize_embeddings=True).tolist()

def try_embed(text: str) -> list[float] | None:
    """Return no vector when the optional local model cannot load."""
    from .config import settings
    if not settings.embeddings_enabled:
        return None
    try:
        return embed(text)
    except Exception:
        return None
