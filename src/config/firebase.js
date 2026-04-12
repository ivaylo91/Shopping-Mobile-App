import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyC4_qUPhiEPFmBYWoL6g_zjASpJSPJQrIM',
  authDomain:        'shopping-mobile-app-dab8c.firebaseapp.com',
  projectId:         'shopping-mobile-app-dab8c',
  storageBucket:     'shopping-mobile-app-dab8c.firebasestorage.app',
  messagingSenderId: '384501943393',
  appId:             '1:384501943393:web:9ee10939a61a653151ee20',
  measurementId:     'G-EJ3YXSE3PN',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
