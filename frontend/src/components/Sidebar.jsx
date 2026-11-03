import React, { useState } from 'react';
import {
  Database,
  UploadCloud,
  FileText,
  Search,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Info,
  Files
} from 'lucide-react';
import { formatBytes, truncateString } from '../utils/formatters';

export default function Sidebar({
  documents = [],
  selectedDoc = null,
  onSelectDoc,
  onOpenUpload,
  onViewChunks,
  onDeleteDoc,
  loading = false,
}) {
  const [filterText, setFilterText] = useState('');

  const filteredDocs = documents.filter((doc) =>
    (doc.fileName || '').toLowerCase().includes(filterText.toLowerCase())
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onOpenUpload(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <aside className="w-80 md:w-84 lg:w-92 h-full flex flex-col bg-[#0b0f19] border-r border-slate-800/80 select-none shrink-0 overflow-hidden">
      {/* Knowledge Base Header */}
      <div className="p-4 border-b border-slate-800/70">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Knowledge Base</h2>
            <p className="text-[11px] text-slate-400">Indexed vector documents</p>
          </div>
        </div>

        {/* Upload drop box */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => onOpenUpload()}
          className="mt-3.5 border-2 border-dashed border-blue-500/30 hover:border-blue-400 bg-gradient-to-b from-blue-950/20 to-blue-900/10 hover:from-blue-950/40 hover:to-blue-900/20 rounded-xl p-4 text-center cursor-pointer transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center mx-auto mb-2 text-blue-400 group-hover:scale-105 group-hover:text-blue-300 transition-all">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-blue-400 group-hover:text-blue-300">
            Upload document or drag here
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            PDF, Word, Markdown, TXT, CSV (max 25MB)
          </p>
        </div>
      </div>

      {/* Scope Selector: All Documents */}
      <div className="px-3 pt-3">
        <button
          onClick={() => onSelectDoc(null)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
            selectedDoc === null
              ? 'bg-blue-600/15 border border-blue-500/40 text-blue-300 shadow-sm'
              : 'bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2 rounded-lg ${
                selectedDoc === null
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Files className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200">All Documents</p>
              <p className="text-[11px] text-slate-400 truncate">
                Search across complete corpus
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 ${
              selectedDoc === null
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {documents.length}
          </span>
        </button>

        {/* Filter input */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Document Section Subheader */}
      <div className="px-4 py-2 mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <span>Documents ({filteredDocs.length})</span>
        <span>Status</span>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {loading && documents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span>Loading documents...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            {filterText ? 'No matching documents found' : 'No documents uploaded yet'}
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            const isIndexed = doc.status === 'INDEXED';
            const isFailed = doc.status === 'FAILED';
            const isProcessing = doc.status === 'PROCESSING' || doc.status === 'UPLOADING';

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-sm'
                    : 'bg-slate-900/40 hover:bg-slate-850 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Top Row: File icon + File name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-blue-300' : 'text-slate-200'
                        }`}
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatBytes(doc.fileSize)} &bull; {doc.totalPages ? `${doc.totalPages}p` : '1p'}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Inspect Chunks & Delete) on hover */}
                  <div className="flex items-center space-x-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewChunks(doc);
                      }}
                      title="Inspect Chunks and Metadata"
                      className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDoc(doc);
                      }}
                      title="Delete document"
                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Chunks count + Status */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>{doc.totalChunks ?? 0} chunks</span>
                  </div>

                  <div>
                    {isIndexed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Indexed
                      </span>
                    ) : isProcessing ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Indexing
                      </span>
                    ) : isFailed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-950/50 border border-red-800/40 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        {doc.status || 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
