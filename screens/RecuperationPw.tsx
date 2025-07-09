import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/Types';
import { StackNavigationProp } from '@react-navigation/stack';
import { BookOpen } from 'lucide-react-native';

type RecuperationPwNavigationProp = StackNavigationProp<RootStackParamList, 'RecuperationPw'>;

export default function RecuperationPw() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigation = useNavigation<RecuperationPwNavigationProp>();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const handlePasswordReset = async () => {
  if (!email.trim()) {
    setError('Veuillez entrer un email');
    return;
  }

  if (!validateEmail(email)) {
    setError('Veuillez entrer un email valide');
    return;
  }

  setLoading(true);
  setError('');
  setMessage('');

  try {
    const response = await axios.post('http://192.168.1.7:5001/api/forgetpassword', { email });

    if (response.status === 200) {
      setMessage('Un nouveau mot de passe a été envoyé à votre adresse email.');
    } else {
      setError(`Erreur inattendue (statut : ${response.status})`);
    }
  } catch (err: any) {
    if (err.response) {
      // Erreurs HTTP envoyées par le backend
      const status = err.response.status;
      if (status === 404) {
        setError("Adresse email non trouvée.");
      } else if (status === 400) {
        setError(err.response.data?.message || "Requête invalide.");
      } else {
        setError(`Erreur ${status} : ${err.response.data?.message || 'Une erreur s’est produite.'}`);
      }
    } else if (err.request) {
      // Pas de réponse du serveur
      setError("Aucune réponse du serveur. Vérifiez votre connexion internet.");
    } else {
      // Erreur de configuration ou autre
      setError("Erreur lors de la réinitialisation du mot de passe.");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <BookOpen size={20} color="#16a34a" />
          </View>
          <Text style={styles.logoText}>Evalya Smart</Text>
        </View>

        <Text style={styles.title}>Récupération du mot de passe</Text>

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez votre email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          onPress={handlePasswordReset}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Envoyer les instructions</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  success: {
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
});
