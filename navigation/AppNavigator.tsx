import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingPage from '../screens/LandingPage';
import Welcome from '../screens/Welcome';
import Login from '../screens/Login';
import ListeDevoirs from '../screens/ListeDevoirs';
import SoumissionDevoirs from '../screens/SoumissionDevoirs';  // Pas de passing de données
import RecuperationPw from '../screens/RecuperationPw';  // Importation de la page RecuperationPw
import HistoriqueSoumissions from '../screens/HistoriqueSoumissions';  

import { RootStackParamList } from './Types'; // Assurez-vous d'importer le bon type

const Stack = createNativeStackNavigator<RootStackParamList>(); // Utilisation du type RootStackParamList

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LandingPage" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LandingPage" component={LandingPage} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ListeDevoirs" component={ListeDevoirs} />
        
        {/* Ne pas passer de données spécifiques, juste le token si nécessaire */}
        <Stack.Screen 
          name="SoumissionDevoirs" 
          component={SoumissionDevoirs} 
        />
        
        <Stack.Screen name="RecuperationPw" component={RecuperationPw} /> 
        <Stack.Screen name="HistoriqueSoumissions" component={HistoriqueSoumissions} />  
      </Stack.Navigator>
    </NavigationContainer>
  );
}
