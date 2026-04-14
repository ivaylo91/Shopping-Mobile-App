import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getCategoryIcon } from '../utils/ui';

// ─── Recipes ──────────────────────────────────────────────────────────────────
// ingredients: maps human-readable label → matching key stem used for product lookup
// tags: 'vegetarian' | 'quick' (≤25 min) | 'high_protein' (protein ≥30g)

const RECIPES = {
  meat: [
    {
      title: 'Бързо пиле с аспержи на тиган',
      keys: ['пиле', 'пилешк', 'аспержи', 'масл'],
      ingredients: [
        { label: 'Пилешко филе', key: 'пилешк' },
        { label: 'Аспержи', key: 'аспержи' },
        { label: 'Масло', key: 'масл' },
        { label: 'Чесън', key: 'чесън' },
      ],
      calories: 320, protein: 35, carbs: 8, fat: 14, prepTime: 20,
      tags: ['quick', 'high_protein'],
      url: 'https://recepti.gotvach.bg/r-289518-Бързо_пиле_с_аспержи_на_тиган',
      desc: 'Пилешкото филе се нарязва на малки хапки и се запържва в тиган с масло и подправки.',
    },
    {
      title: 'Свинско контрафиле на тиган с хрупкави аспержи',
      keys: ['свинск', 'контраф', 'аспержи'],
      ingredients: [
        { label: 'Свинско контрафиле', key: 'свинск' },
        { label: 'Аспержи', key: 'аспержи' },
        { label: 'Масло', key: 'масл' },
      ],
      calories: 420, protein: 32, carbs: 5, fat: 22, prepTime: 25,
      tags: ['quick', 'high_protein'],
      url: 'https://recepti.gotvach.bg/r-289553-Свинско_контрафиле_на_тиган_с_хрупкави_аспержи',
      desc: 'Свинското контрафиле се изпича на тиган до хрупкава коричка и се поднася с аспержи.',
    },
    {
      title: 'Крехко телешко с лук и домати',
      keys: ['говежд', 'телешк', 'лук', 'домат'],
      ingredients: [
        { label: 'Телешко месо', key: 'телешк' },
        { label: 'Лук', key: 'лук' },
        { label: 'Домати', key: 'домат' },
      ],
      calories: 380, protein: 28, carbs: 12, fat: 18, prepTime: 60,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-289493-Крехко_телешко_с_лук_и_домати_(Swiss_Steak)',
      desc: 'Телешките пържоли се задушават с лук и домати до пълно омекване.',
    },
    {
      title: 'Ароматно свинско печено с картофи и зеленчуци',
      keys: ['свинск', 'картоф', 'морков', 'лук'],
      ingredients: [
        { label: 'Свинско месо', key: 'свинск' },
        { label: 'Картофи', key: 'картоф' },
        { label: 'Моркови', key: 'морков' },
        { label: 'Лук', key: 'лук' },
      ],
      calories: 490, protein: 35, carbs: 30, fat: 20, prepTime: 90,
      tags: ['high_protein'],
      url: 'https://recepti.gotvach.bg/r-289479-Ароматно_свинско_печено_с_картофи_и_зеленчуци',
      desc: 'Свинско месо, печено на фурна с картофи, моркови и подправки на 190°C.',
    },
    {
      title: 'Агнешки джоланчета с картофи',
      keys: ['агнешк', 'джолан', 'картоф', 'лук'],
      ingredients: [
        { label: 'Агнешко', key: 'агнешк' },
        { label: 'Картофи', key: 'картоф' },
        { label: 'Лук', key: 'лук' },
      ],
      calories: 510, protein: 40, carbs: 25, fat: 28, prepTime: 120,
      tags: ['high_protein'],
      url: 'https://recepti.gotvach.bg/r-288118-Агнешки_джоланчета_с_картофи',
      desc: 'Агнешки джолани, бавно изпечени с картофи и ароматни подправки.',
    },
    {
      title: 'Кайма с ориз и зеленчуци',
      keys: ['кайма', 'ориз', 'домат', 'чушк', 'лук'],
      ingredients: [
        { label: 'Кайма', key: 'кайма' },
        { label: 'Ориз', key: 'ориз' },
        { label: 'Домати', key: 'домат' },
        { label: 'Чушки', key: 'чушк' },
      ],
      calories: 410, protein: 25, carbs: 40, fat: 15, prepTime: 35,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-288000-Кайма_с_ориз_и_зеленчуци',
      desc: 'Телешка или смесена кайма задушена с ориз, домати и чушки.',
    },
    {
      title: 'Пиле с картофи на фурна',
      keys: ['пиле', 'пилешк', 'картоф', 'лук'],
      ingredients: [
        { label: 'Пиле', key: 'пилешк' },
        { label: 'Картофи', key: 'картоф' },
        { label: 'Лук', key: 'лук' },
        { label: 'Масло', key: 'масл' },
      ],
      calories: 450, protein: 38, carbs: 35, fat: 16, prepTime: 60,
      tags: ['high_protein'],
      url: 'https://recepti.gotvach.bg/r-287000-Пиле_с_картофи_на_фурна',
      desc: 'Класическо пиле с картофи, изпечено на фурна с масло и подправки.',
    },
  ],

  fish: [
    {
      title: 'Лека рибна запеканка за вечеря',
      keys: ['риба', 'рибн', 'рибно', 'лук', 'домат'],
      ingredients: [
        { label: 'Рибно филе', key: 'рибно' },
        { label: 'Лук', key: 'лук' },
        { label: 'Домати', key: 'домат' },
      ],
      calories: 290, protein: 22, carbs: 18, fat: 12, prepTime: 30,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-289340-Лека_рибна_запеканка_за_вечеря',
      desc: 'Рибно филе с хляб и зеленчуци, запечено на фурна за лека вечеря.',
    },
    {
      title: 'Сьомга със сос от синьо сирене и гъби',
      keys: ['сьомга', 'сирен', 'гъб', 'печурк', 'масл'],
      ingredients: [
        { label: 'Сьомга', key: 'сьомга' },
        { label: 'Сирене', key: 'сирен' },
        { label: 'Гъби', key: 'гъб' },
        { label: 'Масло', key: 'масл' },
      ],
      calories: 370, protein: 28, carbs: 5, fat: 22, prepTime: 25,
      tags: ['quick', 'high_protein'],
      url: 'https://recepti.gotvach.bg/r-288255-Сьомга_със_сос_от_синьо_сирене_и_гъби',
      desc: 'Сьомга, изпечена на тиган и поднесена с кремообразен сос от сирене и гъби.',
    },
    {
      title: 'Скариди в чесново масло',
      keys: ['скарид', 'масл', 'чесън'],
      ingredients: [
        { label: 'Скариди', key: 'скарид' },
        { label: 'Масло', key: 'масл' },
        { label: 'Чесън', key: 'чесън' },
      ],
      calories: 240, protein: 20, carbs: 2, fat: 14, prepTime: 10,
      tags: ['quick'],
      url: 'https://recepti.gotvach.bg/r-288260-Скариди_в_чесново_масло',
      desc: 'Скаридите се запържват в масло с чесън и магданоз — готово за 10 минути.',
    },
    {
      title: 'Кеджъри с пушена сьомга и ориз',
      keys: ['сьомга', 'ориз', 'яйц'],
      ingredients: [
        { label: 'Пушена сьомга', key: 'сьомга' },
        { label: 'Ориз', key: 'ориз' },
        { label: 'Яйца', key: 'яйц' },
      ],
      calories: 420, protein: 24, carbs: 45, fat: 12, prepTime: 30,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-288256-Кеджъри_с_пушена_сьомга_и_ориз',
      desc: 'Класическо ястие с пушена сьомга, ориз и яйца — сити и ароматно.',
    },
    {
      title: 'Печена риба със зеленчуци',
      keys: ['риба', 'рибн', 'рибно', 'картоф', 'лук', 'домат'],
      ingredients: [
        { label: 'Риба', key: 'рибно' },
        { label: 'Картофи', key: 'картоф' },
        { label: 'Лук', key: 'лук' },
      ],
      calories: 310, protein: 25, carbs: 15, fat: 10, prepTime: 40,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-288027-Печена_риба_със_зеленчуци_-_тип_пеперуда',
      desc: 'Цяла риба, разгъната като пеперуда и изпечена с пресни зеленчуци.',
    },
  ],

  soup: [
    {
      title: 'Перфектната крем супа от леща',
      keys: ['леща', 'лещен', 'червена', 'морков', 'лук'],
      ingredients: [
        { label: 'Леща', key: 'леща' },
        { label: 'Морков', key: 'морков' },
        { label: 'Лук', key: 'лук' },
      ],
      calories: 220, protein: 12, carbs: 35, fat: 5, prepTime: 30,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-288374-Перфектната_крем_супа_от_леща',
      desc: 'Кадифена крем супа от червена леща с лук, морков и подправки.',
    },
    {
      title: 'Крем супа от спанак, батат и пащърнак',
      keys: ['спанак', 'батат', 'морков'],
      ingredients: [
        { label: 'Спанак', key: 'спанак' },
        { label: 'Батат', key: 'батат' },
        { label: 'Морков', key: 'морков' },
      ],
      calories: 190, protein: 6, carbs: 28, fat: 6, prepTime: 25,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-287955-Крем_супа_от_спанак,_батат_и_пащърнак',
      desc: 'Богата крем супа от спанак и сладки картофи — здравословна и засища.',
    },
    {
      title: 'Нежна крем супа с праз и гъби',
      keys: ['гъб', 'печурк', 'праз', 'лук', 'картоф'],
      ingredients: [
        { label: 'Гъби', key: 'гъб' },
        { label: 'Праз', key: 'праз' },
        { label: 'Картофи', key: 'картоф' },
      ],
      calories: 210, protein: 5, carbs: 22, fat: 8, prepTime: 30,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-287367-Нежна_крем_супа_с_праз_и_гъби',
      desc: 'Праз и гъби, задушени с масло и пасирани до копринена текстура.',
    },
    {
      title: 'Пилешка супа с фиде',
      keys: ['пиле', 'пилешк', 'морков', 'лук', 'целин'],
      ingredients: [
        { label: 'Пиле', key: 'пилешк' },
        { label: 'Морков', key: 'морков' },
        { label: 'Лук', key: 'лук' },
      ],
      calories: 260, protein: 20, carbs: 25, fat: 8, prepTime: 45,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-286000-Пилешка_супа_с_фиде',
      desc: 'Домашна пилешка супа с моркови, лук и фиде — топла и засищаща.',
    },
    {
      title: 'Боб чорба по старобългарски',
      keys: ['боб', 'лук', 'морков', 'чушк', 'домат'],
      ingredients: [
        { label: 'Боб', key: 'боб' },
        { label: 'Лук', key: 'лук' },
        { label: 'Морков', key: 'морков' },
        { label: 'Чушки', key: 'чушк' },
      ],
      calories: 280, protein: 10, carbs: 45, fat: 4, prepTime: 60,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-285000-Боб_чорба_по_старобългарски',
      desc: 'Традиционна боб чорба с морков, лук и чушки — класика на българската кухня.',
    },
    {
      title: 'Картофена супа с кашкавал',
      keys: ['картоф', 'сирен', 'кашкав', 'лук'],
      ingredients: [
        { label: 'Картофи', key: 'картоф' },
        { label: 'Кашкавал', key: 'кашкав' },
        { label: 'Лук', key: 'лук' },
      ],
      calories: 300, protein: 12, carbs: 40, fat: 14, prepTime: 35,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-287000-Картофена_супа_с_кашкавал',
      desc: 'Гъста картофена супа с разтопен кашкавал и лук — сгряваща и вкусна.',
    },
  ],

  salad: [
    {
      title: 'Класическа яйчена салата с грах',
      keys: ['яйц', 'грах', 'майонез'],
      ingredients: [
        { label: 'Яйца', key: 'яйц' },
        { label: 'Грах', key: 'грах' },
        { label: 'Майонеза', key: 'майонез' },
      ],
      calories: 180, protein: 10, carbs: 12, fat: 12, prepTime: 15,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-289505-Класическа_яйчена_салата_с_грах',
      desc: 'Твърдо сварени яйца, грах и майонеза — бърза и вкусна салата.',
    },
    {
      title: 'Салата с нахут, сирене и авокадо',
      keys: ['нахут', 'сирен', 'фета', 'домат', 'краставиц', 'маслин'],
      ingredients: [
        { label: 'Нахут', key: 'нахут' },
        { label: 'Сирене', key: 'сирен' },
        { label: 'Домати', key: 'домат' },
        { label: 'Авокадо', key: 'авокад' },
      ],
      calories: 310, protein: 14, carbs: 28, fat: 16, prepTime: 15,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-287964-Салата_с_нахут,_сирене_и_авокадо',
      desc: 'Нахут, фета сирене и авокадо с лимонов дресинг.',
    },
    {
      title: 'Пълнени гъби със спанак, галета и сирене',
      keys: ['гъб', 'печурк', 'спанак', 'сирен', 'кашкав'],
      ingredients: [
        { label: 'Гъби', key: 'гъб' },
        { label: 'Спанак', key: 'спанак' },
        { label: 'Сирене', key: 'сирен' },
      ],
      calories: 270, protein: 12, carbs: 15, fat: 14, prepTime: 30,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-287965-Пълнени_гъби_със_спанак,_галета_и_сирене',
      desc: 'Гъбени шапки, пълнени с ароматна смес от спанак и сирене.',
    },
    {
      title: 'Шопска салата',
      keys: ['домат', 'краставиц', 'чушк', 'сирен', 'фета', 'лук', 'маслин'],
      ingredients: [
        { label: 'Домати', key: 'домат' },
        { label: 'Краставица', key: 'краставиц' },
        { label: 'Сирене', key: 'сирен' },
        { label: 'Чушки', key: 'чушк' },
      ],
      calories: 150, protein: 8, carbs: 10, fat: 8, prepTime: 10,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-280000-Шопска_салата',
      desc: 'Класическа шопска салата с домати, краставици, чушки и бяло сирене.',
    },
    {
      title: 'Салата с моркови и чесън',
      keys: ['морков', 'чесън', 'лимон'],
      ingredients: [
        { label: 'Моркови', key: 'морков' },
        { label: 'Чесън', key: 'чесън' },
      ],
      calories: 90, protein: 2, carbs: 12, fat: 2, prepTime: 10,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-283000-Салата_от_моркови_с_чесън',
      desc: 'Настъргани моркови с чесън и лимонов сок — лека и здравословна.',
    },
  ],

  bulgarian: [
    {
      title: 'Меки като облак златисти палачинки',
      keys: ['яйц', 'мляко', 'млечн', 'кисело', 'краве', 'брашн', 'хляб'],
      ingredients: [
        { label: 'Яйца', key: 'яйц' },
        { label: 'Мляко', key: 'мляко' },
        { label: 'Брашно', key: 'брашн' },
      ],
      calories: 340, protein: 12, carbs: 45, fat: 14, prepTime: 20,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-287947-Меки_като_облак_златисти_палачинки',
      desc: 'Пухкави палачинки с мляко и яйца — класическа закуска за цялото семейство.',
    },
    {
      title: 'Панирани картофени кюфтета с пресен лук',
      keys: ['картоф', 'лук', 'яйц', 'брашн'],
      ingredients: [
        { label: 'Картофи', key: 'картоф' },
        { label: 'Лук', key: 'лук' },
        { label: 'Яйца', key: 'яйц' },
      ],
      calories: 360, protein: 8, carbs: 40, fat: 18, prepTime: 30,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-289466-Панирани_картофени_кюфтета_с_пресен_лук',
      desc: 'Картофени кюфтета с пресен лук, панирани и запържени до хрупкавост.',
    },
    {
      title: 'Постни сарми от лапад',
      keys: ['ориз', 'лук', 'морков', 'домат'],
      ingredients: [
        { label: 'Ориз', key: 'ориз' },
        { label: 'Лук', key: 'лук' },
        { label: 'Морков', key: 'морков' },
      ],
      calories: 290, protein: 8, carbs: 42, fat: 6, prepTime: 60,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-289416-Постни_сарми_от_лапад',
      desc: 'Традиционни постни сарми, завити в листа от лапад с пълнеж от ориз и лук.',
    },
    {
      title: 'Мусака с картофи и кайма',
      keys: ['кайма', 'картоф', 'яйц', 'мляко', 'кисело', 'лук'],
      ingredients: [
        { label: 'Кайма', key: 'кайма' },
        { label: 'Картофи', key: 'картоф' },
        { label: 'Яйца', key: 'яйц' },
        { label: 'Мляко', key: 'мляко' },
      ],
      calories: 480, protein: 25, carbs: 38, fat: 22, prepTime: 70,
      tags: [],
      url: 'https://recepti.gotvach.bg/r-281000-Мусака_с_картофи_и_кайма',
      desc: 'Класическа мусака с кайма, картофи и коричка от яйца и мляко.',
    },
    {
      title: 'Баница със сирене',
      keys: ['сирен', 'фета', 'яйц', 'масл'],
      ingredients: [
        { label: 'Сирене', key: 'сирен' },
        { label: 'Яйца', key: 'яйц' },
        { label: 'Масло', key: 'масл' },
      ],
      calories: 410, protein: 15, carbs: 35, fat: 22, prepTime: 45,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-280500-Баница_със_сирене',
      desc: 'Домашна баница с бяло сирене и яйца — хрупкава и вкусна закуска.',
    },
    {
      title: 'Гювеч с телешко и зеленчуци',
      keys: ['говежд', 'телешк', 'картоф', 'морков', 'чушк', 'домат', 'лук'],
      ingredients: [
        { label: 'Телешко', key: 'телешк' },
        { label: 'Картофи', key: 'картоф' },
        { label: 'Чушки', key: 'чушк' },
        { label: 'Домати', key: 'домат' },
      ],
      calories: 430, protein: 30, carbs: 32, fat: 16, prepTime: 90,
      tags: ['high_protein'],
      url: 'https://recepti.gotvach.bg/r-282000-Гювеч_с_телешко_и_зеленчуци',
      desc: 'Телешко месо задушено с картофи, моркови и чушки в гювеч.',
    },
  ],

  dessert: [
    {
      title: 'Постна портокалова торта без захар и печене',
      keys: ['портокал', 'бисквит'],
      ingredients: [
        { label: 'Портокали', key: 'портокал' },
        { label: 'Бисквити', key: 'бисквит' },
      ],
      calories: 260, protein: 5, carbs: 42, fat: 8, prepTime: 20,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-289315-Постна_портокалова_торта_без_захар_и_печене',
      desc: 'Лесна торта с бисквити и портокалов крем — без печене и без захар.',
    },
    {
      title: 'Бяла бисквитена торта с бананов крем',
      keys: ['банан', 'мляко', 'млечн', 'бисквит'],
      ingredients: [
        { label: 'Банани', key: 'банан' },
        { label: 'Мляко', key: 'мляко' },
        { label: 'Бисквити', key: 'бисквит' },
      ],
      calories: 320, protein: 6, carbs: 48, fat: 12, prepTime: 25,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-289509-Бяла_бисквитена_торта_с_бананов_крем',
      desc: 'Бисквитена торта с копринен бананов крем — без фурна.',
    },
    {
      title: 'Плодова салата с мед',
      keys: ['ябълк', 'банан', 'портокал', 'мед'],
      ingredients: [
        { label: 'Ябълки', key: 'ябълк' },
        { label: 'Банани', key: 'банан' },
        { label: 'Мед', key: 'мед' },
      ],
      calories: 120, protein: 2, carbs: 28, fat: 1, prepTime: 10,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-283000-Плодова_салата_с_мед',
      desc: 'Свежа плодова салата с мед и лимон — лек и здравословен десерт.',
    },
  ],

  veg: [
    {
      title: 'Хрупкави топчета от броколи',
      keys: ['брокол', 'яйц', 'сирен', 'кашкав'],
      ingredients: [
        { label: 'Броколи', key: 'брокол' },
        { label: 'Яйца', key: 'яйц' },
        { label: 'Сирене', key: 'сирен' },
      ],
      calories: 230, protein: 14, carbs: 18, fat: 12, prepTime: 25,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-287422-Хрупкави_топчета_от_броколи',
      desc: 'Броколи, смесено с яйца и сирене, оформено на топчета и запечено.',
    },
    {
      title: 'Домашна пица с левурда и моцарела',
      keys: ['сирен', 'моцарел', 'кашкав', 'домат', 'брашн'],
      ingredients: [
        { label: 'Моцарела', key: 'моцарел' },
        { label: 'Домати', key: 'домат' },
        { label: 'Брашно', key: 'брашн' },
      ],
      calories: 520, protein: 16, carbs: 60, fat: 18, prepTime: 45,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-288552-Домашна_пица_с_левурда_и_моцарела',
      desc: 'Домашна пица с тесто, левурда и разтопена моцарела.',
    },
    {
      title: 'Пъстра яхния от зеленчуци',
      keys: ['тиквич', 'чушк', 'домат', 'лук', 'морков', 'картоф'],
      ingredients: [
        { label: 'Тиквички', key: 'тиквич' },
        { label: 'Чушки', key: 'чушк' },
        { label: 'Домати', key: 'домат' },
        { label: 'Морков', key: 'морков' },
      ],
      calories: 180, protein: 5, carbs: 25, fat: 6, prepTime: 30,
      tags: ['vegetarian'],
      url: 'https://recepti.gotvach.bg/r-286000-Пъстра_яхния_от_зеленчуци',
      desc: 'Сезонни зеленчуци, задушени с домати и подправки до нежна яхния.',
    },
    {
      title: 'Пържени тиквички с кисело мляко',
      keys: ['тиквич', 'кисело', 'млечн', 'чесън', 'яйц'],
      ingredients: [
        { label: 'Тиквички', key: 'тиквич' },
        { label: 'Кисело мляко', key: 'кисело' },
        { label: 'Чесън', key: 'чесън' },
      ],
      calories: 200, protein: 8, carbs: 18, fat: 12, prepTime: 20,
      tags: ['vegetarian', 'quick'],
      url: 'https://recepti.gotvach.bg/r-284000-Пържени_тиквички_с_кисело_мляко',
      desc: 'Хрупкави тиквички, поднесени с чеснов сос от кисело мляко.',
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/\d+(\.\d+)?\s*(кг|г|л|мл|бр\.?|х|x)/g, '')
    .replace(/[^а-яёa-z\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreRecipe(recipe, products) {
  const allTokens = products.flatMap((p) => tokenize(p.name));
  let score = 0;
  for (const key of recipe.keys) {
    if (allTokens.some((t) => t.startsWith(key) || key.startsWith(t))) score++;
  }
  return score;
}

function matchedProducts(recipe, products, max = 3) {
  return products
    .filter((p) => {
      const tokens = tokenize(p.name);
      return recipe.keys.some((key) =>
        tokens.some((t) => t.startsWith(key) || key.startsWith(t))
      );
    })
    .slice(0, max);
}

function getMissingIngredients(recipe, products) {
  if (!recipe.ingredients?.length) return [];
  const allTokens = products.flatMap((p) => tokenize(p.name));
  return recipe.ingredients
    .filter(
      ({ key }) =>
        !allTokens.some((t) => t.startsWith(key) || key.startsWith(t))
    )
    .map(({ label }) => label);
}

// Deterministic-ish shuffle using a numeric seed so useMemo stays stable
function seededShuffle(arr, seed) {
  const out = [...arr];
  let s = Math.abs(seed * 9301 + 49297) % 233280;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const SLOT_POOLS = {
  breakfast: ['bulgarian', 'salad', 'dessert'],
  lunch:     ['meat', 'fish', 'soup', 'veg', 'bulgarian'],
  dinner:    ['meat', 'fish', 'veg', 'bulgarian', 'soup'],
  snack:     ['salad', 'dessert', 'veg'],
};

const SLOT_CATS = {
  breakfast: ['eggs', 'dairy', 'bakery', 'grains', 'fruit'],
  lunch:     ['meat', 'fish', 'vegetables', 'legumes', 'grains', 'canned'],
  dinner:    ['meat', 'fish', 'dairy', 'vegetables', 'eggs', 'grains', 'frozen'],
  snack:     ['fruit', 'snacks', 'dairy', 'bakery', 'frozen'],
};

function pickRecipe(slotKey, allProducts, excludedTitles, activeFilters, seed) {
  const poolKeys = SLOT_POOLS[slotKey];
  let candidates = poolKeys.flatMap((k) => RECIPES[k] || []);

  // Apply active filters; fall back to unfiltered if no candidates survive
  let filtered = candidates;
  if (activeFilters.vegetarian) filtered = filtered.filter((r) => r.tags?.includes('vegetarian'));
  if (activeFilters.quick)      filtered = filtered.filter((r) => r.tags?.includes('quick'));
  if (activeFilters.highProtein) filtered = filtered.filter((r) => r.tags?.includes('high_protein'));
  if (filtered.length > 0) candidates = filtered;

  const available = candidates.filter((r) => !excludedTitles.has(r.title));
  const pool = available.length ? available : candidates;

  const slotCats = SLOT_CATS[slotKey];
  const slotProducts = allProducts.filter((p) => slotCats.includes(p.category?.toLowerCase()));
  const scoringProducts = slotProducts.length > 0 ? slotProducts : allProducts;

  const shuffled = seededShuffle(pool, seed + slotKey.charCodeAt(0));
  const scored = shuffled
    .map((r) => ({ recipe: r, score: scoreRecipe(r, scoringProducts) }))
    .sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0) return scored[0].recipe;
  return shuffled[0] || pool[0];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Закуска', icon: '🌅', color: '#f39c12' },
  { key: 'lunch',     label: 'Обяд',    icon: '☀️',  color: '#6C63FF' },
  { key: 'dinner',    label: 'Вечеря',  icon: '🌙',  color: '#2ecc71' },
  { key: 'snack',     label: 'Снак',    icon: '⚡',   color: '#e74c3c' },
];

const FILTERS = [
  { key: 'vegetarian',  label: 'Вегетарианско', icon: '🥦' },
  { key: 'quick',       label: 'Бързо ≤25мин',  icon: '⚡' },
  { key: 'highProtein', label: 'Много протеин',  icon: '💪' },
];

function cleanName(raw) {
  return raw
    .replace(/\s*(≈|~)?\d+(\.\d+)?(кг|г|л|мл)\b/gi, '')
    .replace(/\s*\d+x\d+[^\s]*/gi, '')
    .replace(/\bXXL\b|\bXL\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

function youtubeUrl(title) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' рецепта')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCalCard({ item }) {
  return (
    <View style={styles.calCard}>
      <Text style={styles.calCardIcon}>{getCategoryIcon(item.category)}</Text>
      <Text style={styles.calCardName} numberOfLines={2}>{cleanName(item.name)}</Text>
      <View style={styles.calBadge}>
        <Text style={styles.calBadgeText}>{item.calories ?? '—'}</Text>
        <Text style={styles.calBadgeUnit}>ккал</Text>
      </View>
    </View>
  );
}

function MacroBar({ protein, carbs, fat, calories }) {
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroItem}>
        <Text style={styles.macroValue}>{protein}г</Text>
        <Text style={styles.macroLabel}>Протеин</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={styles.macroValue}>{carbs}г</Text>
        <Text style={styles.macroLabel}>Въглехидрати</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={styles.macroValue}>{fat}г</Text>
        <Text style={styles.macroLabel}>Мазнини</Text>
      </View>
      <View style={styles.macroDivider} />
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: '#6C63FF' }]}>~{calories}</Text>
        <Text style={styles.macroLabel}>ккал</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealsScreen({ route, navigation }) {
  const { list } = route.params || {};
  const allProducts = list || [];

  const [filters, setFilters] = useState({ vegetarian: false, quick: false, highProtein: false });
  // excludedBySlot: { [slotKey]: Set<title> } — tracks swapped-out recipes per slot
  const [excludedBySlot, setExcludedBySlot] = useState({});
  // Increment to randomize the plan
  const [planSeed, setPlanSeed] = useState(() => Date.now() % 10000);

  const productsSortedByCal = useMemo(
    () => [...allProducts].filter((p) => p.calories > 0).sort((a, b) => b.calories - a.calories),
    [allProducts]
  );

  const slots = useMemo(() => {
    const usedTitles = new Set();
    return MEAL_SLOTS.map((slot) => {
      const excluded = excludedBySlot[slot.key] || new Set();
      const allExcluded = new Set([...usedTitles, ...excluded]);
      const recipe = pickRecipe(slot.key, allProducts, allExcluded, filters, planSeed);
      usedTitles.add(recipe.title);
      const featured = matchedProducts(recipe, allProducts);
      const missing = getMissingIngredients(recipe, allProducts);
      return { slot, recipe, featured, missing };
    });
  }, [allProducts, excludedBySlot, filters, planSeed]);

  const totals = useMemo(() => ({
    protein:  slots.reduce((s, { recipe }) => s + (recipe.protein  || 0), 0),
    carbs:    slots.reduce((s, { recipe }) => s + (recipe.carbs    || 0), 0),
    fat:      slots.reduce((s, { recipe }) => s + (recipe.fat      || 0), 0),
    calories: slots.reduce((s, { recipe }) => s + (recipe.calories || 0), 0),
  }), [slots]);

  const toggleFilter = useCallback((key) => {
    Haptics.selectionAsync();
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    setExcludedBySlot({}); // reset swaps when filter changes
  }, []);

  const swapMeal = useCallback((slotKey, currentTitle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExcludedBySlot((prev) => ({
      ...prev,
      [slotKey]: new Set([...(prev[slotKey] || []), currentTitle]),
    }));
  }, []);

  const regenerateAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExcludedBySlot({});
    setPlanSeed(Date.now() % 10000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Идеи за ястия 🍽️</Text>
          <Text style={styles.headerSub}>Рецепти от gotvach.bg по вашите продукти</Text>
        </View>
        <TouchableOpacity style={styles.regenerateBtn} onPress={regenerateAll}>
          <Ionicons name="shuffle-outline" size={18} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label, icon }) => {
          const active = filters[key];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => toggleFilter(key)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterChipIcon}>{icon}</Text>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Products & Calories panel */}
        {productsSortedByCal.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Продукти • килокалории</Text>
            <FlatList
              data={productsSortedByCal}
              keyExtractor={(item) => item.id ?? item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calRow}
              renderItem={({ item }) => <ProductCalCard item={item} />}
            />
          </View>
        )}

        {/* Daily macro summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Дневни макронутриенти</Text>
          <MacroBar {...totals} />
        </View>

        {/* Daily plan */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Дневен план</Text>

          {slots.map(({ slot, recipe, featured, missing }) => (
            <View key={slot.key} style={[styles.card, { borderLeftColor: slot.color }]}>

              {/* Top row: badge + prep time + swap */}
              <View style={styles.cardTopRow}>
                <View style={[styles.badge, { backgroundColor: slot.color }]}>
                  <Text style={styles.badgeIcon}>{slot.icon}</Text>
                  <Text style={styles.badgeLabel}>{slot.label}</Text>
                </View>

                <View style={styles.cardTopRight}>
                  {/* Prep time */}
                  <View style={styles.prepTimeBadge}>
                    <Ionicons name="time-outline" size={11} color="#999" />
                    <Text style={styles.prepTimeText}>{recipe.prepTime} мин</Text>
                  </View>
                  {/* Calories chip */}
                  <View style={[styles.calChip, { borderColor: slot.color }]}>
                    <Text style={[styles.calChipText, { color: slot.color }]}>
                      {recipe.calories} ккал
                    </Text>
                  </View>
                  {/* Swap button */}
                  <TouchableOpacity
                    style={styles.swapBtn}
                    onPress={() => swapMeal(slot.key, recipe.title)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#6C63FF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recipe title */}
              <Text style={styles.recipeTitle}>{recipe.title}</Text>

              {/* Matched products from list */}
              {featured.length > 0 && (
                <View style={styles.productsBox}>
                  <Text style={styles.productsLabel}>✓ От вашия списък:</Text>
                  <View style={styles.pills}>
                    {featured.map((p) => (
                      <View key={p.id} style={[styles.pill, { borderColor: slot.color }]}>
                        <Text style={styles.pillIcon}>{getCategoryIcon(p.category)}</Text>
                        <Text style={[styles.pillText, { color: slot.color }]}>
                          {cleanName(p.name)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Missing ingredients */}
              {missing.length > 0 && (
                <View style={styles.missingBox}>
                  <Text style={styles.missingLabel}>🛒 Допълнително:</Text>
                  <View style={styles.pills}>
                    {missing.map((ing) => (
                      <View key={ing} style={styles.missingPill}>
                        <Text style={styles.missingPillText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Description */}
              <View style={styles.descBox}>
                <Text style={styles.descText}>{recipe.desc}</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: slot.color, flex: 1 }]}
                  onPress={() => Linking.openURL(recipe.url).catch(() => {})}
                >
                  <Text style={styles.linkBtnText}>📖 Виж рецепта</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ytBtn, { flex: 1 }]}
                  onPress={() => Linking.openURL(youtubeUrl(recipe.title)).catch(() => {})}
                >
                  <Text style={styles.ytBtnText}>▶ YouTube</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Обратно</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>🏠 Начало</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
  headerSub:   { fontSize: 13, color: '#999' },
  regenerateBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 12,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0F0',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  filterChipIcon: { fontSize: 12 },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#555' },
  filterChipTextActive: { color: '#fff' },

  scroll: { padding: 16 },
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },

  // Macros bar
  macroBar: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  macroLabel: { fontSize: 10, fontWeight: '600', color: '#aaa', marginTop: 2 },
  macroDivider: { width: 1, height: 32, backgroundColor: '#f0f0f0' },

  // Products calories strip
  calRow: { paddingBottom: 4, gap: 10 },
  calCard: {
    width: 90, backgroundColor: '#fff', borderRadius: 14,
    padding: 10, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  calCardIcon: { fontSize: 22 },
  calCardName: { fontSize: 10, fontWeight: '600', color: '#444', textAlign: 'center', lineHeight: 13 },
  calBadge: {
    backgroundColor: '#F0EEFF', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, alignItems: 'center', marginTop: 4,
  },
  calBadgeText: { fontSize: 13, fontWeight: '800', color: '#6C63FF' },
  calBadgeUnit: { fontSize: 9, fontWeight: '600', color: '#6C63FF', marginTop: -1 },

  // Recipe card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, gap: 5,
  },
  badgeIcon:  { fontSize: 13 },
  badgeLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  prepTimeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F7F8FC', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  prepTimeText: { fontSize: 11, fontWeight: '600', color: '#999' },

  calChip: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  calChipText: { fontSize: 12, fontWeight: '800' },

  swapBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center', alignItems: 'center',
  },

  recipeTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 12, lineHeight: 23 },

  // Matched products
  productsBox:   { marginBottom: 10 },
  productsLabel: { fontSize: 11, color: '#2ecc71', fontWeight: '700', marginBottom: 8 },

  // Missing ingredients
  missingBox:   { marginBottom: 10 },
  missingLabel: { fontSize: 11, color: '#f39c12', fontWeight: '700', marginBottom: 8 },
  missingPill: {
    backgroundColor: '#FFF8ED',
    borderWidth: 1.5, borderColor: '#f39c12', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  missingPillText: { fontSize: 12, fontWeight: '700', color: '#f39c12' },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 12, fontWeight: '700' },

  descBox: { backgroundColor: '#FFFBEA', borderRadius: 10, padding: 12, marginBottom: 12 },
  descText: { fontSize: 13, color: '#7d6608', lineHeight: 20 },

  btnRow: { flexDirection: 'row', gap: 10 },
  linkBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  linkBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ytBtn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#FF0000',
  },
  ytBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  footer: {
    flexDirection: 'row', padding: 16, gap: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  backBtn: {
    flex: 1, backgroundColor: '#F0EEFF', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  backBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  homeBtn: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
