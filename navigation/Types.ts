// src/navigation/Types.ts

import { Homework } from '../types/Homework';

export type RootStackParamList = {
  LandingPage: undefined;
  Welcome: undefined;
  Login: undefined;
  ListeDevoirs: undefined;
  SoumissionDevoirs: { homework: Homework };  // Paramètre attendu pour cette route
  RecuperationPw: undefined;
  HistoriqueSoumissions: undefined;
};
