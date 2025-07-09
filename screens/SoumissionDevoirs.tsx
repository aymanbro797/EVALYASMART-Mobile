import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Modal, Platform, Alert
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Buffer } from 'buffer';

// Buffer global pour React Native mobile
global.Buffer = global.Buffer || Buffer;

interface UploadResponse {
  url: string;
}

type FileItem = {
  name: string;
  size: number;
  type: string;
  uri: string;
};

const SoumissionDevoirs = () => {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const allowedFileTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const isValidType = allowedFileTypes.includes(fileExtension);
        const fileSize = file.size ?? 0;

        if (isValidType && fileSize <= maxFileSize) {
          setFile(file);
        } else {
          Alert.alert('Erreur', 'Fichier non valide ou trop lourd');
        }
      }
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la sélection du fichier');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      Alert.alert('Erreur', 'Aucun fichier sélectionné');
      return;
    }

    setLoading(true);
    try {
      console.log('Demande URL pré-signée...');
      const response = await axios.get<UploadResponse>('http://192.168.1.7:5001/api/uploadCorrection', {
        params: {
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        },
      });

      const { url } = response.data;
      console.log('URL reçue:', url);
      console.log('URI du fichier:', file.uri);

      let base64Data: string;
      if (file.uri.startsWith('data:')) {
        base64Data = file.uri.split(',')[1]; // Extrait la base64
      } else {
        base64Data = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      }

      const fileBuffer = Buffer.from(base64Data, 'base64');
      console.log('Buffer créé, upload vers S3...');

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
        },
        body: fileBuffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Échec de l'upload: ${errorText}`);
      }

      console.log('Upload terminé avec succès !');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Échec du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => alert('Retour')}>
          <Feather name="arrow-left" size={20} color="#16a34a" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fichier à soumettre :</Text>

          {file && (
            <View style={styles.fileInfo}>
              <Text>{file.name}</Text>
              <Text>{Math.round((file.size || 0) / 1024)} Ko</Text>
            </View>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={pickFile} disabled={loading}>
            <AntDesign name="addfile" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Choisir un fichier</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          ) : (
            file && (
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={uploadFile}
              >
                <Text style={styles.submitButtonText}>Soumettre</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AntDesign name="checkcircle" size={64} color="#16a34a" />
            <Text style={styles.modalText}>Fichier uploadé avec succès !</Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setShowSuccessModal(false);
              }}
            >
              <Text style={styles.closeModalButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#16a34a',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  fileInfo: {
    marginVertical: 10,
    fontSize: 14,
    color: '#374151',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  closeModalButton: {
    marginTop: 16,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SoumissionDevoirs;
