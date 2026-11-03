import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import api from '../services/api';

export default function UploadModal({
  isOpen,
  onClose,
  initialFiles = [],
  onUploadSuccess,
}) {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Sync initialFiles if opened via drag-and-drop onto sidebar
  React.useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const formatted = initialFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'idle', // 'idle' | 'uploading' | 'processing' | 'indexed' | 'error'
        errorMessage: null,
      }));
      setFileList(formatted);
    } else {
      setFileList([]);
    }
    setOverallProgress(0);
    setUploading(false);
  }, [isOpen, initialFiles]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'idle',
        errorMessage: null,
      }));
      setFileList((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'idle',
        errorMessage: null,
      }));
      setFileList((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (id) => {
    if (uploading) return;
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async () => {
    if (fileList.length === 0 || uploading) return;

    setUploading(true);
    setOverallProgress(10);

    const rawFiles = fileList.map((item) => item.file);

    try {
      // Set all to uploading
      setFileList((prev) =>
        prev.map((item) => ({ ...item, status: 'uploading', progress: 30 }))
      );

      // Call batch upload endpoint
      const result = await api.uploadMultipleDocuments(rawFiles, (percent) => {
        setOverallProgress(Math.max(10, Math.min(85, percent)));
        setFileList((prev) =>
          prev.map((item) => ({
            ...item,
            progress: percent,
            status: percent >= 95 ? 'processing' : 'uploading',
          }))
        );
      });

      // Complete
      setOverallProgress(100);
      setFileList((prev) =>
        prev.map((item) => ({
          ...item,
          status: 'indexed',
          progress: 100,
        }))
      );

      // Notify parent to refresh document list
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Close modal automatically after brief success delay
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: try uploading one by one if batch had an issue
      try {
        for (let i = 0; i < fileList.length; i++) {
          const item = fileList[i];
          setFileList((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
          );
          await api.uploadSingleDocument(item.file, (p) => {
            setFileList((prev) =>
              prev.map((f, idx) => (idx === i ? { ...f, progress: p } : f))
            );
          });
          setFileList((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, status: 'indexed', progress: 100 } : f))
          );
        }
        setOverallProgress(100);
        if (onUploadSuccess) onUploadSuccess();
        setTimeout(() => onClose(), 1200);
      } catch (singleErr) {
        setFileList((prev) =>
          prev.map((item) => ({
            ...item,
            status: item.status === 'indexed' ? 'indexed' : 'error',
            errorMessage: singleErr.response?.data?.message || singleErr.message || 'Failed to process document',
          }))
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const hasFiles = fileList.length > 0;
  const allIndexed = hasFiles && fileList.every((f) => f.status === 'indexed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Upload Documents</h3>
              <p className="text-xs text-slate-400">
                Single or multiple files will be parsed, chunked, and indexed into PgVector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-500/30 hover:border-blue-400 bg-blue-950/20 hover:bg-blue-950/30 rounded-xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center mx-auto mb-3 text-blue-400 group-hover:scale-105 transition-all">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-blue-300">
              Click to browse or drag and drop files here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, DOCX, Markdown (.md), Plain Text (.txt), CSV (Max 25MB each)
            </p>
          </div>

          {/* Overall Progress Bar (Visible during upload) */}
          {uploading && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-blue-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading & Vector Indexing in progress...
                </span>
                <span className="text-slate-300 font-mono">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Files Queue List */}
          {hasFiles && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                <span>Selected Files ({fileList.length})</span>
                {!uploading && (
                  <button
                    onClick={() => setFileList([])}
                    className="text-xs text-red-400 hover:underline lowercase"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {fileList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatBytes(item.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {item.status === 'indexed' && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Indexed
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                            <Loader2 className="w-3 h-3 animate-spin" /> Chunking
                          </span>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-[11px] font-mono text-blue-400">
                            {item.progress}%
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}

                        {!uploading && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar per file if uploading */}
                    {uploading && (
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 rounded-full ${
                            item.status === 'indexed'
                              ? 'bg-emerald-500'
                              : item.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {item.errorMessage && (
                      <p className="text-[10px] text-red-400 mt-1">{item.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0b0f19] flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleUploadAll}
            disabled={!hasFiles || uploading || allIndexed}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-md ${
              !hasFiles || uploading || allIndexed
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 active:scale-95'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing & Indexing...</span>
              </>
            ) : allIndexed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>All Documents Indexed</span>
              </>
            ) : (
              <>
                <span>Upload & Index {fileList.length > 0 ? `(${fileList.length})` : ''}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
