import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Platform } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import HousingListScreen from './src/screens/HousingListScreen';
import HousingDetailScreen from './src/screens/HousingDetailScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { getEstateRecommendation } from './src/api/client';
import { initNotifications } from './src/notifications';
import { requestAppPermissions } from './src/permissions';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [chatConfig, setChatConfig] = useState(null); // { mode, id?, name? }
  const [showHousingDetail, setShowHousingDetail] = useState(false);
  const [houseIndex, setHouseIndex] = useState(null);
  const [recData, setRecData] = useState(null);

  useEffect(() => {
    initNotifications().catch((err) => console.warn(err.message));
    requestAppPermissions().catch((err) => console.warn(err.message));
  }, []);

  const handleRecommendations = async () => {
    try {
      const data = await getEstateRecommendation();
      setRecData(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const openHousingDetail = (i) => {
    setHouseIndex(i);
    setShowHousingDetail(true);
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <HomeScreen
          openChat={(cfg) => {
            setChatConfig(cfg);
            setActiveTab('chat');
          }}
          openHousing={() => setActiveTab('housing')}
        />
      );
    }
    if (activeTab === 'housing') {
      return (
        <HousingListScreen
          openDetail={openHousingDetail}
          recData={recData}
          refreshRecommendations={handleRecommendations}
        />
      );
    }
    // chat tab
    const baseProps = {
      onBack: () => setChatConfig(null),
      onRecommendations: handleRecommendations,
    };
    if (chatConfig) {
      return <ChatScreen {...chatConfig} {...baseProps} />;
    }
    // Default to estate assistant when opened via tab icon
    return <ChatScreen mode="estate" name="Estate Copilot" {...baseProps} />;
  };

  return (
    <View style={styles.app}>
      <View style={styles.content}>{renderContent()}</View>
      <BottomTabBar active={activeTab} onChange={setActiveTab} />

      <Modal
        visible={showHousingDetail}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setShowHousingDetail(false)}
      >
        <HousingDetailScreen index={houseIndex} onBack={() => setShowHousingDetail(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingBottom: 0 },
});
