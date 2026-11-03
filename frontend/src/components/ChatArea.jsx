import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Download,
  RotateCcw,
  FileText,
  Copy,
  Check,
  User,
  Bot,
  Zap,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FEATURE_TEMPLATES = [
  {
    id: 'summarize',
    icon: '📄',
    title: 'Summarize Key Points',
    prompt: 'Summarize the key points and executive highlights of this document.',
    description: 'Summarize the key points and executive highlights of this document.',
  },
  {
    id: 'qa',
    icon: '❓',
    title: 'Interview / Q&A Insights',
    prompt: 'What are the most critical questions and answers covered in this text?',
    description: 'What are the most critical questions and answers covered in this text?',
  },
  {
    id: 'action_items',
    icon: '📝',
    title: 'Action Items & Deadlines',
    prompt: 'List all actionable takeaways, deadlines, and responsibilities mentioned.',
    description: 'List all actionable takeaways, deadlines, and responsibilities mentioned.',
  },
  {
    id: 'tech_concepts',
    icon: '🔍',
    title: 'Technical Concepts',
    prompt: 'Explain the main technical concepts and architecture described in this document.',
    description: 'Explain the main technical concepts and architecture described in this document.',
  },
];

export default function ChatArea({
  messages = [],
  onSendMessage,
  onClearChat,
  onExportChat,
  isGenerating = false,
  onStopGeneration,
  selectedDoc = null,
  streamTokens = true,
  onToggleStreamTokens,
}) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedCitationId, setExpandedCitationId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Adjust textarea height dynamically
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isGenerating) return;

    onSendMessage(textToSend.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const contextLabel = selectedDoc
    ? selectedDoc.fileName
    : 'All Uploaded Documents';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e1a] relative overflow-hidden">
      {/* Top Bar of Chat Section */}
      <div className="h-12 border-b border-slate-800/80 px-6 flex items-center justify-between text-xs text-slate-400 bg-[#0a0e1a]/80 backdrop-blur z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
          <span>
            Context:{' '}
            <strong className="text-slate-200 font-medium">
              {contextLabel}
            </strong>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Stream Tokens toggle switch */}
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <span className="text-xs text-slate-300">Stream Tokens</span>
            <div
              onClick={onToggleStreamTokens}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                streamTokens ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${
                  streamTokens ? 'left-[19px]' : 'left-[3px]'
                }`}
              />
            </div>
          </label>

          {/* Export Chat */}
          {messages.length > 0 && (
            <button
              onClick={onExportChat}
              className="flex items-center space-x-1 hover:text-slate-200 transition-colors"
              title="Export conversation"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="flex items-center space-x-1 hover:text-slate-200 transition-colors"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State / Feature Templates (Screenshot 1) */
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-5 ring-4 ring-blue-500/10">
              <Sparkles className="w-7 h-7" />
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
              DocMind AI Document Assistant
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-lg mb-8 leading-relaxed">
              Upload PDF reports, Word files, or notes and chat naturally with grounded facts,
              source citations, and page numbers.
            </p>

            {/* 2x2 Feature Templates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
              {FEATURE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSubmit(tpl.prompt)}
                  className="p-4 rounded-xl bg-[#111728] hover:bg-[#162038] border border-slate-800/80 hover:border-blue-500/40 transition-all text-left group shadow-sm hover:shadow-md hover:shadow-blue-500/5 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                    <span>{tpl.icon}</span>
                    <span>{tpl.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages History (Screenshot 2) */
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isBot = msg.role === 'assistant';

            return (
              <div
                key={msg.id || index}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot Avatar */}
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative group max-w-2xl rounded-2xl p-4 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-600/20'
                      : 'bg-[#121929] border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {/* Message Content */}
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div>
                      <div className="markdown-body text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Grounded Citations (if present) */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Bookmark className="w-3 h-3 text-blue-400" />
                            Grounded Citations ({msg.citations.length})
                          </p>
                          <div className="space-y-1.5">
                            {msg.citations.map((c, cIdx) => {
                              const isExp = expandedCitationId === `${index}-${cIdx}`;
                              return (
                                <div
                                  key={cIdx}
                                  className="text-xs bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5 transition-all"
                                >
                                  <div
                                    onClick={() =>
                                      setExpandedCitationId(isExp ? null : `${index}-${cIdx}`)
                                    }
                                    className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white"
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                      <span className="font-medium truncate">{c.fileName || 'Document'}</span>
                                      {c.pageNumber && (
                                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                          p. {c.pageNumber}
                                        </span>
                                      )}
                                      {c.chunkIndex !== null && (
                                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                          chunk #{c.chunkIndex}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1.5 shrink-0">
                                      {c.similarityScore !== undefined && c.similarityScore !== null && (
                                        <span className="text-[10px] text-emerald-400 font-mono">
                                          {(100 - c.similarityScore * 100).toFixed(0)}% match
                                        </span>
                                      )}
                                      {isExp ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                      )}
                                    </div>
                                  </div>

                                  {isExp && (
                                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-mono bg-slate-950/70 p-2 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                                      {c.snippet}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer Info: Response time & Copy button */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                        <div>
                          {msg.responseTimeMs && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              {msg.responseTimeMs} ms
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyMessage(msg.content, msg.id || index)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Copy answer"
                        >
                          {copiedId === (msg.id || index) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live streaming indicator */}
        {isGenerating && (
          <div className="flex items-center space-x-2 text-xs text-blue-400 animate-pulse pl-11">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>DockMind is synthesizing answer with vector context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Section */}
      <div className="p-4 md:px-8 border-t border-slate-800/80 bg-[#0a0e1a]/95 backdrop-blur shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Input Box Container */}
          <div className="relative bg-[#0d1424] border border-slate-800 hover:border-slate-700 focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl px-4 py-2.5 transition-all shadow-lg flex items-center gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDoc
                  ? `Ask a question about ${selectedDoc.fileName}...`
                  : 'Ask a question across all documents...'
              }
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-36 py-1 leading-relaxed"
            />

            {/* Action button: Send or Stop */}
            {isGenerating ? (
              <button
                onClick={onStopGeneration}
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  input.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 scale-100'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Footer Hints */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <p>
              Press <kbd className="font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send, <kbd className="font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd> for newline
            </p>
            <div className="flex items-center space-x-1 text-blue-400 font-medium">
              <Zap className="w-3 h-3 text-blue-400" />
              <span>Grounded RAG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
