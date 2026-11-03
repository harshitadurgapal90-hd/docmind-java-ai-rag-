import React from 'react';
import { Sparkles, Search, ExternalLink, Sun, Moon, Database, BookOpen, Layers } from 'lucide-react';

export default function Header({
  documents = [],
  selectedDoc = null,
  onResetScope,
  onOpenSearch,
  darkMode = true,
  onToggleTheme,
}) {
  const scopeText = selectedDoc
    ? `Scope: ${selectedDoc.fileName}`
    : `Scope: All Documents (${documents.length})`;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0a0e1a]/95 backdrop-blur px-5 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left: Brand & Stack */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-white tracking-tight">DocMind</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/70 border border-blue-800/60 rounded-full px-2 py-0.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-blue-400" />
              AI RAG
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Spring AI &bull; PostgreSQL pgvector &bull; OpenAI
          </p>
        </div>
      </div>

      {/* Center: Scope Pill */}
      <div className="hidden md:flex items-center justify-center">
        <button
          onClick={onResetScope}
          title="Click to reset to all documents"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
            selectedDoc
              ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60 shadow-sm shadow-blue-500/10'
              : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${selectedDoc ? 'bg-blue-400 animate-pulse' : 'bg-blue-500'}`} />
          <span className="max-w-[320px] truncate">{scopeText}</span>
          {selectedDoc && (
            <span className="text-[10px] bg-blue-800/60 hover:bg-blue-700 text-blue-200 px-1.5 py-0.5 rounded-full ml-1">
              Reset
            </span>
          )}
        </button>
      </div>

      {/* Right: Actions & Theme */}
      <div className="flex items-center space-x-3">
        {/* Search Chunks button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 text-xs font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-lg px-3 py-2 transition-all shadow-sm"
          title="Search Vector Chunks (Cmd+K / Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search Chunks</span>
          <kbd className="hidden sm:inline-block bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Swagger link */}
        <a
          href="http://localhost:8080/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-2 rounded-lg hover:bg-slate-800/70 transition-colors"
          title="Open Swagger OpenAPI Documentation"
        >
          <span>Swagger API</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
          title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>
    </header>
  );
}
