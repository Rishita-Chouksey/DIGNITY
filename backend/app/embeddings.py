from functools import lru_cache
@lru_cache
def model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer('all-MiniLM-L6-v2')
def embed(text:str)->list[float]: return model().encode(text, normalize_embeddings=True).tolist()
