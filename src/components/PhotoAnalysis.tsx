import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { ClockCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Text, Paragraph } = Typography;

interface PhotoAnalysisProps {
    analysis: {
        id: number;
        filePath: string;
        aiAnalysis: string;
        uploadedAt: string;
    };
}

const PhotoAnalysis: React.FC<PhotoAnalysisProps> = ({ analysis }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
        >
            <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all duration-300">
                <div className="flex items-start space-x-4">
                    {/* Image placeholder */}
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <RobotOutlined className="text-2xl text-cyan-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <Space className="mb-2">
                            <Tag color="cyan" icon={<RobotOutlined />}>
                                ИИ Анализ
                            </Tag>
                            <Text type="secondary" className="text-xs">
                                <ClockCircleOutlined className="mr-1" />
                                {formatDate(analysis.uploadedAt)}
                            </Text>
                        </Space>

                        <Paragraph className="!text-gray-200 !mb-0 leading-relaxed">
                            {analysis.aiAnalysis}
                        </Paragraph>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default PhotoAnalysis;
