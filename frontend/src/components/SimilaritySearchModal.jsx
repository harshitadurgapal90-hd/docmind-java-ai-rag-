import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Sparkles,
  FileText,
  Copy,
  Check,
  MessageSquare,
  Loader2,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import api from '../services/api';

export default function SimilaritySearchModal({
  isOpen,
  onClose,
  documents = [],
  selectedDoc = null,
  onAskAboutChunk,
}) {
  const [query, setQuery] = useState('');
  const [scopedDocId, setScopedDocId] = useState('');
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(null);

  // Set initial scoped doc if selected in app
  useEffect(() => {
    if (selectedDoc) {
      setScopedDocId(selectedDoc.id);
    } else {
      setScopedDocId('');
    }
  }, [selectedDoc, isOpen]);

  // Handle Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.searchSimilarity({
        query: query.trim(),
        documentId: scopedDocId || null,
        topK: Number(topK) || 5,
        similaritySearch: Number(similarityThreshold) || 0.0,
      });
      setResults(data);
    } catch (err) {
      console.error('Similarity search error:', err);
      setError(err.response?.data?.message || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySnippet = (snippet, index) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Screenshot 3) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Search className="w-5 h-5 text-blue-500 stroke-[2.2]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Semantic Vector Similarity Search
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Row (Screenshot 3) */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search concepts, clauses, or facts across vector chunks..."
                className="w-full bg-slate-50 dark:bg-[#131d35] border border-blue-400/40 dark:border-blue-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </button>
          </form>

          {/* Scope and Filter bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center space-x-2">
              <span>Scope:</span>
              <select
                value={scopedDocId}
                onChange={(e) => setScopedDocId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Documents</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fileName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-500 transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{showAdvanced ? 'Hide options' : 'Options (Top-K)'}</span>
            </button>
          </div>

          {/* Advanced options drawer */}
          {showAdvanced && (
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <label className="flex items-center space-x-2">
                <span>Top K Chunks:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-14 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-center"
                />
              </label>

              <label className="flex items-center space-x-2">
                <span>Threshold:</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(e.target.value)}
                  className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-center"
                />
              </label>
            </div>
          )}
        </div>

        {/* Modal Results / Empty State */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[260px] max-h-[50vh]">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
              {error}
            </div>
          )}

          {!results && !loading && !error && (
            /* Screenshot 3 empty state: sparkle icon and message */
            <div className="h-full py-16 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-400">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm">
                Type a search term above to inspect matching vector chunks.
              </p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Matching Vector Chunks ({results.totalMatches ?? results.matches?.length ?? 0})</span>
                <span>Query: "{results.query}"</span>
              </div>

              {results.matches?.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No matching vector chunks found for this query.
                </div>
              ) : (
                results.matches?.map((chunk, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#131d35] border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {chunk.fileName || 'Document'}
                        </span>
                        {chunk.chunkIndex !== null && chunk.chunkIndex !== undefined && (
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            Chunk #{chunk.chunkIndex}
                          </span>
                        )}
                        {chunk.pageNumber && (
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                            Page {chunk.pageNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {chunk.similarityScore !== null && chunk.similarityScore !== undefined && (
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Score: {chunk.similarityScore.toFixed(3)}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopySnippet(chunk.snippet, index)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                          title="Copy snippet"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Chunk Snippet */}
                    <div className="p-3 rounded-lg bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-slate-800/80 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {chunk.snippet}
                    </div>

                    {/* Ask about this chunk */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          onAskAboutChunk(`Regarding chunk #${chunk.chunkIndex ?? index} from ${chunk.fileName}: explain or summarize this content:\n\n${chunk.snippet.substring(0, 300)}...`);
                          onClose();
                        }}
                        className="flex items-center space-x-1.5 text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask AI about this chunk</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
