import chromadb
from sentence_transformers import SentenceTransformer

_model = None
_collection = None

def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path="./chroma_db")
        _collection = client.get_collection("reef_knowledge")
    return _collection

def query_reef_knowledge(question: str, n_results: int = 3) -> list[dict]:
    """
    Query the reef knowledge base with a natural language question.
    Returns the most relevant document chunks.
    """
    model = _get_model()
    collection = _get_collection()

    embedding = model.encode(question).tolist()

    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results
    )

    output = []
    for i in range(len(results["ids"][0])):
        output.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "topic": results["metadatas"][0][i]["topic"],
            "relevance_score": round(1 - results["distances"][0][i], 3)
        })

    return output

if __name__ == "__main__":
    import json

    questions = [
        "What DHW level causes coral bleaching?",
        "How does wave height affect coral reefs?",
        "What happened during the 2016 bleaching event?"
    ]

    for q in questions:
        print(f"\nQ: {q}")
        results = query_reef_knowledge(q, n_results=2)
        for r in results:
            print(f"  [{r['topic']}] (score: {r['relevance_score']}) {r['text'][:100]}...")