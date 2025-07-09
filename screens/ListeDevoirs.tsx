import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Download, ArrowRight } from 'react-native-feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Assurez-vous d'importer axios

import { useHomeworkStore } from '../zustand/store';
import { Homework } from '../types/Homework';
import { RootStackParamList } from '../navigation/Types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ListeDevoirs'>;

const ListeDevoirs = () => {
  const navigation = useNavigation<NavigationProp>();
  const { homeworks, loadHomeworks } = useHomeworkStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Erreur', 'Aucun token trouvé. Veuillez vous reconnecter.');
          return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await loadHomeworks(); // Charger les devoirs via votre store
      } catch (error) {
        console.error('Erreur lors du chargement des devoirs:', error);
        Alert.alert('Erreur', 'Impossible de charger les devoirs.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [loadHomeworks]);

  const handleDownload = async (url: string, fileName: string) => {
    if (Platform.OS === 'web') {
      try {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName.includes('.') ? fileName : `${fileName}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Succès', 'Téléchargement lancé.');
      } catch {
        Alert.alert('Erreur', 'Échec du téléchargement.');
      }
    } else {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Impossible de sauvegarder sans autorisation.');
          return;
        }
        const validFileName = fileName.includes('.') ? fileName : `${fileName}.pdf`;
        const fileUri = FileSystem.documentDirectory + validFileName;
        const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult?.uri) throw new Error('Téléchargement échoué.');

        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        const album = await MediaLibrary.getAlbumAsync('Download');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Download', asset, false);
        }

        Alert.alert('Succès', 'Fichier téléchargé dans "Download".');
      } catch {
        Alert.alert('Erreur', 'Téléchargement échoué.');
      }
    }
  };

  const renderItem = ({ item }: { item: Homework }) => (
    <View style={styles.row}>
      <Text style={styles.title}>{item.fileName}</Text>
      <Text style={styles.type}>{item.fileType}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.iconButton, { marginRight: 10 }]}
          onPress={() => handleDownload(item.fileUrl, item.fileName)}
        >
          <Download width={16} height={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: '#16a34a' }]}
          onPress={() => navigation.navigate('SoumissionDevoirs', { homework: item })}
        >
          <ArrowRight width={16} height={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmptyComponent = () => {
    if (isLoading) return null;
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aucun devoir trouvé.</Text>
      </View>
    );
  };

  const ListFooterComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loading}>Chargement des devoirs...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Nom du fichier</Text>
        <Text style={styles.headerText}>Type</Text>
        <Text style={styles.headerText}>Actions</Text>
      </View>

      <FlatList
        data={homeworks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
      />

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('HistoriqueSoumissions')}
      >
        <Text style={styles.historyButtonText}>Voir historique de soumissions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 30, paddingHorizontal: 16, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  headerText: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  list: { paddingTop: 16, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  title: { flex: 1, fontSize: 14, fontWeight: '500' },
  type: { flex: 1, fontSize: 14, textAlign: 'center', color: '#065f46' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    backgroundColor: '#0ea5e9',
    padding: 6,
    borderRadius: 6,
  },
  center: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  loading: { marginTop: 10, fontSize: 14, color: '#6b7280' },
  historyButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ListeDevoirs;
