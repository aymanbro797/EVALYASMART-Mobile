import {create} from 'zustand';
import axios from 'axios';
interface Homework {
    fileName: string;
    fileUrl: string;
    fileType: string;
  }
// Store Zustand pour gérer les devoirs
export const useHomeworkStore = create((set :any) => ({
  homeworks: [], 
  addHomework: (homework:Homework) =>
    set((state: any) => ({
      homeworks: [...state.homeworks, homework],
    })),

    loadHomeworks: async () => {
      const token = localStorage.getItem('token');
    try {
      // Appeler l'API backend pour obtenir la liste des fichiers de S3
      const response = await axios.get('http://192.168.1.7:5001/api/recuperer',{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });  
      set({ homeworks: response.data });  
    } catch (error) {
      console.error('Erreur lors du chargement des devoirs:', error);
    }
  },
}));