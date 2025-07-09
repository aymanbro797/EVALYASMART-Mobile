import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Download, Eye } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Soumission = {
  id: string;
  fileName: string;
  submittedAt: string;
  fileUrl: string;
};

type RootStackParamList = {
  DevoirCorrige: undefined;
  SoumissionDevoirs: { soumission: Soumission };
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DevoirCorrige'
>;

const DevoirCorrige = () => {
  const [submissions, setSubmissions] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res = await axios.get<Soumission[]>(
          'http://192.168.1.7:5001/api/recupererCorrection'
        );
        setSubmissions(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert("Erreur", "Erreur lors du chargement de l'historique.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleDownload = async (url: string, fileName: string) => {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.includes('.') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Téléchargement lancé', 'Le fichier est en cours de téléchargement.');
    } else {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Impossible de sauvegarder le fichier sans autorisation.');
          return;
        }

        const validFileName = fileName.includes('.') ? fileName : `${fileName}.pdf`;
        const fileUri = FileSystem.documentDirectory + validFileName;
        const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult || !downloadResult.uri) {
          throw new Error("Téléchargement échoué.");
        }

        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error("Fichier téléchargé est vide ou inaccessible");
        }

        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        const album = await MediaLibrary.getAlbumAsync('Download');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Download', asset, false);
        }

        Alert.alert('Téléchargement réussi', `Le fichier a été enregistré dans le dossier "Download".`);
      } catch (error) {
        console.error('Erreur lors du téléchargement :', error);
        Alert.alert('Erreur', 'Échec du téléchargement du fichier. Vérifiez l\'URL et le type du fichier.');
      }
    }
  };

  const handleView = (soumission: Soumission) => {
    navigation.navigate('SoumissionDevoirs', { soumission });
  };

  const renderItem = ({ item }: { item: Soumission }) => (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.title}>{item.fileName}</Text>
      </View>
      <View style={styles.cell}>
        <Text style={styles.date}>
          Soumis le : {new Date(item.submittedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.cellRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDownload(item.fileUrl, item.fileName)}
        >
          <Download width={16} height={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: '#16a34a' }]}
          onPress={() => handleView(item)}
        >
          <Eye width={16} height={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#16a34a" />;
  }

  if (submissions.length === 0) {
    return <Text style={styles.empty}>Aucune soumission trouvée.</Text>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginBottom: 10, alignSelf: 'flex-start' }}
      >
        <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 16 }}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerText}>Titre </Text>
        <Text style={styles.headerText}>Date </Text>
        <Text style={styles.headerText}>Actions</Text>
      </View>

      <FlatList
        data={submissions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    flex: 1,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  cellRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'center',
  },
  date: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
  },
  iconButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default DevoirCorrige;
