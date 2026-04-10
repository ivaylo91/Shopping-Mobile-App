/**
 * Clears all documents from the products collection
 * Run with: node scripts/clearProducts.js
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC4_qUPhiEPFmBYWoL6g_zjASpJSPJQrIM",
  authDomain: "shopping-mobile-app-dab8c.firebaseapp.com",
  projectId: "shopping-mobile-app-dab8c",
  storageBucket: "shopping-mobile-app-dab8c.firebasestorage.app",
  messagingSenderId: "384501943393",
  appId: "1:384501943393:web:9ee10939a61a653151ee20",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clear() {
  const snapshot = await getDocs(collection(db, 'products'));
  console.log(`Изтриване на ${snapshot.size} продукта...`);
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, 'products', d.id));
    console.log(`🗑️  Изтрит: ${d.data().name}`);
  }
  console.log('✅ Готово!');
  process.exit(0);
}

clear().catch((err) => {
  console.error('❌ Грешка:', err.message);
  process.exit(1);
});
