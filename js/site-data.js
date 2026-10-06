// Все данные, которые меняются при передаче сайта реальному заказчику.
// Цифры и контакты здесь — демонстрационные (см. DEMO-CHECKLIST.md).
window.SITE = {
  brand: 'CONTABIL',

  phone: {
    display: '+373 60 000 000',
    tel: '+37360000000'
  },
  messengers: {
    telegram: 'https://t.me/contabil_demo',
    whatsapp: 'https://wa.me/37360000000',
    viber: 'viber://chat?number=%2B37360000000'
  },
  office: {
    city: 'Кишинёв',
    address: 'Адрес офиса — уточняется',
    hours: 'Пн–Пт, 9:00–18:00',
    // румынская версия (ro.html)
    address_ro: 'Adresa biroului — în curs de stabilire',
    hours_ro: 'Lu–Vi, 9:00–18:00'
  },

  // Ориентировочная формула цены: база за первого сотрудника + доплата за каждого следующего
  pricing: {
    base: 1000,
    perEmployee: 300,
    minEmployees: 1,
    maxEmployees: 50,
    defaultEmployees: 5
  },

  // Фото — Unsplash (бесплатная лицензия), в дуотоне фирменного синего
  photos: {
    hero: 'photo-1504384308090-c894fdcc538d',     // офис open space
    clients: 'photo-1519241047957-be31d7379a5d'      // разработчики за мониторами с кодом
  }
};
