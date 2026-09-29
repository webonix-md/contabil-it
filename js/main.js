(function () {
  'use strict';

  var S = window.SITE || {};

  // Язык страницы (index.html — ru, ro.html — ro) и тексты, которые пишет сам скрипт
  var LANG = document.documentElement.lang === 'ro' ? 'ro' : 'ru';
  var TXT = {
    ru: { menuOpen: 'Открыть меню', menuClose: 'Закрыть меню', people: ' чел.', onePerson: '(1 сотрудник)' },
    ro: { menuOpen: 'Deschide meniul', menuClose: 'Închide meniul', people: ' pers.', onePerson: '(1 angajat)' }
  }[LANG];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmt(n) {
    // 3100 → «3 100» (неразрывный пробел)
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // ---------- Контакты из site-data.js ----------
  if (S.phone) {
    document.querySelectorAll('[data-phone]').forEach(function (a) {
      a.href = 'tel:' + S.phone.tel;
      // Текст меняем только у ссылок, где выведен сам номер
      if (/\+?\d[\d\s]{6,}/.test(a.textContent)) a.textContent = S.phone.display;
    });
  }
  if (S.messengers) {
    document.querySelectorAll('[data-msg]').forEach(function (a) {
      var url = S.messengers[a.getAttribute('data-msg')];
      if (url) a.href = url;
    });
  }
  if (S.office) {
    document.querySelectorAll('[data-office]').forEach(function (el) {
      var key = el.getAttribute('data-office');
      if (key === 'city') return; // в заголовке падеж («в Кишинёве») — оставляем разметку
      // для румынской версии берём поля с суффиксом _ro (address_ro, hours_ro)
      var val = LANG === 'ro' ? S.office[key + '_ro'] : S.office[key];
      if (val) el.textContent = val;
    });
  }

  // ---------- Фото в дуотоне ----------
  if (S.photos) {
    document.querySelectorAll('[data-photo]').forEach(function (el) {
      var id = S.photos[el.getAttribute('data-photo')];
      if (!id) return;
      var w = el.tagName === 'SECTION' ? 2000 : 1200; // фон секции — крупнее, карточки — меньше
      el.style.setProperty('--photo', 'url("https://images.unsplash.com/' + id + '?w=' + w + '&q=75&auto=format&fit=crop")');
      el.classList.add('has-photo');
    });
  }

  // ---------- Шапка: фон при прокрутке и мобильное меню ----------
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 20); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? TXT.menuClose : TXT.menuOpen);
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // ---------- Терминал на первом экране ----------
  document.querySelectorAll('#heroTerm .term__line').forEach(function (line, i) {
    if (reduceMotion) { line.classList.add('is-on'); return; }
    setTimeout(function () { line.classList.add('is-on'); }, 400 + i * 320);
  });

  // ---------- Калькулятор цены ----------
  var P = S.pricing || { base: 1500, perEmployee: 400, minEmployees: 1, maxEmployees: 50, defaultEmployees: 5 };
  var range = document.getElementById('employees');
  if (range) {
    var out = document.getElementById('employeesOut');
    var cmd = document.getElementById('cmdEmployees');
    var rowBase = document.getElementById('rowBase');
    var rowExtra = document.getElementById('rowExtra');
    var rowExtraLabel = document.getElementById('rowExtraLabel');
    var total = document.getElementById('total');

    range.min = P.minEmployees;
    range.max = P.maxEmployees;
    range.value = P.defaultEmployees;
    var scale = document.querySelectorAll('.calc__scale span');
    if (scale.length === 3) {
      scale[0].textContent = P.minEmployees;
      scale[1].textContent = Math.round(P.maxEmployees / 2);
      scale[2].textContent = P.maxEmployees;
    }

    var update = function () {
      var n = parseInt(range.value, 10);
      var extraPeople = Math.max(0, n - 1);
      var extra = extraPeople * P.perEmployee;
      out.textContent = n;
      cmd.textContent = n;
      rowBase.textContent = fmt(P.base) + ' MDL';
      rowExtra.textContent = fmt(extra) + ' MDL';
      rowExtraLabel.textContent = extraPeople ? '(+' + extraPeople + TXT.people + ')' : TXT.onePerson;
      total.textContent = fmt(P.base + extra);
      var fill = (n - P.minEmployees) / (P.maxEmployees - P.minEmployees) * 100;
      range.style.setProperty('--fill', fill + '%');
    };
    range.addEventListener('input', update);
    update();
  }

  // ---------- «Съезжание в центр» при прокрутке ----------
  // Контейнер с атрибутом data-converge: первый ребёнок едет слева, последний — справа.
  // Положение привязано к прокрутке, но только вперёд: съехались — остаются на месте (одноразово).
  var converge = document.querySelectorAll('[data-converge]');
  if (converge.length && !reduceMotion) {
    var ticking = false;

    var render = function () {
      ticking = false;
      var vh = window.innerHeight;
      converge.forEach(function (box) {
        var kids = box.children;
        if (kids.length < 2) return;
        var maxShift = Math.min(window.innerWidth * 0.65, 1120);
        [[kids[0], -1], [kids[kids.length - 1], 1]].forEach(function (pair) {
          var el = pair[0];
          el.style.translate = '0 0'; // меряем положение без сдвига
          var top = el.getBoundingClientRect().top;
          // 0 — верх карточки у нижнего края экрана, 1 — поднялся до 35% высоты экрана
          var p = Math.max(0, Math.min(1, (vh - top) / (vh * 0.65)));
          p = Math.max(p, el._convergeP || 0); // назад не отъезжает
          el._convergeP = p;
          var eased = 1 - Math.pow(1 - p, 3);
          el.style.translate = (pair[1] * maxShift * (1 - eased)) + 'px 0';
        });
      });
      // обе карточки на месте — больше не следим за прокруткой
      var done = true;
      converge.forEach(function (box) {
        var kids = box.children;
        if (kids.length < 2) return;
        if ((kids[0]._convergeP || 0) < 1 || (kids[kids.length - 1]._convergeP || 0) < 1) done = false;
      });
      if (done) {
        window.removeEventListener('scroll', onConvergeScroll);
        window.removeEventListener('resize', onConvergeScroll);
      }
    };
    var onConvergeScroll = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    };
    window.addEventListener('scroll', onConvergeScroll, { passive: true });
    window.addEventListener('resize', onConvergeScroll);
    render();
  }

  // ---------- «Прилёт справа по очереди» при прокрутке ----------
  // Контейнер с атрибутом data-fly-in: дети прилетают справа по одному (1, 2, 3…).
  // Каждая следующая карточка стартует через STEP px прокрутки после предыдущей
  // и не раньше, чем сама покажется на экране. Прилетают один раз и остаются на месте.
  var flyBoxes = document.querySelectorAll('[data-fly-in]');
  if (flyBoxes.length && !reduceMotion) {
    var STEP = 100;         // px прокрутки между карточками (= 1 щелчок колёсика в Chrome/Windows → одна карточка на щелчок)
    var START = 0.8;        // старт, когда верх списка поднялся до 80% высоты экрана
    var QUEUE_GAP = 300;    // мс между карточками, если прокрутили быстро и «сработало» сразу несколько
    var flyTicking = false;
    var nextSlot = 0;       // общая очередь: самое раннее время (мс) старта следующей карточки

    flyBoxes.forEach(function (box) { box.classList.add('fly-ready'); });

    var flyRender = function () {
      flyTicking = false;
      var vh = window.innerHeight;
      flyBoxes.forEach(function (box) {
        var passed = vh * START - box.getBoundingClientRect().top; // сколько px прокрутили после старта
        Array.prototype.forEach.call(box.children, function (el, i) {
          var ownTop = el.getBoundingClientRect().top;
          var shouldBeIn = passed >= i * STEP && ownTop < vh * 0.92;
          var isIn = el.classList.contains('is-in');
          if (shouldBeIn && !isIn) {
            // общая очередь на все проверки: старт не раньше, чем через QUEUE_GAP после предыдущей карточки
            var now = performance.now();
            var startAt = Math.max(now, nextSlot);
            nextSlot = startAt + QUEUE_GAP;
            el.style.animationDelay = Math.round(startAt - now) + 'ms';
            el.classList.add('is-in');
          }
        });
      });
      // все карточки на месте — больше следить за прокруткой не нужно
      var left = 0;
      flyBoxes.forEach(function (box) {
        Array.prototype.forEach.call(box.children, function (el) { if (!el.classList.contains('is-in')) left++; });
      });
      if (!left) {
        window.removeEventListener('scroll', onFlyScroll);
        window.removeEventListener('resize', onFlyScroll);
      }
    };
    var onFlyScroll = function () {
      if (!flyTicking) { flyTicking = true; requestAnimationFrame(flyRender); }
    };
    window.addEventListener('scroll', onFlyScroll, { passive: true });
    window.addEventListener('resize', onFlyScroll);
    flyRender();
  }

  // ---------- «Досье» (блок «С кем работаем») ----------
  // Контейнер data-dossier: первая карточка (с фото) раскрывается шторкой по прокрутке,
  // фото внутри «отъезжает» с увеличения; затем остальные карточки раздаются из стопки,
  // которая выглядывает из-под главной. Один раз.
  var dossier = document.querySelector('[data-dossier]');
  if (dossier && dossier.children.length > 1 && !reduceMotion) {
    var main = dossier.children[0];
    var rest = Array.prototype.slice.call(dossier.children, 1);
    var DEAL_GAP = 200;     // мс между карточками при раздаче
    var dossierP = 0;       // прогресс шторки (только растёт)
    var dealt = false;
    var dTicking = false;
    var STACK_TILT = [5, -4, 8];

    dossier.classList.add('dossier-ready');

    // Стопка: карточки собраны у правого края главной (на узком экране — у нижнего), слегка повёрнуты
    var placeStack = function () {
      if (dealt) return;
      var m = main.getBoundingClientRect();
      var wide = m.right < window.innerWidth * 0.75; // есть место справа от главной карточки
      rest.forEach(function (el, i) {
        el.style.translate = '0 0';
        var r = el.getBoundingClientRect();
        var tx = wide ? (m.right - r.width * 0.3) : (m.left + m.width / 2 - r.width / 2);
        var ty = wide ? (m.top + m.height / 2 - r.height / 2 + (i - 1) * 14) : (m.bottom - r.height * 0.7 + i * 10);
        el.style.translate = Math.round(tx - r.left) + 'px ' + Math.round(ty - r.top) + 'px';
        el.style.rotate = STACK_TILT[i % STACK_TILT.length] + 'deg';
      });
    };

    var deal = function () {
      dealt = true;
      dossier.classList.add('is-stacked'); // стопка проявляется из-под главной
      setTimeout(function () {
        rest.forEach(function (el, i) {
          el.style.transitionDelay = (i * DEAL_GAP) + 'ms';
          el.style.translate = '0 0';
          el.style.rotate = '0deg';
        });
        dossier.classList.add('is-dealt');
      }, 350);
      window.removeEventListener('scroll', onDossierScroll);
    };

    var dossierRender = function () {
      dTicking = false;
      var vh = window.innerHeight;
      var mr = main.getBoundingClientRect();
      var center = mr.top + mr.height / 2; // стартовая полоса — по центру карточки
      // 0 — центр карточки (полоса) у нижнего края экрана, 1 — центр дошёл до середины экрана
      var p = Math.max(0, Math.min(1, (vh * 0.95 - center) / (vh * 0.3)));
      dossierP = Math.max(dossierP, p);
      // плавно в начале и в конце — узкая полоса успевает побыть на экране
      var e = dossierP * dossierP * (3 - 2 * dossierP);
      // визуально уже открыто (остаток шторки незаметен) — защёлкиваем и сразу показываем стопку
      if (e >= 0.97) { dossierP = 1; e = 1; }
      main.style.setProperty('--dossier-clip', (46 * (1 - e)).toFixed(2) + '%');
      main.style.setProperty('--dossier-zoom', (1.3 - 0.3 * e).toFixed(3));
      main.style.setProperty('--dossier-content', Math.max(0, (dossierP - 0.55) / 0.45).toFixed(3));
      if (dossierP >= 1 && !dealt) deal();
    };
    var onDossierScroll = function () {
      if (!dTicking) { dTicking = true; requestAnimationFrame(dossierRender); }
    };

    placeStack();
    window.addEventListener('scroll', onDossierScroll, { passive: true });
    window.addEventListener('resize', function () { placeStack(); onDossierScroll(); });
    dossierRender();
  }
  // ---------- «Печать» (блок «Почему мы») ----------
  // Когда карточка с печатью появляется на экране, штамп опускается, бьёт по карточке
  // и улетает, оставляя оттиск. Вся сценка — CSS-анимации (конец styles.css), здесь только запуск. Один раз.
  // Рисуем штамп из цилиндров под углом data-tilt (0° — сбоку, 90° — сверху).
  // Единицы — «мм» модели; высота h отсчитывается от низа подушки (точка касания бумаги).
  function drawStamper(el, stampEl) {
    var tilt = parseFloat(el.getAttribute('data-tilt'));
    if (isNaN(tilt)) tilt = 35;
    var t = Math.max(0, Math.min(85, tilt)) * Math.PI / 180;
    var sin = Math.sin(t), cos = Math.cos(t);
    var CX = 60;
    var k = function (h) { return 1 + 0.0035 * h * sin; };      // ближе к нам — чуть крупнее
    var Y = function (h) { return -h * cos; };                   // экранная высота центра сечения
    var f = function (n) { return n.toFixed(2); };
    var parts = [];

    // цилиндр (или усечённый конус): боковина + верхняя грань
    var cyl = function (r0, r1, h0, h1, side, top, rim) {
      var rx0 = r0 * k(h0), ry0 = rx0 * sin, rx1 = r1 * k(h1), ry1 = rx1 * sin;
      var yb = Y(h0), yt = Y(h1);
      parts.push('<path d="M' + f(CX - rx1) + ' ' + f(yt) + 'L' + f(CX - rx0) + ' ' + f(yb) +
        'A' + f(rx0) + ' ' + f(Math.max(ry0, .01)) + ' 0 0 0 ' + f(CX + rx0) + ' ' + f(yb) +
        'L' + f(CX + rx1) + ' ' + f(yt) + 'Z" fill="' + side + '"/>');
      if (sin > .02) {
        parts.push('<ellipse cx="' + CX + '" cy="' + f(yt) + '" rx="' + f(rx1) + '" ry="' + f(ry1) + '" fill="' + top + '"' +
          (rim ? ' stroke="' + rim + '" stroke-width="1.5"' : '') + '/>');
      }
    };

    cyl(46, 46, 0, 8, '#0F6E56', '#0F6E56');                       // резиновая подушка
    cyl(50, 50, 8, 22, '#042C53', '#0C447C', '#185FA5');           // основание
    cyl(22, 22, 22, 26, '#0F6E56', '#5DCAA5');                     // бирюзовое кольцо
    cyl(9, 12, 26, 64, '#042C53', '#0A3A68');                      // шейка (к ручке шире)
    // блик на шейке
    parts.push('<path d="M' + f(CX - 9 * k(26)) + ' ' + f(Y(26)) + 'L' + f(CX - 12 * k(64)) + ' ' + f(Y(64)) +
      'L' + f(CX - 6 * k(64)) + ' ' + f(Y(64)) + 'L' + f(CX - 5 * k(26)) + ' ' + f(Y(26)) + 'Z" fill="#185FA5" opacity=".45"/>');

    // ручка-шар (эллипсоид 30×26), видимый контур и блики
    var kc = k(78), krx = 30 * kc;
    var kry = Math.sqrt(Math.pow(26 * cos, 2) + Math.pow(30 * sin, 2)) * kc;
    var ky = Y(78);
    parts.push('<ellipse cx="' + CX + '" cy="' + f(ky) + '" rx="' + f(krx) + '" ry="' + f(kry) + '" fill="#0C447C"/>');
    parts.push('<ellipse cx="' + CX + '" cy="' + f(ky + kry * .18) + '" rx="' + f(krx * .98) + '" ry="' + f(kry * .8) + '" fill="#042C53" opacity=".35"/>');
    parts.push('<ellipse cx="' + f(CX - krx * .35) + '" cy="' + f(ky - kry * .42) + '" rx="' + f(krx * .42) + '" ry="' + f(kry * .3) + '" fill="#378ADD" opacity=".6"/>');
    parts.push('<ellipse cx="' + f(CX - krx * .5) + '" cy="' + f(ky - kry * .55) + '" rx="' + f(krx * .13) + '" ry="' + f(kry * .1) + '" fill="#B5D4F4" opacity=".8"/>');

    // рамка рисунка: от верха ручки до низа подушки
    var minY = ky - kry - 2;
    var maxY = 46 * k(0) * sin + 2;
    var H = maxY - minY;
    el.innerHTML = '<svg viewBox="0 ' + f(minY) + ' 120 ' + f(H) + '">' + parts.join('') + '</svg>';

    // точка касания (h = 0, y = 0) ставится в центр оттиска
    var w = el.offsetWidth || 115;
    var hPx = w * H / 120;
    var contact = (0 - minY) / H * hPx;
    el.style.top = Math.round(stampEl.offsetTop + stampEl.offsetHeight / 2 - contact) + 'px';
  }

  var stampCard = document.querySelector('.why__item--accent');
  if (stampCard && stampCard.querySelector('.stamper') && !reduceMotion && 'IntersectionObserver' in window) {
    drawStamper(stampCard.querySelector('.stamper'), stampCard.querySelector('.stamp'));
    stampCard.classList.add('stamp-ready');
    var stampIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        stampCard.classList.add('is-stamped');
        stampIO.disconnect();
      });
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0.6 });
    stampIO.observe(stampCard);
  }


})();
