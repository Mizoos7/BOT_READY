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

// Утилити классы для типографики и переносов
const textSafe = 'break-words !leading-relaxed'; // переносы + комфортная высота строки [web:3]
const titleSafe = '!mb-0 break-words !leading-normal'; // без жесткого margin-bottom, переносы [web:3]

const HomePage: React.FC = () => {
  const { isAnalyzing, uploads } = useApp();
  const [showHistory, setShowHistory] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      message.success('Файл выбран! Нажмите "Анализировать" для обработки.');
    } else {
      message.error('Пожалуйста, выберите изображение');
    }
  };

  return (
    <TelegramWebApp>
      {/* min-h-dvh лучше для моб. WebView, чем min-h-screen */}
      <Layout className="min-h-dvh bg-black">
        <Header className="bg-black border-b border-gray-800 px-6">
          <div className="flex items-center justify-between py-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <RobotOutlined className="text-white text-xl" />
              </div>
              <Title level={3} className={`!text-white ${titleSafe}`}>
                AI Photo Analyzer
              </Title>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Button
                type="text"
                icon={<HistoryOutlined />}
                onClick={() => setShowHistory((v) => !v)}
                className="text-gray-300 hover:text-white"
              >
                История
              </Button>
            </motion.div>
          </div>
        </Header>

        <Content className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {/* Hero */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-8"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <StarOutlined className="text-white text-4xl" />
                </div>

                <Title level={1} className={`!text-white !mb-4 ${titleSafe}`}>
                  Анализ фото с ИИ
                </Title>

                <Paragraph className={`!text-gray-300 !text-lg max-w-2xl mx-auto ${textSafe}`}>
                  Загрузите фотографию и получите красивый, вдохновляющий анализ от искусственного интеллекта. Каждый прогноз уникален и креативен!
                </Paragraph>
              </motion.div>

              {/* Upload */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <UploadZone onFileSelect={handleFileSelect} />
              </motion.div>
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mb-12"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all">
                    <div className="flex flex-col items-center text-center gap-2">
                      <CameraOutlined className="text-4xl text-cyan-400" />
                      <Title level={4} className={`!text-white ${titleSafe}`}>Загрузите фото</Title>
                      <Paragraph className={`!text-gray-300 ${textSafe}`}>
                        Выберите любое изображение с вашего устройства
                      </Paragraph>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all">
                    <div className="flex flex-col items-center text-center gap-2">
                      <RobotOutlined className="text-4xl text-cyan-400" />
                      <Title level={4} className={`!text-white ${titleSafe}`}>ИИ анализ</Title>
                      <Paragraph className={`!text-gray-300 ${textSafe}`}>
                        Искусственный интеллект анализирует ваше фото
                      </Paragraph>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card className="bg-gray-900 border-gray-700 hover:border-cyan-400 transition-all">
                    <div className="flex flex-col items-center text-center gap-2">
                      <StarOutlined className="text-4xl text-cyan-400" />
                      <Title level={4} className={`!text-white ${titleSafe}`}>Красивый результат</Title>
                      <Paragraph className={`!text-gray-300 ${textSafe}`}>
                        Получите вдохновляющий и креативный прогноз
                      </Paragraph>
                    </div>
                  </Card>
                </Col>
              </Row>
            </motion.div>

            {/* History */}
            {showHistory && uploads.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
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

            {/* Loading */}
            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Spin size="large" />
                <Paragraph className={`!text-gray-300 mt-4 ${textSafe}`}>
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
