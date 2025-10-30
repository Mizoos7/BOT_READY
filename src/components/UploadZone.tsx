import React, { useRef, useState } from 'react';
import { Button, Card, Typography, message } from 'antd';
import { UploadOutlined, CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Text } = Typography;

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            onFileSelect(file);
        } else {
            message.error('Пожалуйста, выберите изображение');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileChange(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                }}
                className="hidden"
            />

            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Card
                    className={`
            border-2 border-dashed transition-all duration-300 cursor-pointer
            ${isDragOver
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : selectedFile
                                ? 'border-green-400 bg-green-400/10'
                                : 'border-gray-600 hover:border-cyan-400 hover:bg-gray-800/50'
                        }
          `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClick}
                >
                    <div className="text-center py-8">
                        <AnimatePresence mode="wait">
                            {selectedFile ? (
                                <motion.div
                                    key="selected"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-4">
                                        <div className="w-16 h-16 mx-auto bg-green-400/20 rounded-full flex items-center justify-center mb-4">
                                            <CameraOutlined className="text-2xl text-green-400" />
                                        </div>
                                        <Text className="text-green-400 font-medium">
                                            {selectedFile.name}
                                        </Text>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile();
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        Удалить
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <UploadOutlined className="text-2xl text-gray-400" />
                                    </div>
                                    <Text className="text-gray-300 text-lg mb-2 block">
                                        Перетащите фото сюда
                                    </Text>
                                    <Text className="text-gray-500 text-sm">
                                        или нажмите для выбора файла
                                    </Text>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>

            {selectedFile && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 text-center"
                >
                    <Button
                        type="primary"
                        size="large"
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 border-none hover:from-cyan-500 hover:to-blue-600"
                        loading={false} // Здесь будет состояние загрузки из контекста
                    >
                        <CameraOutlined />
                        Анализировать фото
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default UploadZone;
