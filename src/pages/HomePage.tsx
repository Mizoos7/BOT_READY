import React, { useState } from 'react';
import {
    Layout,
    Typography,
    Button,
    Card,
    Space,
    Divider,
    Spin,
    message,
    Row,
    Col
} from 'antd';
import {
    CameraOutlined,
    RobotOutlined,
    HistoryOutlined,
    StarOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import PhotoAnalysis from '../components/PhotoAnalysis.tsx';
import UploadZone from '../components/UploadZone.tsx';
import TelegramWebApp from '../components/TelegramWebApp.tsx';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const HomePage: React.FC = () => {
    const { isAnalyzing, uploads } = useApp();
    const [showHistory, setShowHistory] = useState(false);

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            // Здесь будет логика загрузки через контекст
            message.success('Файл выбран! Нажмите "Анализировать" для обработки.');
        } else {
            message.error('Пожалуйста, выберите изображение');
        }
    };

    return (
        <TelegramWebApp>
            <Layout className="min-h-screen bg-black">
                <Header className="bg-black border-b border-gray-800 px-6">
                    <div className="flex items-center justify-between h-full">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <RobotOutlined className="text-white text-xl" />
                            </div>
                            <Title level={3} className="!text-white !mb-0">
                                AI Photo Analyzer
                            </Title>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Button
                                type="text"
                                icon={<HistoryOutlined />}
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-gray-300 hover:text-white"
                            >
                                История
                            </Button>
                        </motion.div>
                    </div>
                </Header>

                <Content className="px-6 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="mb-8"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                                    <StarOutlined className="text-white text-4xl" />
                                </div>
                                <Title level={1} className="!text-white !mb-4">
                                    Анализ фото с ИИ
                                </Title>
                                <Paragraph className="!text-gray-300 !text-lg max-w-2xl mx-auto">
                                    Загрузите фотографию и получите красивый, вдохновляющий анализ от искусственного интеллекта.
                                    Каждый прогноз уникален и креативен!
                                </Paragraph>
                            </motion.div>

                            {/* Upload Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                <UploadZone onFileSelect={handleFileSelect} />
                            </motion.div>
                        </div>

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="mb-12"
                        >
                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={8}>
                                    <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all duration-300">
                                        <div className="text-center">
                                            <CameraOutlined className="text-4xl text-cyan-400 mb-4" />
                                            <Title level={4} className="!text-white">Загрузите фото</Title>
                                            <Paragraph className="!text-gray-300">
                                                Выберите любое изображение с вашего устройства
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all duration-300">
                                        <div className="text-center">
                                            <RobotOutlined className="text-4xl text-cyan-400 mb-4" />
                                            <Title level={4} className="!text-white">ИИ анализ</Title>
                                            <Paragraph className="!text-gray-300">
                                                Искусственный интеллект анализирует ваше фото
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all duration-300">
                                        <div className="text-center">
                                            <StarOutlined className="text-4xl text-cyan-400 mb-4" />
                                            <Title level={4} className="!text-white">Красивый результат</Title>
                                            <Paragraph className="!text-gray-300">
                                                Получите вдохновляющий и креативный прогноз
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </motion.div>

                        {/* History Section */}
                        {showHistory && uploads.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.5 }}
                                className="mb-8"
                            >
                                <Divider className="border-gray-700">
                                    <Text className="text-gray-300">История анализов</Text>
                                </Divider>
                                <Space direction="vertical" size="large" className="w-full">
                                    {uploads.map((upload) => (
                                        <PhotoAnalysis key={upload.id} analysis={upload} />
                                    ))}
                                </Space>
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {isAnalyzing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <Spin size="large" />
                                <Paragraph className="!text-gray-300 mt-4">
                                    Анализируем ваше фото...
                                </Paragraph>
                            </motion.div>
                        )}
                    </motion.div>
                </Content>

                <Footer className="bg-black border-t border-gray-800 text-center">
                    <Text className="text-gray-400">
                        AI Photo Analyzer • Создано с помощью React 19 + TypeScript + Ant Design
                    </Text>
                </Footer>
            </Layout>
        </TelegramWebApp>
    );
};

export default HomePage;
