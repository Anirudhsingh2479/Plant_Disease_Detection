import os
from dotenv import load_dotenv

# -----------------------------
# LangChain Imports
# -----------------------------
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

from langchain_core.prompts import ChatPromptTemplate

from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain

# -----------------------------
# Gemini Imports
# -----------------------------
from langchain_google_genai import ChatGoogleGenerativeAI

# -----------------------------
# API KEY SETUP
# -----------------------------
load_dotenv()

google_api_key = os.getenv("GOOGLE_API_KEY")

if not google_api_key:
    try:
        from google.colab import userdata
        google_api_key = userdata.get("GOOGLE_API_KEY")
    except:
        pass

if not google_api_key:
    raise ValueError("GOOGLE_API_KEY not found.")

os.environ["GOOGLE_API_KEY"] = google_api_key

print("🧠 Booting Plant Disease AI Assistant...")

# -----------------------------
# Load Disease Database
# -----------------------------
print("📚 Reading disease database...")

loader = TextLoader(
    "plant_disease.txt",
    encoding="utf-8"
)

documents = loader.load()

# -----------------------------
# Create Chunks
# -----------------------------
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2500,
    chunk_overlap=200
)

chunks = text_splitter.split_documents(documents)

print(f"📄 Generated {len(chunks)} chunks.")

# -----------------------------
# Local Embeddings
# -----------------------------
print("🔍 Loading embedding model...")

embeddings = HuggingFaceEmbeddings(
    # model_name="sentence-transformers/all-MiniLM-L6-v2"
    model_name="sentence-transformers/all-mpnet-base-v2"
)

# -----------------------------
# Create / Load FAISS
# -----------------------------
FAISS_PATH = "faiss_index"

if os.path.exists(FAISS_PATH):

    print("📦 Loading saved FAISS index...")

    vector_store = FAISS.load_local(
        FAISS_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )

else:

    print("🧠 Creating FAISS index...")

    vector_store = FAISS.from_documents(
        chunks,
        embeddings
    )

    vector_store.save_local(FAISS_PATH)

    print("✅ FAISS index saved.")

# -----------------------------
# Retriever
# -----------------------------
retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4}
)

# -----------------------------
# Prompt
# -----------------------------
system_prompt = """
You are an expert agricultural assistant.

Use the retrieved context and previous conversation history.

If the user asks follow-up questions like:
- What more can I do?
- Any prevention?
- What medicine should I use?

understand what disease they are referring to from chat history.

if answers does not match,say i don't know the answer

Respond completely in {language}.

Context:
{context}
"""
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}")
    ]
)
# -----------------------------
# Gemini 2.5 Flash
# -----------------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

# -----------------------------
# Build RAG Chain
# -----------------------------
question_answer_chain = create_stuff_documents_chain(
    llm,
    prompt
)



print("✅ Bot is ready!")
print("-" * 50)

store = {}

def get_session_history(session_id: str):

    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()

    return store[session_id]


rag_chain = create_retrieval_chain(
    retriever,
    question_answer_chain
)

conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer"
)

# -----------------------------
# Language Selection
# -----------------------------
print("\n🌐 Select Language")
print("1. English")
print("2. Hindi")

choice = input("Enter 1 or 2: ").strip()

if choice == "2":
    selected_language = "Hindi"
    print("\n✅ हिन्दी भाषा चुनी गई है")
else:
    selected_language = "English"
    print("\n✅ English selected")

# -----------------------------
# Chat Loop
# -----------------------------
while True:

    user_input = input("\n🧑‍🌾 You: ")

    if user_input.lower() in ["exit", "quit", "q"]:

        if selected_language == "Hindi":
            print("अलविदा! खेती के लिए शुभकामनाएँ।")
        else:
            print("Goodbye! Happy Farming.")

        break

    try:

        response = conversational_rag_chain.invoke(
      {
          "input": user_input,
          "language": selected_language
      },
      config={
          "configurable": {
              "session_id": "farmer_1"
          }
      }
  )

        print(f"\n🤖 Bot: {response['answer']}")

    except Exception as e:

        print(f"\n❌ Error: {e}")