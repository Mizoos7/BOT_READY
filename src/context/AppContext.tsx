import React, { createContext, useContext, useState, useCallback } from 'react';
import { message } from 'antd';
import axios from 'axios';

interface PhotoAnalysis {
    id: number;
    filePath: string;
    aiAnalysis: string;
    uploadedAt: string;
}

interface AppContextType {
    isAnalyzing: boolean;
    uploads: PhotoAnalysis[];
    uploadPhoto: (file: File) => Promise<void>;
    getUploads: (telegramId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploads, setUploads] = useState<PhotoAnalysis[]>([]);

    const uploadPhoto = useCallback(async (file: File) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                message.success('Фото успешно проанализировано!');
                // Добавляем новый анализ в список
                const newAnalysis: PhotoAnalysis = {
                    id: Date.now(),
                    filePath: response.data.filePath,
                    aiAnalysis: response.data.analysis,
                    uploadedAt: new Date().toISOString(),
                };
                setUploads(prev => [newAnalysis, ...prev]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Ошибка при загрузке фото');
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const getUploads = useCallback(async (telegramId: string) => {
        try {
            const response = await axios.get(`/api/user/${telegramId}/uploads`);
            setUploads(response.data);
        } catch (error) {
            console.error('Error fetching uploads:', error);
        }
    }, []);

    return (
        <AppContext.Provider
            value={{
                isAnalyzing,
                uploads,
                uploadPhoto,
                getUploads,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
