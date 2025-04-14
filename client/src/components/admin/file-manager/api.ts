import axios from 'axios';
import { File, Folder } from './types';

const API_BASE = '/api';

// Folder endpoints
export const getFolders = async (): Promise<Folder[]> => {
  const response = await axios.get(`${API_BASE}/folders`);
  return response.data;
};

export const getFolder = async (folderId: string | null): Promise<{ folder: Folder, subfolders: Folder[], files: File[] }> => {
  const url = folderId ? `${API_BASE}/folders/${folderId}` : `${API_BASE}/folders/root`;
  const response = await axios.get(url);
  return response.data;
};

export const createFolder = async (name: string, parentId: string | null): Promise<Folder> => {
  const response = await axios.post(`${API_BASE}/folders`, { name, parentId });
  return response.data;
};

export const updateFolder = async (folderId: string, data: Partial<Folder>): Promise<Folder> => {
  const response = await axios.patch(`${API_BASE}/folders/${folderId}`, data);
  return response.data;
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/folders/${folderId}`);
};

// File endpoints
export const getFiles = async (folderId: string | null = null): Promise<File[]> => {
  const params = folderId ? { folderId } : {};
  const response = await axios.get(`${API_BASE}/files`, { params });
  return response.data;
};

export const getFile = async (fileId: string): Promise<File> => {
  const response = await axios.get(`${API_BASE}/files/${fileId}`);
  return response.data;
};

export const uploadFile = async (file: File, folderId: string | null = null, onProgress?: (progress: number) => void): Promise<File> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (folderId) {
    formData.append('folderId', folderId);
  }
  
  const response = await axios.post(`${API_BASE}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  
  return response.data;
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/files/${fileId}`);
};

export const updateFile = async (fileId: string, data: Partial<File>): Promise<File> => {
  const response = await axios.patch(`${API_BASE}/files/${fileId}`, data);
  return response.data;
};

export const moveFiles = async (fileIds: string[], targetFolderId: string | null): Promise<void> => {
  await axios.post(`${API_BASE}/files/bulk`, {
    action: 'move',
    fileIds,
    targetFolderId
  });
};

export const getBreadcrumbs = async (folderId: string | null): Promise<{ id: string | null; name: string }[]> => {
  if (!folderId) {
    return [{ id: null, name: 'Home' }];
  }
  
  const response = await axios.get(`${API_BASE}/folders/${folderId}/breadcrumbs`);
  return [{ id: null, name: 'Home' }, ...response.data];
};

export const downloadFile = (fileId: string): void => {
  window.open(`${API_BASE}/files/${fileId}/download`, '_blank');
};

export const searchFiles = async (query: string): Promise<File[]> => {
  const response = await axios.get(`${API_BASE}/files/search`, { 
    params: { q: query } 
  });
  return response.data;
};

export const toggleFileFavorite = async (fileId: string, isFavorite: boolean): Promise<File> => {
  const response = await axios.patch(`${API_BASE}/files/${fileId}`, { 
    isFavorite 
  });
  return response.data;
};