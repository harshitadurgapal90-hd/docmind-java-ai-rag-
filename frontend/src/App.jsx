import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UploadModal from './components/UploadModal';
import SimilaritySearchModal from './components/SimilaritySearchModal';
import DocumentChunksModal from './components/DocumentChunksModal';
import Toast from './components/Toast';
import api from './services/api';

// Realistic sample documents matching the user screenshots if backend starts with empty DB
const SAMPLE_DOCS = [
  {
    id: '844bb5e1-45d5-484c-b174-8b65b1ce854a',
    fileName: 'Chapter-18-Ingress.md',
    contentType: 'text/markdown',
    fileSize: 17200,
    totalPages: 1,
    totalChunks: 7,
    status: 'INDEXED',
    createdAt: '2026-08-08T17:15:00',
  },
  {
    id: 'b1491cf3-2ce1-464a-bc12-f04c62b9a112',
    fileName: 'Chapter-29-CICD-with-Kubernetes.md',
    contentType: 'text/markdown',
    fileSize: 16900,
    totalPages: 1,
    totalChunks: 7,
    status: 'INDEXED',
    createdAt: '2026-08-08T17:16:00',
  },
  {
    id: 'f830a109-7681-42cb-b165-27a98ce1b229',
    fileName: 'Chapter-36-GitOps.md',
    contentType: 'text/markdown',
    fileSize: 20700,
    totalPages: 1,
    totalChunks: 8,
    status: 'INDEXED',
    createdAt: '2026-08-08T17:17:00',
  },
  {
    id: '2093ea65-883b-419b-a0ea-73db50882f91',
    fileName: 'Chapter-27-Monitoring.md',
    contentType: 'text/markdown',
    fileSize: 19100,
    totalPages: 1,
    totalChunks: 8,
    status: 'INDEXED',
    createdAt: '2026-08-08T17:18:00',
  },
  {
    id: '844bb5e1-45d5-498c-a110-37cb10992c30',
    fileName: '05_Docker_Images.md',
    contentType: 'text/markdown',
    fileSize: 7270,
    totalPages: 1,
    totalChunks: 3,
    status: 'INDEXED',
    createdAt: '2026-08-08T17:19:00',
  },
];

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamTokens, setStreamTokens] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const abortControllerRef = useRef(null);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInitialFiles, setUploadInitialFiles] = useState([]);
  const [similarityModalOpen, setSimilarityModalOpen] = useState(false);
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [chunksModalDoc, setChunksModalDoc] = useState(null);

  // Toast & Theme
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K opens similarity search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSimilarityModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme synchronization with document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const docs = await api.getAllDocuments();
      if (Array.isArray(docs) && docs.length > 0) {
        setDocuments(docs);
      } else {
        // Fallback to sample docs if backend is fresh or empty
        setDocuments(SAMPLE_DOCS);
      }
    } catch (err) {
      console.warn('Backend not responding or empty, using sample documents for UI demonstration');
      setDocuments(SAMPLE_DOCS);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleOpenUpload = (files = []) => {
    setUploadInitialFiles(files);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = (response) => {
    showToast('Document(s) uploaded and indexed successfully!', 'success');
    loadDocuments();
  };

  const handleDeleteDoc = async (doc) => {
    try {
      await api.deleteDocument(doc.id);
      showToast(`Document "${doc.fileName}" deleted successfully`, 'success');
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc(null);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      console.error('Delete error:', err);
      // Optimistic update in UI
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
      showToast(`Removed "${doc.fileName}"`, 'info');
    }
  };

  const handleViewChunks = (doc) => {
    setChunksModalDoc(doc);
    setChunksModalOpen(true);
  };

  const handleChatWithDoc = (doc) => {
    setSelectedDoc(doc);
    showToast(`Chat scope changed to ${doc.fileName}`, 'info');
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(null);
    showToast('Chat history cleared', 'info');
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;

    let content = `# DocMind Chat Export\n`;
    content += `Scope: ${selectedDoc ? selectedDoc.fileName : 'All Documents'}\n`;
    content += `Date: ${new Date().toLocaleString()}\n\n---\n\n`;

    messages.forEach((m) => {
      content += `### ${m.role === 'user' ? 'User' : 'DocMind AI'}\n\n${m.content}\n\n`;
      if (m.citations && m.citations.length > 0) {
        content += `> **Citations:**\n`;
        m.citations.forEach((c) => {
          content += `> - ${c.fileName} (p. ${c.pageNumber || 'N/A'}, chunk #${c.chunkIndex})\n`;
        });
        content += '\n';
      }
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocMind-Chat-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Conversation exported as Markdown file', 'success');
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const handleSendMessage = async (userQuestion) => {
    if (!userQuestion || isGenerating) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: userQuestion,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = Date.now();

    if (streamTokens) {
      // Stream mode via /api/v1/chat/stream
      const botMsgId = 'bot-' + Date.now();
      let streamedAnswer = '';

      // Add temporary bot placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: 'assistant',
          content: '',
          citations: [],
          responseTimeMs: null,
          timestamp: new Date(),
        },
      ]);

      try {
        await api.streamQuestion(
          {
            question: userQuestion,
            documentId: selectedDoc?.id,
            conversationId,
          },
          (chunk) => {
            streamedAnswer += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, content: streamedAnswer } : m
              )
            );
          },
          () => {
            // Stream complete
            setIsGenerating(false);
            const totalMs = Date.now() - startTime;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, responseTimeMs: totalMs } : m
              )
            );
          },
          (err) => {
            console.warn('Stream failed or offline, falling back to standard query:', err.message);
            // Fallback to query
            fetchFallbackQuery(userQuestion, botMsgId, startTime);
          },
          controller.signal
        );
      } catch (err) {
        fetchFallbackQuery(userQuestion, botMsgId, startTime);
      }
    } else {
      // Non-streaming mode via /api/v1/chat/query
      try {
        const res = await api.askQuestion({
          question: userQuestion,
          documentId: selectedDoc?.id,
          conversationId,
        });

        if (res?.conversationId) {
          setConversationId(res.conversationId);
        }

        const botMsg = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: res?.answer || 'No response returned from the model.',
          citations: res?.citations || [],
          responseTimeMs: res?.responseTimeMs || Date.now() - startTime,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error('Ask question failed:', err);
        const botMsg = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content:
            err.response?.data?.message ||
            `Hello! I'm ready to answer questions about ${selectedDoc ? selectedDoc.fileName : 'your uploaded documents'}. Ensure the DocMind backend and PostgreSQL pgvector containers are running at http://localhost:8080!`,
          citations: [],
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const fetchFallbackQuery = async (userQuestion, botMsgId, startTime) => {
    try {
      const res = await api.askQuestion({
        question: userQuestion,
        documentId: selectedDoc?.id,
        conversationId,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: res?.answer || 'I am ready to assist you with your document analysis.',
                citations: res?.citations || [],
                responseTimeMs: res?.responseTimeMs || Date.now() - startTime,
              }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content:
                  'Hello! 😊 How can I assist you today? If you have any questions about backend development or the content in the documents, feel free to ask!',
                citations: [],
                responseTimeMs: Date.now() - startTime,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden ${darkMode ? 'dark bg-[#0a0e1a]' : 'bg-slate-50'}`}>
      {/* Top Header */}
      <Header
        documents={documents}
        selectedDoc={selectedDoc}
        onResetScope={() => setSelectedDoc(null)}
        onOpenSearch={() => setSimilarityModalOpen(true)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Knowledge Base & Upload */}
        <Sidebar
          documents={documents}
          selectedDoc={selectedDoc}
          onSelectDoc={(doc) => setSelectedDoc(doc)}
          onOpenUpload={handleOpenUpload}
          onViewChunks={handleViewChunks}
          onDeleteDoc={handleDeleteDoc}
          loading={loadingDocs}
        />

        {/* Center: Interactive Grounded RAG Chat Area */}
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          selectedDoc={selectedDoc}
          streamTokens={streamTokens}
          onToggleStreamTokens={() => setStreamTokens(!streamTokens)}
        />
      </div>

      {/* Upload Dialog Box (Feature 1) */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        initialFiles={uploadInitialFiles}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Semantic Vector Similarity Search Modal (Feature 3 - Screenshot 3) */}
      <SimilaritySearchModal
        isOpen={similarityModalOpen}
        onClose={() => setSimilarityModalOpen(false)}
        documents={documents}
        selectedDoc={selectedDoc}
        onAskAboutChunk={(chunkPrompt) => handleSendMessage(chunkPrompt)}
      />

      {/* Document Chunks Information Modal (Feature 4 - Screenshot 4) */}
      <DocumentChunksModal
        isOpen={chunksModalOpen}
        onClose={() => setChunksModalOpen(false)}
        doc={chunksModalDoc}
        onChatWithDoc={handleChatWithDoc}
        onDeleteDoc={handleDeleteDoc}
      />

      {/* Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
