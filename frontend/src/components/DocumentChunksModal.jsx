import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Copy,
  Check,
  HardDrive,
  Layers,
  File,
  Calendar,
  Trash2,
  MessageSquare,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatBytes, formatDate, truncateUUID } from '../utils/formatters';
import api from '../services/api';

export default function DocumentChunksModal({
  isOpen,
  onClose,
  doc,
  onChatWithDoc,
  onDeleteDoc,
}) {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedChunkId, setCopiedChunkId] = useState(null);
  const [copiedDocId, setCopiedDocId] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen && doc) {
      setConfirmDelete(false);
      fetchChunks();
    } else {
      setChunks([]);
    }
  }, [isOpen, doc]);

  const fetchChunks = async () => {
    if (!doc?.id) return;
    setLoading(true);
    try {
      const data = await api.getDocumentChunks(doc.id);
      setChunks(data || []);
    } catch (err) {
      console.error('Failed to fetch chunks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const handleCopyDocId = () => {
    navigator.clipboard.writeText(doc.id);
    setCopiedDocId(true);
    setTimeout(() => setCopiedDocId(false), 2000);
  };

  const handleCopyChunk = (content, chunkId) => {
    navigator.clipboard.writeText(content);
    setCopiedChunkId(chunkId);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteDoc(doc);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Screenshot 4) */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 border border-blue-200 dark:border-blue-800/60 mt-0.5">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {doc.fileName}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                <span className="font-mono">{truncateUUID(doc.id)}</span>
                <button
                  onClick={handleCopyDocId}
                  className="hover:text-slate-200 transition-colors"
                  title="Copy Document UUID"
                >
                  {copiedDocId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span>&bull;</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {doc.status || 'INDEXED'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stats Cards Row (Screenshot 4) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          {/* Card 1: File Size */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#131d35] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>File Size</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {formatBytes(doc.fileSize)}
            </p>
          </div>

          {/* Card 2: Vector Chunks */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#131d35] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Vector Chunks</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {doc.totalChunks ?? chunks.length} Chunks
            </p>
          </div>

          {/* Card 3: Total Pages */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#131d35] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <File className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Pages</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {doc.totalPages ?? 1} Pages
            </p>
          </div>

          {/* Card 4: Uploaded */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#131d35] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Uploaded</span>
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-6 py-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <span>INDEXED VECTOR CHUNKS</span>
          <span>SAMPLE CHUNKS</span>
        </div>

        {/* Chunks List (Screenshot 4) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[46vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">Loading indexed vector chunks...</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              No chunk details available from vector database for this document.
            </div>
          ) : (
            chunks.map((chunk, idx) => {
              const chunkId = chunk.id || idx;
              let chunkIndex = idx;
              if (chunk.metadata) {
                try {
                  const meta = typeof chunk.metadata === 'string' ? JSON.parse(chunk.metadata) : chunk.metadata;
                  if (meta.chunkIndex !== undefined) chunkIndex = meta.chunkIndex;
                } catch {
                  // ignore
                }
              }

              return (
                <div
                  key={chunkId}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131d35] p-4 space-y-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      Chunk #{chunkIndex}
                    </span>
                    <button
                      onClick={() => handleCopyChunk(chunk.content, chunkId)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Copy chunk text"
                    >
                      {copiedChunkId === chunkId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#0a0e1a] p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {chunk.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer (Screenshot 4) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b0f19] flex items-center justify-between">
          {/* Delete Button (Left) */}
          <button
            onClick={handleDelete}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'text-red-500 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmDelete ? 'Confirm Delete Document?' : 'Delete Document'}</span>
          </button>

          {/* Right Actions: Close & Chat with Document */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                onChatWithDoc(doc);
                onClose();
              }}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat with Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
