import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getHouses } from '../api/client';

export default function HousingListScreen({ openDetail, recData, refreshRecommendations }) {
  const [houses, setHouses] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHouses();
        setHouses(data.houses || []);
        setColumns(data.columns || []);
      } catch (err) {
        console.warn(err.message);
      }
    };
    load();
    if (refreshRecommendations) {
      refreshRecommendations();
    }
  }, [refreshRecommendations]);

  const titleCol = columns.includes('PropertyInfo_Address') ? 'PropertyInfo_Address' : columns[0];

  const renderItem = ({ item, index }) => {
    const isBest = recData?.index === index;
    const isRec = recData?.recommendations?.some((r) => r.index === index);
    const isVisited = recData?.visited_indices?.includes(index);
    return (
      <TouchableOpacity
        style={[styles.card, isRec && styles.recommended, isBest && styles.best]}
        onPress={() => openDetail(index)}
      >
        <Text style={styles.cardTitle}>{item[titleCol]}</Text>
        {isVisited && <Text style={styles.visited}>Visited</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Housing</Text>
      <FlatList
        data={houses}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={houses.length ? null : styles.empty}
        ListEmptyComponent={<Text>No houses available.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, paddingHorizontal: 12 },
  title: { textAlign: 'center', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderWidth: 1, borderColor: '#ccc', margin: 8, borderRadius: 4 },
  cardTitle: { fontWeight: '600' },
  recommended: { borderColor: '#007bff' },
  best: { borderColor: 'green', borderWidth: 2 },
  visited: { marginTop: 4, fontStyle: 'italic', color: '#555' },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
});
