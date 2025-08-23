import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BottomTabBar({ active, onChange }) {
  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'housing', label: 'Housing', icon: '🏡' },
    { key: 'chat', label: 'Chat', icon: '💬' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, active === t.key && styles.activeTab]}
          onPress={() => onChange(t.key)}
          accessibilityRole="button"
          accessibilityLabel={t.label}
        >
          <Text style={[styles.icon, active === t.key && styles.activeText]}>{t.icon}</Text>
          <Text style={[styles.label, active === t.key && styles.activeText]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    backgroundColor: '#fff',
    paddingBottom: 8,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  activeTab: {
    backgroundColor: '#f7f7f9',
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
    color: '#666',
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  activeText: {
    color: '#007bff',
    fontWeight: '600',
  },
});

