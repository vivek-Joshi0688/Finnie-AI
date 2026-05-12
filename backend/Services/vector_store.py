from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()

def load_vector_store():
    return FAISS.load_local("faiss_index", embeddings)

def search_docs(query):
    db = load_vector_store()
    return db.similarity_search(query)