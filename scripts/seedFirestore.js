/**
 * Seed script — adds Lidl products from brochure 13.04–19.04.2026
 * Run with: node scripts/seedFirestore.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc, serverTimestamp } = require('firebase/firestore');

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
  // ===== ЛИДЛ — Брошура 13.04–19.04.2026 =====

  // 🥩 МЕСО
  { name: 'Свински врат без кост ≈1.1кг',         price: 3.82,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 18, calories: 215, isHealthy: false },
  { name: 'Ръмп стек от говеждо ≈350г',           price: 6.65,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 26, calories: 190, isHealthy: true  },
  { name: 'Факлички от свински гърди XXL 600г',   price: 5.99,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 18, calories: 280, isHealthy: false },
  { name: 'Пилешко мляно месо 500г',              price: 2.04,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 22, calories: 160, isHealthy: true  },
  { name: 'СВЕЖО Кюфтета или кебапчета 480г',     price: 1.79,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 16, calories: 250, isHealthy: false },
  { name: 'Карначе от младо телешко 400г',        price: 3.99,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 20, calories: 220, isHealthy: false },
  { name: 'Мариновани пилешки бутчета 750г',      price: 4.60,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 22, calories: 215, isHealthy: true  },
  { name: 'Месо за готвене пилешко филе 500г',    price: 3.39,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 31, calories: 165, isHealthy: true  },
  { name: 'Панагюрска луканка 2x170г',            price: 3.32,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 22, calories: 380, isHealthy: false },
  { name: 'Деликатесен салам 170г',               price: 1.78,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 15, calories: 360, isHealthy: false },
  { name: 'Шунка от пуешки гърди XXL 400г',       price: 4.99,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 20, calories: 110, isHealthy: true  },
  { name: 'Кренвирши Стара планина 2x400г',       price: 3.35,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 13, calories: 290, isHealthy: false },
  { name: 'Шпеков салам Pikok Pure 2x220г',       price: 4.34,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 16, calories: 350, isHealthy: false },
  { name: 'Печено филе Pikok Pure 2x150г',        price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 18, calories: 120, isHealthy: true  },
  { name: 'Пастърма нарязана 300г',               price: 3.52,  unit: 'бр.', store: 'Lidl', category: 'meat',       protein: 28, calories: 180, isHealthy: true  },

  // 🐟 РИБА
  { name: 'Пушена сьомга осолена 200г',           price: 4.89,  unit: 'бр.', store: 'Lidl', category: 'fish',       protein: 22, calories: 185, isHealthy: true  },
  { name: 'Филе от сьомга XXL маринован 375г',    price: 7.66,  unit: 'бр.', store: 'Lidl', category: 'fish',       protein: 20, calories: 208, isHealthy: true  },
  { name: 'Пушена риба тон ERIDANOUS 104г',       price: 1.78,  unit: 'бр.', store: 'Lidl', category: 'fish',       protein: 26, calories: 144, isHealthy: true  },
  { name: 'Скариди ERIDANOUS с Дзадзики 100г',   price: 2.79,  unit: 'бр.', store: 'Lidl', category: 'fish',       protein: 18, calories: 95,  isHealthy: true  },
  { name: 'Миди ERIDANOUS 450г',                  price: 3.89,  unit: 'бр.', store: 'Lidl', category: 'fish',       protein: 14, calories: 86,  isHealthy: true  },
  { name: 'Калмари ERIDANOUS 630г',               price: 7.15,  unit: 'бр.', store: 'Lidl', category: 'fish',       protein: 15, calories: 92,  isHealthy: true  },

  // 🥛 МЛЕЧНИ
  { name: 'OLYMPUS Прясно краве мляко 1.7% 1л',  price: 1.35,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 3,  calories: 44,  isHealthy: true  },
  { name: 'Кисело мляко XXL 3.6% 500г',          price: 0.66,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 4,  calories: 60,  isHealthy: true  },
  { name: 'ВЕРЕЯ Кисело мляко 2.9% 400г',        price: 0.65,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 4,  calories: 56,  isHealthy: true  },
  { name: 'ТЕРТЕР Цедено кисело мляко 10% 400г', price: 1.25,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 6,  calories: 110, isHealthy: true  },
  { name: 'БУЛГАРЕА Кисело мляко 4.5% 500г',     price: 0.85,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 4,  calories: 72,  isHealthy: true  },
  { name: 'НАШЕ СЕЛО Кисело мляко с каймак 1кг', price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 4,  calories: 95,  isHealthy: false },
  { name: 'DANONE Активия Натурална 280г',        price: 0.69,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 4,  calories: 62,  isHealthy: true  },
  { name: 'Бяло саламурено сирене 400г',          price: 3.39,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 14, calories: 260, isHealthy: false },
  { name: 'Кашкавал от краве мляко 2x400г',      price: 6.13,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 25, calories: 380, isHealthy: false },
  { name: 'Гръцко сирене Фета ERIDANOUS 400г',   price: 6.13,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 14, calories: 264, isHealthy: false },
  { name: 'Халуми кипърско сирене 225г',          price: 3.32,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 18, calories: 321, isHealthy: false },
  { name: 'Гръцко сирене за грил 220г',          price: 3.32,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 16, calories: 290, isHealthy: false },
  { name: 'Пушен кашкавал от краве мляко 730г',  price: 5.79,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 23, calories: 370, isHealthy: false },
  { name: 'Гръцки йогурт ERIDANOUS 1кг',         price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 10, calories: 130, isHealthy: true  },
  { name: 'Скир натурален 500г',                  price: 1.59,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 11, calories: 63,  isHealthy: true  },
  { name: 'Десерт Кварк 125г',                   price: 0.79,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 8,  calories: 95,  isHealthy: true  },
  { name: 'Йогурт 150г',                         price: 0.75,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 3,  calories: 82,  isHealthy: true  },
  { name: 'EXQUISA Кварк с овесени ядки 3x400г', price: 4.89,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 10, calories: 120, isHealthy: true  },
  { name: 'Краве масло 4x125г',                  price: 3.29,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 1,  calories: 717, isHealthy: false },
  { name: 'Топено сирене 8x17.5г',               price: 0.99,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 5,  calories: 230, isHealthy: false },
  { name: 'Био моцарела 125г',                   price: 1.49,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 6,  calories: 255, isHealthy: false },
  { name: 'Био маасдамер или гауда 200г',        price: 2.55,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 24, calories: 380, isHealthy: false },
  { name: 'Био крем сирене 160г',                price: 1.58,  unit: 'бр.', store: 'Lidl', category: 'dairy',      protein: 5,  calories: 200, isHealthy: false },

  // 🥚 ЯЙЦА
  { name: 'Яйца кокоши 10бр.',                    price: 2.29,  unit: 'бр.', store: 'Lidl', category: 'eggs',       protein: 13, calories: 155, isHealthy: true  },
  { name: 'Яйца от пъдпъдъци 12бр.',             price: 1.39,  unit: 'бр.', store: 'Lidl', category: 'eggs',       protein: 13, calories: 158, isHealthy: true  },
  { name: 'OPTISANA Яйчен белтък 500г',           price: 1.69,  unit: 'бр.', store: 'Lidl', category: 'eggs',       protein: 11, calories: 52,  isHealthy: true  },

  // 🥦 ЗЕЛЕНЧУЦИ
  { name: 'Картофи/кг',                           price: 0.49,  unit: 'кг',  store: 'Lidl', category: 'vegetables', protein: 2,  calories: 77,  isHealthy: true  },
  { name: 'Моркови/кг',                           price: 0.55,  unit: 'кг',  store: 'Lidl', category: 'vegetables', protein: 1,  calories: 41,  isHealthy: true  },
  { name: 'Чесън/глава',                          price: 0.39,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 6,  calories: 149, isHealthy: true  },
  { name: 'Чери домати 500г',                     price: 1.59,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 1,  calories: 18,  isHealthy: true  },
  { name: 'Лук Полша/кг',                        price: 0.38,  unit: 'кг',  store: 'Lidl', category: 'vegetables', protein: 1,  calories: 40,  isHealthy: true  },
  { name: 'Кралски печурки 500г',                price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 3,  calories: 22,  isHealthy: true  },
  { name: 'Български краставици/бр.',            price: 0.69,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 1,  calories: 15,  isHealthy: true  },
  { name: 'Български спанак 500г',               price: 0.99,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 3,  calories: 23,  isHealthy: true  },
  { name: 'Салата Айсберг Испания/бр.',          price: 1.19,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 1,  calories: 14,  isHealthy: true  },
  { name: 'Розови домати Турция/кг',             price: 1.95,  unit: 'кг',  store: 'Lidl', category: 'vegetables', protein: 1,  calories: 18,  isHealthy: true  },
  { name: 'РЕКОЛТА Кисели краставички 360г',     price: 1.45,  unit: 'бр.', store: 'Lidl', category: 'vegetables', protein: 1,  calories: 11,  isHealthy: true  },

  // 🍎 ПЛОДОВЕ
  { name: 'Ягоди 500г (Гърция)',                 price: 1.89,  unit: 'бр.', store: 'Lidl', category: 'fruit',      protein: 1,  calories: 32,  isHealthy: true  },
  { name: 'Манго Бразилия/бр.',                  price: 1.29,  unit: 'бр.', store: 'Lidl', category: 'fruit',      protein: 1,  calories: 60,  isHealthy: true  },
  { name: 'Авокадо Грийнскин Израел/бр.',        price: 0.79,  unit: 'бр.', store: 'Lidl', category: 'fruit',      protein: 2,  calories: 160, isHealthy: true  },
  { name: 'Черно грозде без семки 500г',         price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'fruit',      protein: 1,  calories: 69,  isHealthy: true  },
  { name: 'Зелени ябълки сладки Италия/кг',      price: 1.49,  unit: 'кг',  store: 'Lidl', category: 'fruit',      protein: 0,  calories: 52,  isHealthy: true  },
  { name: 'Круши Нидерландия/кг',                price: 1.69,  unit: 'кг',  store: 'Lidl', category: 'fruit',      protein: 0,  calories: 57,  isHealthy: true  },
  { name: 'Диня с малко семки Бразилия/кг',      price: 1.45,  unit: 'кг',  store: 'Lidl', category: 'fruit',      protein: 1,  calories: 30,  isHealthy: true  },

  // 🍞 ХЛЕБНИ / ПЕКАРНА
  { name: 'Бял земел 60г',                       price: 0.04,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 3,  calories: 150, isHealthy: false },
  { name: 'Хляб с 3 вида семена 405г',           price: 0.99,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 9,  calories: 245, isHealthy: true  },
  { name: 'Пълнозърнест хляб нарязан 700г',      price: 0.79,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 10, calories: 220, isHealthy: true  },
  { name: 'Тутманик 200г',                       price: 0.89,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 8,  calories: 310, isHealthy: false },
  { name: 'Мини кроасан с масло 20г',            price: 0.10,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 4,  calories: 90,  isHealthy: false },
  { name: 'Кренвиршка 100г',                     price: 0.49,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 6,  calories: 220, isHealthy: false },
  { name: 'Закуска с ванилия 95г',               price: 0.49,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 5,  calories: 240, isHealthy: false },
  { name: 'Пица с прошуто и маскарпоне 160г',    price: 1.69,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 10, calories: 290, isHealthy: false },
  { name: 'MILKA Мъфини 2x110г',                 price: 2.79,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 5,  calories: 380, isHealthy: false },
  { name: 'Нисковъглехидратен хляб 250г',        price: 1.39,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 13, calories: 165, isHealthy: true  },
  { name: 'Ръчен хляб 380г',                     price: 1.15,  unit: 'бр.', store: 'Lidl', category: 'bakery',     protein: 9,  calories: 235, isHealthy: true  },

  // 🌾 ЗЪРНЕНИ / ПАСТИ
  { name: 'Ориз за готвене 1кг',                 price: 1.29,  unit: 'бр.', store: 'Lidl', category: 'grains',     protein: 7,  calories: 350, isHealthy: true  },
  { name: 'Брашно тип 500 1кг',                  price: 0.99,  unit: 'бр.', store: 'Lidl', category: 'grains',     protein: 10, calories: 342, isHealthy: false },
  { name: 'Пене от мека пшеница 500г',           price: 0.49,  unit: 'бр.', store: 'Lidl', category: 'grains',     protein: 7,  calories: 352, isHealthy: true  },
  { name: 'Червена леща 2x500г',                 price: 1.63,  unit: 'бр.', store: 'Lidl', category: 'grains',     protein: 25, calories: 340, isHealthy: true  },
  { name: 'Тесто за пица 2x400г',               price: 1.22,  unit: 'бр.', store: 'Lidl', category: 'grains',     protein: 9,  calories: 270, isHealthy: false },
  { name: 'Едър бял боб в доматен сос 280г',    price: 1.94,  unit: 'бр.', store: 'Lidl', category: 'grains',     protein: 8,  calories: 120, isHealthy: true  },

  // 🫒 МАСЛА / ПОДПРАВКИ
  { name: 'COSTA D\'ORO Маслиново масло 1л',    price: 5.62,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 0,  calories: 884, isHealthy: true  },
  { name: 'ЗЛАТНО ДОБРУДЖАНСКО Слънчогл. 5л',   price: 5.85,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 0,  calories: 884, isHealthy: false },
  { name: 'Гръцко маслиново масло Extra Virgin', price: 5.59,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 0,  calories: 884, isHealthy: true  },
  { name: 'Подправки ERIDANOUS 40г',             price: 0.76,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 5,  calories: 280, isHealthy: true  },
  { name: 'ТРАКИ Лютеница Едросмляна 300г',      price: 1.79,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 2,  calories: 70,  isHealthy: true  },
  { name: 'Лютеница Едромляна 4x310г',           price: 3.42,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 2,  calories: 68,  isHealthy: true  },
  { name: 'Айвар 4x295г',                       price: 6.12,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 2,  calories: 82,  isHealthy: true  },
  { name: 'HEINZ Кетчуп без захар и сол 400мл', price: 2.99,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 1,  calories: 28,  isHealthy: true  },
  { name: 'HEINZ Сос Барбекю 400мл',            price: 2.55,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 1,  calories: 102, isHealthy: false },
  { name: 'Сусамов тахан 350г',                 price: 2.55,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 19, calories: 595, isHealthy: true  },
  { name: 'Дзадзики ERIDANOUS 250г',             price: 1.68,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 3,  calories: 95,  isHealthy: true  },
  { name: 'Биo сироп от агаве 250г',            price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'oils',       protein: 0,  calories: 310, isHealthy: false },

  // 🫙 КОНСЕРВИ / БУРКАНИ
  { name: 'Зелени гриловани маслини 400г',       price: 2.49,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 1,  calories: 145, isHealthy: true  },
  { name: 'Маслини Микс Каламон 500г',           price: 3.32,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 1,  calories: 145, isHealthy: true  },
  { name: 'Гръцки черни маслини 250г',           price: 2.29,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 1,  calories: 145, isHealthy: true  },
  { name: 'Гръцки маслини Каламон 160г',         price: 1.42,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 1,  calories: 145, isHealthy: true  },
  { name: 'Мариновано сирене ERIDANOUS 350г',    price: 3.47,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 12, calories: 250, isHealthy: false },
  { name: 'Лозови сарми ERIDANOUS 280г',         price: 1.94,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 3,  calories: 130, isHealthy: true  },
  { name: 'Био пасирани домати 720мл',           price: 1.59,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 2,  calories: 36,  isHealthy: true  },
  { name: 'Печена капия XXL белена 680г',        price: 2.81,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 1,  calories: 30,  isHealthy: true  },
  { name: 'DIAMANT Захар 10x1кг',               price: 5.59,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 0,  calories: 400, isHealthy: false },
  { name: 'Български пчелен мед 2x900г',         price: 6.13,  unit: 'бр.', store: 'Lidl', category: 'canned',     protein: 0,  calories: 304, isHealthy: true  },

  // ❄️ ЗАМРАЗЕНИ
  { name: 'Вити банички праз и сирене 680г',     price: 2.30,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 7,  calories: 240, isHealthy: false },
  { name: 'Мини банички сусам и Фета 1кг',       price: 3.83,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 6,  calories: 260, isHealthy: false },
  { name: 'Мини рулца бекон и сирене 500г',      price: 2.29,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 8,  calories: 280, isHealthy: false },
  { name: 'Зеленчуков пай ERIDANOUS 850г',       price: 3.99,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 5,  calories: 180, isHealthy: true  },
  { name: 'Мусака по гръцки 380г',               price: 2.99,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 10, calories: 185, isHealthy: false },
  { name: 'Пица на пещ Салами 3x350г',           price: 4.99,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 12, calories: 275, isHealthy: false },
  { name: 'Сладолед на клечка 6x120мл',          price: 3.49,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 3,  calories: 180, isHealthy: false },
  { name: 'Панирани сиренца ERIDANOUS 180г',     price: 2.96,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 12, calories: 280, isHealthy: false },
  { name: 'Мини картофени крокети 360г',         price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 3,  calories: 155, isHealthy: false },
  { name: 'Пълнени кюфтенца ERIDANOUS 280г',     price: 3.29,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 14, calories: 200, isHealthy: false },
  { name: 'Мариновани пилешки филенца 150г',     price: 2.04,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 18, calories: 130, isHealthy: true  },
  { name: 'Бугаца с ванилия ERIDANOUS 450г',     price: 2.80,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 6,  calories: 285, isHealthy: false },
  { name: 'Био пилешки хапки 200г',              price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 18, calories: 185, isHealthy: true  },
  { name: 'Висококопротеиново готово ястие 400г', price: 3.39,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 24, calories: 280, isHealthy: true  },
  { name: 'Панирани бургери пилешки 500г',       price: 4.99,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 20, calories: 220, isHealthy: true  },
  { name: 'Висококопротеинова пица 379г',         price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 28, calories: 255, isHealthy: true  },
  { name: 'Висококопротеиново сладол. 500мл',    price: 2.99,  unit: 'бр.', store: 'Lidl', category: 'frozen',     protein: 30, calories: 215, isHealthy: true  },

  // 🥤 НАПИТКИ
  { name: 'Изворна вода 6x1.5л',                price: 1.05,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 0,   isHealthy: true  },
  { name: 'Трапезна вода 6x1.5л',               price: 0.90,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 0,   isHealthy: true  },
  { name: 'Газирана изворна вода 6x1.5л',       price: 1.20,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 0,   isHealthy: true  },
  { name: 'Газирана напитка Портокал 2.5л',     price: 0.51,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 42,  isHealthy: false },
  { name: 'QUEEN\'S Плодова напитка 2л',        price: 1.12,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 48,  isHealthy: false },
  { name: 'Нектар Банан 1л',                    price: 0.75,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 55,  isHealthy: false },
  { name: 'AYATANA Био Комбуча 330мл',           price: 1.68,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 22,  isHealthy: true  },
  { name: 'Висококопротеинова напитка 330мл',    price: 1.25,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 35, calories: 180, isHealthy: true  },
  { name: 'DEVIN SPORT Изворна вода 750мл',      price: 0.51,  unit: 'бр.', store: 'Lidl', category: 'drinks',     protein: 0,  calories: 0,   isHealthy: true  },
  { name: 'BIRA Пиринско Младо 12x0.5л',        price: 6.13,  unit: 'бр.', store: 'Lidl', category: 'alcohol',    protein: 1,  calories: 43,  isHealthy: false },
  { name: 'КАМЕНИЦА Бира 6x0.5л',               price: 2.69,  unit: 'бр.', store: 'Lidl', category: 'alcohol',    protein: 1,  calories: 43,  isHealthy: false },
  { name: 'АРИАНА Бира 2л',                     price: 1.07,  unit: 'бр.', store: 'Lidl', category: 'alcohol',    protein: 1,  calories: 43,  isHealthy: false },
  { name: 'PILSNER URQUELL Бира 6x0.5л',        price: 5.62,  unit: 'бр.', store: 'Lidl', category: 'alcohol',    protein: 1,  calories: 42,  isHealthy: false },
  { name: 'STAROBRNO Бира 6x0.5л',              price: 3.57,  unit: 'бр.', store: 'Lidl', category: 'alcohol',    protein: 1,  calories: 42,  isHealthy: false },

  // ☕ КАФЕ
  { name: 'SEGAFREDO INTERMEZZO Кафе на зърна 1кг', price: 13.99, unit: 'бр.', store: 'Lidl', category: 'coffee', protein: 0,  calories: 2,   isHealthy: false },
  { name: 'LAVAZZA Кафе капсули Nespresso 80бр.', price: 24.54, unit: 'бр.', store: 'Lidl', category: 'coffee',   protein: 0,  calories: 2,   isHealthy: false },
  { name: 'LAVAZZA CREMA E GUSTO Мляно 8x250г',  price: 30.67, unit: 'бр.', store: 'Lidl', category: 'coffee',   protein: 0,  calories: 2,   isHealthy: false },
  { name: 'NESCAFÉ DOLCE GUSTO Капсули 30бр.',   price: 7.79,  unit: 'бр.', store: 'Lidl', category: 'coffee',   protein: 0,  calories: 2,   isHealthy: false },

  // 🍪 СНАКСИ / СЛАДКИ
  { name: 'CHIO Чипс 240г',                     price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 6,  calories: 530, isHealthy: false },
  { name: 'POM-BÄR Картофен снакс 80г',         price: 1.02,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 3,  calories: 480, isHealthy: false },
  { name: 'BOРОВЕЦ Вафли 120г',                  price: 0.51,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 5,  calories: 520, isHealthy: false },
  { name: 'Чипс ERIDANOUS 200г',                price: 1.78,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 5,  calories: 510, isHealthy: false },
  { name: 'Гризини ERIDANOUS 175г',             price: 1.27,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 9,  calories: 410, isHealthy: false },
  { name: 'Халва с бадеми 250г',                price: 1.78,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 10, calories: 490, isHealthy: false },
  { name: 'Халва с какао 250г',                 price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 10, calories: 490, isHealthy: false },
  { name: 'Карамелизирани бадеми 150г',         price: 1.99,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 15, calories: 500, isHealthy: false },
  { name: 'Меломакарона ERIDANOUS 220г',        price: 3.32,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 5,  calories: 450, isHealthy: false },
  { name: 'Локум ERIDANOUS 400г',              price: 1.94,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 1,  calories: 335, isHealthy: false },
  { name: 'Баdemово блокче 60г',               price: 0.79,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 6,  calories: 200, isHealthy: false },
  { name: 'Бадеми сурови 200г',                price: 2.09,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 21, calories: 579, isHealthy: true  },
  { name: 'NESTLE Зърнена закуска 375г',        price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 9,  calories: 380, isHealthy: false },
  { name: 'PAPADOPOULOS Petit-Beurre 2x225г',  price: 1.59,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 7,  calories: 440, isHealthy: false },
  { name: 'TWINI Бисквити без захар 176г',      price: 1.02,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 8,  calories: 395, isHealthy: true  },
  { name: 'Шоколадов чипс 125г',               price: 2.55,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 5,  calories: 540, isHealthy: false },
  { name: 'Соленки Панделки 150г',             price: 1.09,  unit: 'бр.', store: 'Lidl', category: 'snacks',    protein: 7,  calories: 420, isHealthy: false },

  // 💪 ПРОТЕИНОВИ
  { name: 'Скир с плодове 150г',                price: 0.59,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 13, calories: 85,  isHealthy: true  },
  { name: 'Висококопротеинов йогурт 4x125г',    price: 1.69,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 12, calories: 70,  isHealthy: true  },
  { name: 'Висококопротеиново мляко с ориз 200г', price: 0.99, unit: 'бр.', store: 'Lidl', category: 'protein',  protein: 10, calories: 130, isHealthy: true  },
  { name: 'Висококопротеинови тортила питки 320г', price: 1.49, unit: 'бр.', store: 'Lidl', category: 'protein', protein: 12, calories: 210, isHealthy: true  },
  { name: 'Висококопротеинови кюфтенца 200г',   price: 2.70,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 22, calories: 165, isHealthy: true  },
  { name: 'Висококопротеинов мус 175г',          price: 0.76,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 19, calories: 100, isHealthy: true  },
  { name: 'Протеинов бар 65г',                  price: 1.29,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 28, calories: 220, isHealthy: true  },
  { name: 'Висококопротеинова кафе напитка 250мл', price: 0.69, unit: 'бр.', store: 'Lidl', category: 'protein', protein: 19, calories: 110, isHealthy: true  },
  { name: 'Протеинови топчета 45г',             price: 0.99,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 10, calories: 150, isHealthy: true  },
  { name: 'Висококопротеинов пудинг 4x125г',    price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 13, calories: 130, isHealthy: true  },
  { name: 'BORN WINNER Протеин на прах 810г',   price: 20.45, unit: 'бр.', store: 'Lidl', category: 'protein',   protein: 21, calories: 105, isHealthy: true  },
  { name: 'Висококопротеинова овесена закуска 200г', price: 1.49, unit: 'бр.', store: 'Lidl', category: 'protein', protein: 10, calories: 340, isHealthy: true },
  { name: 'Висококопротеинов микс за палачинки 150г', price: 2.29, unit: 'бр.', store: 'Lidl', category: 'protein', protein: 25, calories: 310, isHealthy: true },
  { name: 'Висококопротеиново фъстъчено масло 350г', price: 2.99, unit: 'бр.', store: 'Lidl', category: 'protein', protein: 28, calories: 580, isHealthy: true },

  // 🌿 БИО (разпределени по реална категория)
  { name: 'Био алтернативна паста 250г',        price: 1.73,  unit: 'бр.', store: 'Lidl', category: 'grains',    protein: 22, calories: 340, isHealthy: true  },
  { name: 'Био пица с прошуто 350г',            price: 3.57,  unit: 'бр.', store: 'Lidl', category: 'frozen',    protein: 14, calories: 265, isHealthy: false },
  { name: 'Био пица Джоб 2x120г',              price: 3.06,  unit: 'бр.', store: 'Lidl', category: 'frozen',    protein: 10, calories: 240, isHealthy: false },
  { name: 'Био десерт Кварк 12x50г',           price: 3.32,  unit: 'бр.', store: 'Lidl', category: 'dairy',     protein: 8,  calories: 90,  isHealthy: true  },
  { name: 'Био зърнесто прясно сирене 200г',   price: 1.68,  unit: 'бр.', store: 'Lidl', category: 'dairy',     protein: 11, calories: 100, isHealthy: true  },
];

const BATCH_SIZE = 499; // Firestore max is 500 operations per batch

async function seed() {
  console.log(`Добавяне на ${products.length} продукта с batch writes...`);
  const ts = serverTimestamp();
  let count = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = products.slice(i, i + BATCH_SIZE);

    chunk.forEach((product) => {
      const ref = doc(collection(db, 'products'));
      batch.set(ref, { ...product, createdAt: ts });
    });

    await batch.commit();
    count += chunk.length;
    console.log(`✅ Добавени ${count}/${products.length} продукта...`);
  }

  console.log(`\n🎉 Готово! Добавени ${count} продукта.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Грешка:', err.message);
  process.exit(1);
});
