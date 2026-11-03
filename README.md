# DocMind – AI-Powered Document Intelligence & RAG Backend

DocMind is an AI-powered document intelligence application built using **Java 17, Spring Boot, and Spring AI**. It allows users to upload documents and ask questions based on their content.

The application implements **Retrieval-Augmented Generation (RAG)** using Google Gemini and PostgreSQL PGVector to retrieve relevant document information and generate context-aware answers.

## Key Features

- **Multi-format Document Processing:** Uses `PagePdfDocumentReader` for page-wise PDF processing and `TikaDocumentReader` with Apache Tika for other supported document formats.
- **Text Chunking:** Splits extracted content into smaller chunks using a configurable text splitter.
- **Embedding Generation:** Generates vector embeddings using Google Gemini.
- **Vector Storage:** Stores document embeddings and metadata in PostgreSQL using PGVector.
- **Semantic Search:** Retrieves relevant document chunks using vector similarity search.
- **AI-Powered Q&A:** Uses Spring AI `ChatClient` with Google Gemini to generate answers based on retrieved document content.
- **Document-Scoped Q&A:** Supports asking questions in the context of a selected document.

## How It Works – RAG Pipeline

1. **Document Upload:** Users upload documents through Spring Boot REST APIs.
2. **Text Extraction:** `PagePdfDocumentReader` processes PDFs page by page, while `TikaDocumentReader` handles other supported formats.
3. **Chunking:** Extracted text is split into smaller chunks using a text splitter (600-character chunk size and 100-character overlap).
4. **Embedding:** Google Gemini generates embeddings for the document chunks.
5. **Storage:** Embeddings and document metadata are stored in PostgreSQL using PGVector.
6. **Retrieval:** User questions are converted into embeddings, and PGVector performs semantic similarity search to retrieve relevant chunks.
7. **Response Generation:** Spring AI `ChatClient` sends the user's question along with the retrieved context to Gemini and returns an AI-generated response.

## Technology Stack

| Category | Technologies |
|---       |---|
| Programming Language | Java 17 |
| Backend Framework | Spring Boot |
| AI Integration | Spring AI, Google Gemini |
| LLM Interaction | Spring AI ChatClient |
| RAG | Retrieval-Augmented Generation |
| Document Processing | PagePdfDocumentReader, TikaDocumentReader, Apache Tika |
| Text Processing | Spring AI Text Splitter |
| Embeddings | Gemini Embedding Model |
| Vector Database | PostgreSQL, PGVector |
| ORM | Spring Data JPA, Hibernate |
| API Development | REST APIs |
| Containerization | Docker, Docker Compose |
| Frontend | React, Vite |

## Architecture

```text
             User
               |
               v
         React Frontend
               |
               v
       Spring Boot REST APIs
               |
        Document Upload
               |
               v
       Document Processing
          /          \
         v            v
 PagePdfDocument   TikaDocument
     Reader           Reader
         \            /
          v          v
          Text Extraction
                 |
                 v
            Text Chunking
                 |
                 v
          Gemini Embeddings
                 |
                 v
        PostgreSQL + PGVector
                 |
                 v
           User Question
                 |
                 v
          Query Embedding
                 |
                 v
        Semantic Similarity Search
                 |
                 v
          Relevant Chunks(Chunks context + Query)
                 |
                 v
         Spring AI ChatClient
                 |
                 v
           Google Gemini
                 |
                 v
          AI-Generated Answer
```

## Running the Project Locally

### Prerequisites

- Java 17
- Docker Desktop
- Node.js and npm
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/harshitadurgapal90-hd/docmind-java-ai-rag-.git
cd docmind-java-ai-rag-
```

### 2. Configure Environment Variables

Configure these environment variables before starting the backend:

```properties
GEMINI_API_KEY=your_gemini_api_key
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password
```

Keep API keys and passwords private. Never commit secrets to GitHub.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run the Spring Boot Backend

**Windows:**

```bash
.\mvnw.cmd spring-boot:run
```

**macOS/Linux:**

```bash
./mvnw spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL displayed in the terminal.

## What This Project Demonstrates

- Building RESTful backend services using Java and Spring Boot.
- Integr
