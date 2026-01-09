import { useEffect, useState } from 'react';
import { View, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '@/styles/global-styles';
import { Pest, PestParsed } from '@/models/Pest';
import { router } from 'expo-router';
import { PestsService } from '@/services/pestsService';

export default function PestsScreen() {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PestParsed[]>([]);
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const pests = await PestsService.getAllPests(1, searchText.trim());
        setResults(pests);
        console.log(pests);
      } catch (e) {
        setResults([]);
      }
      setLoading(false);
    };
    const t = setTimeout(fetchResults, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  return (
    <LinearGradient
      colors={['rgba(213, 240, 219, 0.19)', backgroundColor]}
      style={[globalStyles.body, { paddingHorizontal: 16 }]}
    >
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar plagas/enfermedades..."
            placeholderTextColor="#aaa"
            onChangeText={setSearchText}
            value={searchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={22} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText type="default">Cancelar</ThemedText>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginVertical: 16 }} />
      )}

      {!loading && results.length === 0 && (
        <ThemedText type='default' style={{ marginTop: 16, textAlign: 'center', color: '#888' }}>
          Busca por nombre común o científico
        </ThemedText>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {results.map((item) => {
          return (
            <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={() => router.push({ pathname: '/pest-details', params: { id: String(item.id) } })}>
              <ThemedView style={styles.card}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                ) : (
                  <View style={[styles.placeholder, { backgroundColor: '#e8e8e8' }]}> 
                    <Ionicons name="bug" size={28} color="#666" />
                  </View>
                )}
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <ThemedText type='title2'>{item.name}</ThemedText>
                  <ThemedText type='subtitle'>{item.solutions_count} soluciones</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </ThemedView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  container: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '80%',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
