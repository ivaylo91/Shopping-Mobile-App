/**
 * Seed script — adds sample products to Firestore
 * Run with: node scripts/seedFirestore.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

const products = [
  // 🥩 МЕСО
  { name: 'Пилешки гърди',   price: 4.09, unit: 'кг',  store: 'Lidl',     category: 'meat',       protein: 31, calories: 165, isHealthy: true  },
  { name: 'Кайма (свинска)', price: 2.81, unit: 'кг',  store: 'Kaufland', category: 'meat',       protein: 26, calories: 290, isHealthy: false },
  { name: 'Пилешки бутчета', price: 2.56, unit: 'кг',  store: 'Billa',    category: 'meat',       protein: 24, calories: 215, isHealthy: true  },
  { name: 'Телешки кайма',   price: 4.86, unit: 'кг',  store: 'Kaufland', category: 'meat',       protein: 26, calories: 254, isHealthy: false },

  // 🐟 РИБА
  { name: 'Риба тон (консерва)', price: 0.66, unit: 'бр.', store: 'Any',      category: 'fish',   protein: 25, calories: 128, isHealthy: true },
  { name: 'Сьомга (филе)',       price: 7.69, unit: 'кг',  store: 'Kaufland', category: 'fish',   protein: 20, calories: 208, isHealthy: true },
  { name: 'Скумрия (консерва)',  price: 0.56, unit: 'бр.', store: 'Lidl',     category: 'fish',   protein: 18, calories: 185, isHealthy: true },

  // 🥛 МЛЕЧНИ
  { name: 'Кисело мляко 2%',     price: 0.66, unit: 'бр.', store: 'Lidl',     category: 'dairy', protein: 10, calories: 56,  isHealthy: true  },
  { name: 'Извара',               price: 1.02, unit: 'бр.', store: 'Kaufland', category: 'dairy', protein: 11, calories: 98,  isHealthy: true  },
  { name: 'Сирене (краве)',       price: 2.30, unit: 'кг',  store: 'Billa',    category: 'dairy', protein: 14, calories: 264, isHealthy: false },
  { name: 'Прясно мляко 3.5%',   price: 0.87, unit: 'бр.', store: 'Any',      category: 'dairy', protein: 3,  calories: 61,  isHealthy: true  },
  { name: 'Гръцко кисело мляко', price: 1.12, unit: 'бр.', store: 'Kaufland', category: 'dairy', protein: 10, calories: 97,  isHealthy: true  },

  // 🥚 ЯЙЦА
  { name: 'Яйца (10 бр.)', price: 1.28, unit: 'бр.', store: 'Any',  category: 'eggs', protein: 13, calories: 143, isHealthy: true },
  { name: 'Яйца (6 бр.)',  price: 0.82, unit: 'бр.', store: 'Lidl', category: 'eggs', protein: 13, calories: 143, isHealthy: true },

  // 🌾 ЗЪРНЕНИ
  { name: 'Овесени ядки', price: 0.66, unit: 'бр.', store: 'Lidl',     category: 'grains', protein: 13, calories: 379, isHealthy: true },
  { name: 'Ориз (1 кг)',  price: 0.76, unit: 'бр.', store: 'Any',      category: 'grains', protein: 7,  calories: 360, isHealthy: true },
  { name: 'Паста (500г)', price: 0.61, unit: 'бр.', store: 'Any',      category: 'grains', protein: 13, calories: 371, isHealthy: true },
  { name: 'Елда',         price: 0.97, unit: 'бр.', store: 'Kaufland', category: 'grains', protein: 13, calories: 343, isHealthy: true },

  // 🥦 ЗЕЛЕНЧУЦИ
  { name: 'Броколи',         price: 0.66, unit: 'бр.', store: 'Any',      category: 'vegetables', protein: 3, calories: 34, isHealthy: true },
  { name: 'Спанак',          price: 0.51, unit: 'бр.', store: 'Lidl',     category: 'vegetables', protein: 3, calories: 23, isHealthy: true },
  { name: 'Краставици',      price: 0.41, unit: 'кг',  store: 'Any',      category: 'vegetables', protein: 1, calories: 15, isHealthy: true },
  { name: 'Домати',          price: 0.76, unit: 'кг',  store: 'Any',      category: 'vegetables', protein: 1, calories: 18, isHealthy: true },
  { name: 'Чушки (червени)', price: 1.02, unit: 'кг',  store: 'Kaufland', category: 'vegetables', protein: 1, calories: 31, isHealthy: true },
  { name: 'Зеле',            price: 0.35, unit: 'кг',  store: 'Any',      category: 'vegetables', protein: 1, calories: 25, isHealthy: true },

  // 🍎 ПЛОДОВЕ
  { name: 'Банани',    price: 0.51, unit: 'кг', store: 'Any',  category: 'fruit', protein: 1, calories: 89, isHealthy: true },
  { name: 'Ябълки',   price: 0.76, unit: 'кг', store: 'Any',  category: 'fruit', protein: 0, calories: 52, isHealthy: true },
  { name: 'Портокали',price: 0.66, unit: 'кг', store: 'Lidl', category: 'fruit', protein: 1, calories: 47, isHealthy: true },

  // 🫘 БОБОВИ
  { name: 'Леща (500г)',      price: 0.76, unit: 'бр.', store: 'Any',      category: 'legumes', protein: 25, calories: 353, isHealthy: true },
  { name: 'Нахут (консерва)', price: 0.61, unit: 'бр.', store: 'Kaufland', category: 'legumes', protein: 9,  calories: 164, isHealthy: true },
  { name: 'Боб (консерва)',   price: 0.51, unit: 'бр.', store: 'Any',      category: 'legumes', protein: 9,  calories: 127, isHealthy: true },

  // 🍞 ХЛЕБНИ
  { name: 'Пълнозърнест хляб', price: 0.76, unit: 'бр.', store: 'Any',  category: 'bakery', protein: 9, calories: 247, isHealthy: true  },
  { name: 'Бял хляб',          price: 0.46, unit: 'бр.', store: 'Any',  category: 'bakery', protein: 8, calories: 265, isHealthy: false },
  { name: 'Хлебче (питка)',    price: 0.15, unit: 'бр.', store: 'Lidl', category: 'bakery', protein: 7, calories: 280, isHealthy: false },
];

async function seed() {
  console.log(`Добавяне на ${products.length} продукта във Firestore...`);
  let count = 0;
  for (const product of products) {
    await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
    });
    count++;
    console.log(`✅ ${count}. ${product.name} (${product.store}) — €${product.price}`);
  }
  console.log(`\n🎉 Готово! Добавени ${count} продукта.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Грешка:', err.message);
  process.exit(1);
});
