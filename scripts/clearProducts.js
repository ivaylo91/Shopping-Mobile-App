/**
 * Clears all documents from the products collection using batch deletes.
 * Run with: node scripts/clearProducts.js
 *
 * Firestore writeBatch limit is 500 ops — handled automatically.
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');

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

const BATCH_SIZE = 499; // Firestore max is 500 per batch

async function clear() {
  const snapshot = await getDocs(collection(db, 'products'));
  const total = snapshot.size;

  if (total === 0) {
    console.log('Колекцията вече е празна.');
    process.exit(0);
  }

  console.log(`Изтриване на ${total} продукта с batch writes...`);

  const docs = snapshot.docs;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + BATCH_SIZE);
    chunk.forEach((d) => batch.delete(doc(db, 'products', d.id)));
    await batch.commit();
    deleted += chunk.length;
    console.log(`🗑️  Изтрити ${deleted}/${total}...`);
  }

  console.log(`✅ Готово! Изтрити ${deleted} продукта.`);
  process.exit(0);
}

clear().catch((err) => {
  console.error('❌ Грешка:', err.message);
  process.exit(1);
});
