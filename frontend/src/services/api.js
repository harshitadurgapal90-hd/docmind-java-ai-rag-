import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Document APIs
  async getAllDocuments() {
    try {
      const response = await client.get('/api/v1/documents');
      return response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch documents from backend:', error.message);
      throw error;
    }
  },

  async getDocumentById(id) {
    const response = await client.get(`/api/v1/documents/${id}`);
    return response.data?.data;
  },

  async uploadSingleDocument(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  async uploadMultipleDocuments(files, onProgress) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await client.post('/api/v1/documents/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  async deleteDocument(id) {
    const response = await client.delete(`/api/v1/documents/${id}`);
    return response.data;
  },

  async getDocumentChunks(id) {
    try {
      const response = await client.get(`/api/v1/documents/${id}/chunks`);
      return response.data?.data || [];
    } catch (error) {
      console.warn('Chunks endpoint returned error, trying fallback similarity search:', error.message);
      // Fallback: try similarity search with empty or wildcard query for this document
      try {
        const fallback = await client.post('/api/v1/chat/search/similarity', {
          query: 'overview content summary concepts details',
          documentId: id,
          topK: 20,
          similaritySearch: 0.0,
        });
        const matches = fallback.data?.data?.matches || [];
        return matches.map((m, idx) => ({
          id: m.documentId + '-' + idx,
          content: m.snippet,
          metadata: JSON.stringify({
            chunkIndex: m.chunkIndex ?? idx,
            pageNumber: m.pageNumber ?? 1,
            fileName: m.fileName,
          }),
        }));
      } catch (err) {
        return [];
      }
    }
  },

  // Chat APIs
  async askQuestion({ question, documentId, topK = 5, minSimilarity = 0.0, conversationId }) {
    const payload = {
      question,
      documentId: documentId || null,
      topK: Number(topK) || 5,
      minSimilarity: Number(minSimilarity) || 0.0,
      conversationId: conversationId || null,
    };
    const response = await client.post('/api/v1/chat/query', payload);
    return response.data?.data;
  },

  async streamQuestion({ question, documentId, topK = 5, minSimilarity = 0.0, conversationId }, onChunk, onDone, onError, signal) {
    const payload = {
      question,
      documentId: documentId || null,
      topK: Number(topK) || 5,
      minSimilarity: Number(minSimilarity) || 0.0,
      conversationId: conversationId || null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, text/plain, */*',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        // Handle SSE format "data: ..." or direct text tokens
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataContent = line.replace(/^data:/, '');
            if (dataContent.trim() === '[DONE]') continue;
            onChunk(dataContent);
          } else if (line.trim().length > 0) {
            onChunk(line);
          }
        }
      }
      if (onDone) onDone();
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
        if (onDone) onDone();
        return;
      }
      if (onError) onError(err);
    }
  },

  // Semantic similarity search
  async searchSimilarity({ query, documentId, topK = 10, similaritySearch = 0.0 }) {
    const payload = {
      query,
      documentId: documentId || null,
      topK: Number(topK) || 10,
      similaritySearch: Number(similaritySearch) || 0.0,
    };
    const response = await client.post('/api/v1/chat/search/similarity', payload);
    return response.data?.data;
  },
};

export default api;
