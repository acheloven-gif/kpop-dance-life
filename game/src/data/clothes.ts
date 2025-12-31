// Full clothes catalog parsed from Clothes list.txt
// All items with suitability tags and point values

export type Suitability = 'женское' | 'мужское' | 'оба' | 'жен+оба' | 'муж+оба' | 'все';
export type Category = 'top' | 'bottom' | 'shoes' | 'accessory' | 'other';

export interface ClothesItem {
  id: string;
  name: string;
  category: Category;
  suitability: Suitability;
  points: number;
  price: number;
  img?: string | null;
}

export const CLOTHES_CATALOG: ClothesItem[] = [
  // Default inventory items (free, universal) - 3 points each = 9 total = 53% match
  { id: 'inv_top_white_tshirt', name: 'Белая футболка', category: 'top', suitability: 'все', points: 3, price: 0, img: '/clothes/top/base_top.png' },
  { id: 'inv_bottom_black_baggy', name: 'Черные мешковатые штаны', category: 'bottom', suitability: 'все', points: 3, price: 0, img: '/clothes/bot/base_bot.png' },
  { id: 'inv_shoes_white_sneakers', name: 'Белые кроссовки', category: 'shoes', suitability: 'все', points: 3, price: 0, img: '/clothes/shoe/base_shoes.png' },

  // ВЕРХ — TOPS (27 items)
  // ЖЕНСКОЕ (7)
  { id: 'top_w1', name: 'Кроп-топ из глиттера', category: 'top', suitability: 'женское', points: 4, price: 999, img: '/clothes/top/w1.png' },
  { id: 'top_w2', name: 'Пушистый топ', category: 'top', suitability: 'женское', points: 3, price: 1399, img: '/clothes/top/w2.png' },
  { id: 'top_w3', name: 'Джинсовый корсет с молнией', category: 'top', suitability: 'женское', points: 5, price: 1899, img: '/clothes/top/w3.png' },
  { id: 'top_w4', name: 'Топ с V-вырезом и чокером', category: 'top', suitability: 'женское', points: 5, price: 799, img: '/clothes/top/w4.png' },
  { id: 'top_w5', name: 'Блуза из тонкой ткани с пышными рукавами', category: 'top', suitability: 'женское', points: 5, price: 1299, img: '/clothes/top/w5.png' },
  { id: 'top_w6', name: 'Шелковая алая блузка', category: 'top', suitability: 'женское', points: 3, price: 799, img: '/clothes/top/w6.png' },
  { id: 'top_w7', name: 'Куртка-укороченный бомбер с меховыми рукавами', category: 'top', suitability: 'женское', points: 3, price: 2199, img: '/clothes/top/w7.png' },

  // МУЖСКОЕ (5)
  { id: 'top_m1', name: 'Спортивная майка с номером', category: 'top', suitability: 'мужское', points: 3, price: 399, img: '/clothes/top/m1.png' },
  { id: 'top_m2', name: 'Черная майка с сеткой', category: 'top', suitability: 'мужское', points: 5, price: 699, img: '/clothes/top/m2.png' },
  { id: 'top_m3', name: 'Жилет с цепями и металлическими акцентами', category: 'top', suitability: 'мужское', points: 4, price: 1799, img: '/clothes/top/m3.png' },
  { id: 'top_m4', name: 'Майка с рваными дырами', category: 'top', suitability: 'мужское', points: 4, price: 299, img: '/clothes/top/m4.png' },
  { id: 'top_m5', name: 'Рубашка с короткими рукавами', category: 'top', suitability: 'мужское', points: 5, price: 799, img: '/clothes/top/m5.png' },
  { id: 'top_m6', name: 'Белый оверсайз худи', category: 'top', suitability: 'мужское', points: 3, price: 1199, img: '/clothes/top/m6.png' },

  // ОБА (4)
  { id: 'top_o1', name: 'Рубашка со смешанными нашивками и графикой', category: 'top', suitability: 'оба', points: 5, price: 1099, img: '/clothes/top/o1.png' },
  { id: 'top_o2', name: 'Свободная серая футболка', category: 'top', suitability: 'оба', points: 2, price: 499, img: '/clothes/top/o2.png' },
  { id: 'top_o3', name: 'Джинсовая жилетка', category: 'top', suitability: 'оба', points: 5, price: 1899, img: '/clothes/top/o3.png' },
  { id: 'top_o4', name: 'Свитшот', category: 'top', suitability: 'оба', points: 3, price: 899, img: '/clothes/top/o4.png' },

  // ЖЕНСКОЕ + ОБА (4)
  { id: 'top_wo1', name: 'Приталенная туника без рукавов', category: 'top', suitability: 'жен+оба', points: 4, price: 1299, img: '/clothes/top/wo1.png' },
  { id: 'top_wo2', name: 'Кожаная укороченная куртка', category: 'top', suitability: 'жен+оба', points: 2, price: 1499, img: '/clothes/top/wo2.png' },
  { id: 'top_wo3', name: 'Кроп-топ на молнии с воротником', category: 'top', suitability: 'жен+оба', points: 4, price: 1999, img: '/clothes/top/wo3.png' },
  { id: 'top_wo4', name: 'Приталенный пиджак', category: 'top', suitability: 'жен+оба', points: 5, price: 899, img: '/clothes/top/wo4.png' },

  // МУЖСКОЕ + ОБА (2)
  { id: 'top_mo1', name: 'Белый жилет с блестящими вставками', category: 'top', suitability: 'муж+оба', points: 5, price: 2199, img: '/clothes/top/mo1.png' },
  { id: 'top_mo2', name: 'Оверсайз кожанка', category: 'top', suitability: 'муж+оба', points: 4, price: 1699, img: '/clothes/top/mo2.png' },

  // УНИВЕРСАЛЬНОЕ (3)
  { id: 'top_u1', name: 'Кроп-рубашка с галстуком', category: 'top', suitability: 'все', points: 5, price: 1399, img: '/clothes/top/u1.png' },
  { id: 'top_u2', name: 'Белый топ', category: 'top', suitability: 'все', points: 2, price: 299, img: '/clothes/top/u2.png' },
  { id: 'top_u3', name: 'Черная укороченная майка', category: 'top', suitability: 'все', points: 2, price: 199, img: '/clothes/top/u3.png' },

  // НИЗ — BOTTOMS (18 items)
  // ЖЕНСКОЕ (5)
  { id: 'bottom_w1', name: 'Юбка-мини из денима с сетчатыми вставками', category: 'bottom', suitability: 'женское', points: 5, price: 899, img: '/clothes/bot/w1.png' },
  { id: 'bottom_w2', name: 'Блестящая юбка с меховыми краями', category: 'bottom', suitability: 'женское', points: 5, price: 499, img: '/clothes/bot/w2.png' },
  { id: 'bottom_w3', name: 'Шорты с цепями и ремнём', category: 'bottom', suitability: 'женское', points: 5, price: 1099, img: '/clothes/bot/w3.png' },
  { id: 'bottom_w4', name: 'Плиссированная юбка', category: 'bottom', suitability: 'женское', points: 3, price: 699, img: '/clothes/bot/w4.png' },
  { id: 'bottom_w5', name: 'Юбка-карандаш', category: 'bottom', suitability: 'женское', points: 4, price: 799, img: '/clothes/bot/w5.png' },

  // МУЖСКОЕ (2)
  { id: 'bottom_m1', name: 'Прямые джинсы', category: 'bottom', suitability: 'мужское', points: 4, price: 1499, img: '/clothes/bot/m1.png' },
  { id: 'bottom_m2', name: 'Бэгги джинсы', category: 'bottom', suitability: 'мужское', points: 5, price: 2399, img: '/clothes/bot/m2.png' },

  // ЖЕНСКОЕ + ОБА (3)
  { id: 'bottom_wo1', name: 'Белые брюки клеш', category: 'bottom', suitability: 'жен+оба', points: 4, price: 1399, img: '/clothes/bot/wo1.png' },
  { id: 'bottom_wo2', name: 'Черные свободные брюки', category: 'bottom', suitability: 'жен+оба', points: 4, price: 1399, img: '/clothes/bot/wo2.png' },
  { id: 'bottom_wo4', name: 'Кожаные облегающие штаны', category: 'bottom', suitability: 'жен+оба', points: 5, price: 1199, img: '/clothes/bot/wo4.png' },

  // МУЖСКОЕ + ОБА (3)
  { id: 'bottom_mo1', name: 'Белые брюки с золотым узором', category: 'bottom', suitability: 'муж+оба', points: 5, price: 1799, img: '/clothes/bot/mo1.png' },
  { id: 'bottom_mo2', name: 'Голубые брюки', category: 'bottom', suitability: 'муж+оба', points: 3, price: 1199, img: '/clothes/bot/mo2.png' },
  { id: 'bottom_mo3', name: 'Укороченные карго-штаны с цепью', category: 'bottom', suitability: 'муж+оба', points: 5, price: 2199, img: '/clothes/bot/mo3.png' },

  // УНИВЕРСАЛЬНЫЕ (5)
  { id: 'bottom_u1', name: 'Джинсовые шорты', category: 'bottom', suitability: 'все', points: 3, price: 599, img: '/clothes/bot/u1.png' },
  { id: 'bottom_u2', name: 'Белые бриджи', category: 'bottom', suitability: 'все', points: 4, price: 899, img: '/clothes/bot/u2.png' },
  { id: 'bottom_u3', name: 'Клетчатые штаны', category: 'bottom', suitability: 'все', points: 3, price: 1099, img: '/clothes/bot/u3.png' },
  { id: 'bottom_u4', name: 'Красные спортивные штаны', category: 'bottom', suitability: 'все', points: 3, price: 899, img: '/clothes/bot/u4.png' },
  { id: 'bottom_u5', name: 'Белые джоггеры с цепями', category: 'bottom', suitability: 'все', points: 4, price: 1599, img: '/clothes/bot/u5.png' },

  // ОБУВЬ — SHOES (13 items)
  // ЖЕНСКИЕ (3)
  { id: 'shoes_w1', name: 'Высокие меховые сапоги на толстой подошве', category: 'shoes', suitability: 'женское', points: 5, price: 1899, img: '/clothes/shoe/w1.png' },
  { id: 'shoes_w2', name: 'Белые сценические кроссовки с глянцевыми вставками', category: 'shoes', suitability: 'женское', points: 5, price: 2599, img: '/clothes/shoe/w2.png' },
  { id: 'shoes_w3', name: 'Чёрные ботинки на высокой платформе', category: 'shoes', suitability: 'женское', points: 5, price: 2799, img: '/clothes/shoe/w3.png' },

  // МУЖСКИЕ (3)
  { id: 'shoes_m1', name: 'Полуботинки коричневые, матовая кожа', category: 'shoes', suitability: 'мужское', points: 4, price: 1899, img: '/clothes/shoe/m1.png' },
  { id: 'shoes_m2', name: 'Широкие кроссовки с массивной пяткой', category: 'shoes', suitability: 'мужское', points: 5, price: 1599, img: '/clothes/shoe/m2.png' },
  { id: 'shoes_m3', name: 'Спортивные высокие кроссовки с плотным задником', category: 'shoes', suitability: 'мужское', points: 5, price: 1699, img: '/clothes/shoe/m3.png' },

  // ЖЕНСКОЕ + ОБА (3)
  { id: 'shoes_wo1', name: 'Белые платформенные кроссовки', category: 'shoes', suitability: 'жен+оба', points: 5, price: 2099, img: '/clothes/shoe/wo1.png' },
  { id: 'shoes_wo2', name: 'Высокие кожаные черные сапоги', category: 'shoes', suitability: 'жен+оба', points: 5, price: 2699, img: '/clothes/shoe/wo2.png' },
  { id: 'shoes_wo3', name: 'Светлые сапоги с мягким верхом', category: 'shoes', suitability: 'жен+оба', points: 5, price: 1999, img: '/clothes/shoe/wo3.png' },

  // МУЖСКОЕ + ОБА (2)
  { id: 'shoes_mo1', name: 'Берцы с усиленной подошвой', category: 'shoes', suitability: 'муж+оба', points: 5, price: 2499, img: '/clothes/shoe/mo1.png' },
  { id: 'shoes_mo2', name: 'Массивные полуботинки с широкими шнурками', category: 'shoes', suitability: 'муж+оба', points: 4, price: 1599, img: '/clothes/shoe/mo2.png' },

  // УНИВЕРСАЛЬНОЕ (2)
  { id: 'shoes_u1', name: 'Лакированные полуботинки', category: 'shoes', suitability: 'все', points: 5, price: 1799, img: '/clothes/shoe/u1.png' },
  { id: 'shoes_u2', name: 'Массивные кроссовки', category: 'shoes', suitability: 'все', points: 5, price: 1999, img: '/clothes/shoe/u2.png' },

  // АКСЕССУАРЫ — ACCESSORIES (21 items, 1 point each)
  // ЖЕНСКИЕ (6)
  { id: 'acc_w1', name: 'Серьги-звезды', category: 'accessory', suitability: 'женское', points: 1, price: 199, img: '/clothes/accessory/w1.png' },
  { id: 'acc_w2', name: 'Браслет с кристалликами', category: 'accessory', suitability: 'женское', points: 1, price: 499, img: '/clothes/accessory/w2.png' },
  { id: 'acc_w3', name: 'Подвеска в виде звезды', category: 'accessory', suitability: 'женское', points: 1, price: 499, img: '/clothes/accessory/w3.png' },
  { id: 'acc_w4', name: 'Тонкое кольцо с розовым камнем', category: 'accessory', suitability: 'женское', points: 1, price: 399, img: '/clothes/accessory/w4.png' },
  { id: 'acc_w5', name: 'Лёгкий браслет с камнями', category: 'accessory', suitability: 'женское', points: 1, price: 599, img: '/clothes/accessory/w5.png' },
  { id: 'acc_w6', name: 'Портупея розовая', category: 'accessory', suitability: 'женское', points: 1, price: 799, img: '/clothes/accessory/w6.png' },

  // МУЖСКИЕ (2)
  { id: 'acc_m1', name: 'Металлический кафф', category: 'accessory', suitability: 'мужское', points: 1, price: 599, img: '/clothes/accessory/m1.png' },
  { id: 'acc_m2', name: 'Серьга-крест', category: 'accessory', suitability: 'мужское', points: 1, price: 299, img: '/clothes/accessory/m2.png' },

  // УНИВЕРСАЛЬНЫЕ (5)
  { id: 'acc_u1', name: 'Геометрическое кольцо', category: 'accessory', suitability: 'все', points: 1, price: 399, img: '/clothes/accessory/u1.png' },
  { id: 'acc_u2', name: 'Перчатки байкерские', category: 'accessory', suitability: 'все', points: 1, price: 799, img: '/clothes/accessory/u2.png' },
  { id: 'acc_u3', name: 'Портупея черная', category: 'accessory', suitability: 'все', points: 1, price: 699, img: '/clothes/accessory/u3.png' },
  { id: 'acc_u4', name: 'Тонкий браслет-нить', category: 'accessory', suitability: 'все', points: 1, price: 499, img: '/clothes/accessory/u4.png' },
  { id: 'acc_u5', name: 'Подвеска-крыло', category: 'accessory', suitability: 'все', points: 1, price: 299, img: '/clothes/accessory/u5.png' },

  // ПОДАРКИ — GIFTS (9 items)
  { id: 'gift_1', name: 'Мини-фотообои с мотивирующей фразой', category: 'other', suitability: 'все', points: 0, price: 99, img: '/gifts/wallpaper_normalized.png' },
  { id: 'gift_2', name: 'Неоновый браслет', category: 'other', suitability: 'все', points: 0, price: 149, img: '/gifts/badge_normalized.png' },
  { id: 'gift_3', name: 'Скетчбук для идей', category: 'other', suitability: 'все', points: 0, price: 199, img: '/gifts/sketchbook_normalized.png' },
  { id: 'gift_4', name: 'Мини-плюш игрушка', category: 'other', suitability: 'все', points: 0, price: 129, img: '/gifts/plush_normalized.png' },
  { id: 'gift_5', name: 'Подарочная карта кофейни ColdBrew', category: 'other', suitability: 'все', points: 0, price: 249, img: '/gifts/coffee_normalized.png' },
  { id: 'gift_6', name: 'Глянцевые наклейки со стрит-граффити', category: 'other', suitability: 'все', points: 0, price: 99, img: '/gifts/sticker_normalized.png' },
  { id: 'gift_7', name: 'Мини-стикеры эмоций', category: 'other', suitability: 'все', points: 0, price: 119, img: '/gifts/badge_normalized.png' },
  { id: 'gift_8', name: 'Качественный крем для рук', category: 'other', suitability: 'все', points: 0, price: 299, img: '/gifts/cream_normalized.png' },
  { id: 'gift_9', name: 'Милая спортивная бутылка воды', category: 'other', suitability: 'все', points: 0, price: 349, img: '/gifts/bottle_normalized.png' },
];
