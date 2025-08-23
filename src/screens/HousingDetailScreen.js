import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import { getHouse } from '../api/client';

export default function HousingDetailScreen({ index, onBack }) {
  const [house, setHouse] = useState(null);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHouse(index);
        setHouse(data.house || {});
        setColumns(data.columns || []);
      } catch (err) {
        console.warn(err.message);
      }
    };
    load();
  }, [index]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={onBack} />
        <Text style={styles.title}>Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {columns.map((c) => (
          <View key={c} style={styles.row}>
            <Text style={styles.label}>{c}</Text>
            <Text style={styles.value}>{house[c]}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  body: { padding: 8 },
  row: { marginBottom: 8 },
  label: { fontWeight: '600' },
  value: { marginTop: 2 },
});

