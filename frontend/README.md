# DocMind Frontend Application

A production-ready, modern React.js frontend for **DocMind AI Document Assistant**, built with Tailwind CSS, Lucide icons, and Axios. Designed to seamlessly connect with the Spring AI + PostgreSQL pgvector + OpenAI backend.

## 🚀 Features

1. **Document Management & Knowledge Base**:
   - Upload single or multiple documents (`.pdf`, `.docx`, `.md`, `.txt`, `.csv`) with real-time progress bars.
   - Live indexing status indicators (`INDEXED`, `PROCESSING`, `FAILED`).
   - File search / filter across uploaded documents.
   - Corpus-wide or scoped document chat mode.
   - Delete document with automatic vector store purge.

2. **AI Document Assistant & Chat Area**:
   - Real-time token streaming with SSE (`/api/v1/chat/stream`) and fallback standard query (`/api/v1/chat/query`).
   - 4 Instant Feature Templates:
     - 📄 **Summarize Key Points**
     - ❓ **Interview / Q&A Insights**
     - 📝 **Action Items & Deadlines**
     - 🔍 **Technical Concepts**
   - Grounded citations cards with file name, page numbers, chunk index, similarity scores, and expandable text snippets.
   - Copy to clipboard & export conversation to Markdown file.

3. **Semantic Vector Similarity Search (`⌘K` / `Ctrl+K`)**:
   - Search concepts, clauses, or facts directly across PgVector chunks.
   - Scoped search by document or across entire corpus.
   - Adjustable Top-K chunks and similarity threshold parameters.
   - Inspect matching text snippets and prompt AI directly from vector chunks.

4. **Document Chunks Information Modal**:
   - Document metadata stats: File Size, Vector Chunks, Total Pages, Upload Date.
   - Full list of indexed vector chunks with chunk index, preformatted code viewer, and copy actions.
   - One-click document deletion and "Chat with Document" shortcut.

5. **Theme & UX**:
   - Dark theme matching DocMind aesthetic with seamless light-mode toggle.
   - Responsive layout for desktop and mobile viewports.

---

## 🛠 Tech Stack

- **React 19**
- **Vite**
- **Tailwind CSS v3**
- **Lucide React** (Icons)
- **Axios** (API requests & upload progress)
- **React Markdown** & **Remark GFM** (Formatted AI responses)

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app will run at `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.

### 3. Build for Production
```bash
npm run build
```
The optimized bundle will be generated in `frontend/dist/`.
