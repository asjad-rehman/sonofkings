/* ==========================================================================
   Son of Kings — storefront behaviour
   Vanilla, no dependencies. Bag state persists in localStorage.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG — the only block you need to edit for a new edition.
     ------------------------------------------------------------------ */
  var SITE = {
    email: 'MuhammadAsjad.RehmanHashmi@gmail.com',
    phone: '+18165911437',           // digits only, E.164
    phoneLabel: '(816) 591-1437',
    product: {
      name: 'Son of Kings Crest Tracksuit in Black',
      price: 199.99,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      maxPerSize: 9
    },
    // Drop real photography here to replace the composed plates, e.g.
    // { front: 'assets/img/front.jpg', back: 'assets/img/back.jpg',
    //   detail: 'assets/img/detail.jpg', edition: 'assets/img/edition.jpg' }
    photos: {
      front: 'assets/img/black-hoodie.webp',
      back: 'assets/img/black-trousers.webp'
    }
  };

  var STORE_KEY = 'sok.bag.v1';

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n) { return '$' + n.toFixed(2); }

  function on(el, type, fn, opts) { if (el) el.addEventListener(type, fn, opts); }

  /* ---------- bag state ---------- */
  var bag = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      var clean = {};
      // Only trust sizes we actually sell, and quantities in range.
      SITE.product.sizes.forEach(function (size) {
        var q = parseInt(parsed[size], 10);
        if (q > 0) clean[size] = Math.min(q, SITE.product.maxPerSize);
      });
      return clean;
    } catch (err) {
      return {};
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(bag)); } catch (err) { /* private mode */ }
  }

  function bagCount() {
    return Object.keys(bag).reduce(function (sum, k) { return sum + bag[k]; }, 0);
  }

  function bagTotal() { return bagCount() * SITE.product.price; }

  /* ---------- contact links ---------- */
  var JOIN_SUBJECT = 'Son of Kings updates';
  var JOIN_BODY = 'Please add me to Son of Kings product and release updates.';

  function wireContact() {
    var mail = $('#club-email');
    if (mail) {
      mail.href = 'mailto:' + SITE.email +
        '?subject=' + encodeURIComponent(JOIN_SUBJECT) +
        '&body=' + encodeURIComponent(JOIN_BODY);
      mail.textContent = 'Email'
    }
    var sms = $('#club-sms');
    if (sms) {
      if (SITE.phone) {
        // iOS wants ?&body=, Android wants ?body= — both tolerate this form.
        sms.href = 'sms:' + SITE.phone + '?&body=' + encodeURIComponent(JOIN_BODY);
        sms.textContent = 'Text';
      } else {
        sms.remove();
      }
    }
    var note = $('#club-note');
    if (note) note.textContent = 'Text to join the updates list.';

    var foot = $('#footer-email');
    if (foot) {
      foot.href = 'mailto:' + SITE.email;
      foot.textContent = 'Contact';
    }
  }

  /* ---------- real photography, when supplied ---------- */
  function wirePhotos() {
    Object.keys(SITE.photos).forEach(function (view) {
      var src = SITE.photos[view];
      if (!src) return;
      $$('.plate--' + view).forEach(function (plate) {
        var inner = $('.plate__inner', plate);
        if (!inner) return;
        var img = new Image();
        img.src = src;
        var cap = $('.plate__caption', plate);
        img.alt = cap ? cap.textContent.trim() : '';
        img.loading = (view === 'front' || view === 'back') ? 'eager' : 'lazy';
        if (view === 'front') img.fetchPriority = 'high';
        img.decoding = 'async';
        img.className = 'plate__photo';
        inner.replaceChildren(img);
        inner.style.padding = '0';
        inner.style.background = 'none';
      });
    });
  }

  /* ---------- focus trap for the sheets ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var lastFocused = null;
  var openSheets = 0;

  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var items = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function lockBody(lock) {
    openSheets = Math.max(0, openSheets + (lock ? 1 : -1));
    document.body.dataset.locked = openSheets > 0 ? 'true' : 'false';
  }

  function openSheet(el, focusTarget) {
    lastFocused = document.activeElement;
    el.hidden = false;
    lockBody(true);
    (focusTarget || $(FOCUSABLE, el) || el).focus();
  }

  function closeSheet(el) {
    if (el.hidden) return;
    el.hidden = true;
    lockBody(false);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  /* ---------- mobile nav ---------- */
  var mobileNav = $('#mobile-nav');
  var navOpen = $('#nav-open');

  function setNav(open) {
    if (!mobileNav) return;
    if (open) { openSheet(mobileNav, $('#nav-close')); }
    else { closeSheet(mobileNav); }
    if (navOpen) navOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  on(navOpen, 'click', function () { setNav(true); });
  on($('#nav-close'), 'click', function () { setNav(false); });
  if (mobileNav) {
    $$('a', mobileNav).forEach(function (a) { on(a, 'click', function () { setNav(false); }); });
    on(mobileNav, 'keydown', function (e) { trap(mobileNav, e); });
  }
  // A resize past the desktop breakpoint must not leave the sheet stranded open.
  on(window, 'resize', function () {
    if (window.innerWidth >= 900 && mobileNav && !mobileNav.hidden) setNav(false);
  });

  /* ---------- gallery ---------- */
  var thumbs = $$('.thumb');

  function showView(view) {
    $$('.gallery__stage .plate').forEach(function (p) {
      p.dataset.active = p.classList.contains('plate--' + view) ? 'true' : 'false';
    });
    thumbs.forEach(function (t) {
      t.setAttribute('aria-pressed', t.dataset.view === view ? 'true' : 'false');
    });
  }

  thumbs.forEach(function (t, i) {
    on(t, 'click', function () { showView(t.dataset.view); });
    on(t, 'keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var next = thumbs[(i + dir + thumbs.length) % thumbs.length];
      showView(next.dataset.view);
      next.focus();
    });
  });

  /* ---------- size + quantity ---------- */
  var sizeBtns = $$('.size');
  var chosenSize = 'M';
  var qty = 1;

  function setSize(size) {
    chosenSize = size;
    sizeBtns.forEach(function (b) {
      var on_ = b.dataset.size === size;
      b.setAttribute('aria-checked', on_ ? 'true' : 'false');
      b.tabIndex = on_ ? 0 : -1;
    });
    var label = $('#size-current');
    if (label) label.textContent = size;
    var bar = $('#buybar-size');
    if (bar) bar.textContent = 'Size ' + size;
  }

  sizeBtns.forEach(function (b, i) {
    on(b, 'click', function () { setSize(b.dataset.size); });
    on(b, 'keydown', function (e) {
      var dir = /Right|Down/.test(e.key) ? 1 : /Left|Up/.test(e.key) ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var next = sizeBtns[(i + dir + sizeBtns.length) % sizeBtns.length];
      setSize(next.dataset.size);
      next.focus();
    });
  });

  function setQty(n) {
    qty = Math.max(1, Math.min(SITE.product.maxPerSize, n));
    var out = $('#qty-value');
    if (out) out.textContent = String(qty);
    var dec = $('#qty-dec');
    var inc = $('#qty-inc');
    if (dec) dec.disabled = qty <= 1;
    if (inc) inc.disabled = qty >= SITE.product.maxPerSize;
  }

  on($('#qty-dec'), 'click', function () { setQty(qty - 1); });
  on($('#qty-inc'), 'click', function () { setQty(qty + 1); });

  /* ---------- size guide ---------- */
  var guide = $('#size-guide');
  var guideToggle = $('#guide-toggle');

  function setGuide(open) {
    if (!guide || !guideToggle) return;
    guide.hidden = !open;
    guideToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    guideToggle.textContent = open ? 'Hide size guide' : 'Size guide';
  }

  on(guideToggle, 'click', function () { setGuide(guide.hidden); });

  $$('[data-open-guide]').forEach(function (a) {
    on(a, 'click', function () {
      setGuide(true);
      // Let the hash jump land first, then park focus on the opened panel.
      setTimeout(function () { if (guideToggle) guideToggle.focus(); }, 320);
    });
  });

  /* ---------- toast ---------- */
  var toast = $('#toast');
  var toastTimer = null;

  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.dataset.shown = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.dataset.shown = 'false'; }, 2600);
  }

  /* ---------- bag rendering ---------- */
  var bagEl = $('#bag');
  var bagBody = $('#bag-body');

  function renderBag() {
    var count = bagCount();

    var countEl = $('#bag-count');
    if (countEl) {
      countEl.textContent = String(count);
      countEl.dataset.empty = count === 0 ? 'true' : 'false';
    }
    var countText = $('#bag-count-text');
    if (countText) countText.textContent = 'Bag, ' + count + (count === 1 ? ' item' : ' items');

    var totalEl = $('#bag-total');
    if (totalEl) totalEl.textContent = money(bagTotal());

    var checkout = $('#checkout');
    if (checkout) checkout.disabled = count === 0;
    var smsOrder = $('#checkout-sms');
    if (smsOrder) {
      smsOrder.href = count ? 'sms:' + SITE.phone + '?&body=' + encodeURIComponent(orderText()) : '#';
      smsOrder.setAttribute('aria-disabled', count ? 'false' : 'true');
      smsOrder.tabIndex = count ? 0 : -1;
    }

    if (!bagBody) return;
    bagBody.replaceChildren();

    var sizes = SITE.product.sizes.filter(function (s) { return bag[s]; });
    if (!sizes.length) {
      var empty = document.createElement('p');
      empty.className = 'bag__empty';
      empty.textContent = 'Nothing selected yet';
      bagBody.appendChild(empty);
      return;
    }

    sizes.forEach(function (size) {
      bagBody.appendChild(lineFor(size));
    });
  }

  function lineFor(size) {
    var n = bag[size];

    var line = document.createElement('div');
    line.className = 'line';

    var art = document.createElement('div');
    art.className = 'line__art';
    var img = document.createElement('img');
    img.src = 'assets/img/crest@480.png';
    img.alt = '';
    img.width = 480; img.height = 493;
    img.loading = 'lazy';
    art.appendChild(img);

    var body = document.createElement('div');
    body.className = 'line__body';

    var name = document.createElement('p');
    name.className = 'line__name';
    name.textContent = SITE.product.name;

    var meta = document.createElement('p');
    meta.className = 'line__meta';
    meta.textContent = 'Size ' + size + ' · ' + money(SITE.product.price * n);

    var foot = document.createElement('div');
    foot.className = 'line__foot';

    var qtyBox = document.createElement('div');
    qtyBox.className = 'line__qty';

    var minus = document.createElement('button');
    minus.type = 'button';
    minus.innerHTML = '&minus;';
    minus.setAttribute('aria-label', 'Decrease quantity, size ' + size);
    minus.addEventListener('click', function () { setLine(size, n - 1); });

    var out = document.createElement('output');
    out.textContent = String(n);

    var plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase quantity, size ' + size);
    plus.disabled = n >= SITE.product.maxPerSize;
    plus.addEventListener('click', function () { setLine(size, n + 1); });

    qtyBox.append(minus, out, plus);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'line__remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove size ' + size + ' from bag');
    remove.addEventListener('click', function () { setLine(size, 0); });

    foot.append(qtyBox, remove);
    body.append(name, meta, foot);
    line.append(art, body);
    return line;
  }

  function setLine(size, n) {
    if (n <= 0) delete bag[size];
    else bag[size] = Math.min(n, SITE.product.maxPerSize);
    save();
    renderBag();
  }

  function addToBag(n) {
    var current = bag[chosenSize] || 0;
    var next = Math.min(current + n, SITE.product.maxPerSize);
    if (next === current) {
      say('Maximum ' + SITE.product.maxPerSize + ' per size');
      return;
    }
    bag[chosenSize] = next;
    save();
    renderBag();
    // No toast here: the drawer opening is the confirmation, and a toast would
    // land on top of the drawer's own footer.
    setBag(true);
  }

  /* ---------- bag open/close ---------- */
  function setBag(open) {
    if (!bagEl) return;
    if (open) openSheet(bagEl, $('#bag-close'));
    else closeSheet(bagEl);
  }

  on($('#bag-open'), 'click', function () { setBag(true); });
  on($('#bag-close'), 'click', function () { setBag(false); });
  $$('[data-bag-close]').forEach(function (el) { on(el, 'click', function () { setBag(false); }); });
  if (bagEl) on(bagEl, 'keydown', function (e) { trap(bagEl, e); });

  on($('#add-to-bag'), 'click', function () { addToBag(qty); });
  on($('#buybar-add'), 'click', function () { addToBag(1); });

  on(document, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (bagEl && !bagEl.hidden) { setBag(false); return; }
    if (mobileNav && !mobileNav.hidden) setNav(false);
  });

  /* ---------- checkout ----------
     No payment processor is wired up. Rather than a button that does
     nothing, checkout hands the customer a pre-filled order email. */
  function orderText() {
    var lines = SITE.product.sizes
      .filter(function (s) { return bag[s]; })
      .map(function (s) {
        return '  ' + SITE.product.name + ' — size ' + s + ' × ' + bag[s] +
               ' — ' + money(SITE.product.price * bag[s]);
      });

    return [
      'Hello, I would like to request this Son of Kings order:',
      '',
      lines.join('\n'),
      '',
      'Product subtotal: ' + money(bagTotal()),
      '',
      'Shipping name:',
      'Address:',
      'Phone:'
    ].join('\n');
  }

  on($('#checkout'), 'click', function () {
    if (!bagCount()) return;

    window.location.href = 'mailto:' + SITE.email +
      '?subject=' + encodeURIComponent('Son of Kings order request — ' + money(bagTotal())) +
      '&body=' + encodeURIComponent(orderText());
  });

  /* ---------- mobile buy bar ----------
     Shows only while the product section is on screen. */
  var buybar = $('#buybar');
  var productSection = $('#product');

  if (buybar && productSection && 'IntersectionObserver' in window) {
    var addBtn = $('#buybar-add');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var show = entry.isIntersecting;
        buybar.dataset.shown = show ? 'true' : 'false';
        buybar.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (addBtn) addBtn.tabIndex = show ? 0 : -1;
      });
    }, { rootMargin: '-40% 0px -20% 0px' });
    io.observe(productSection);
  }

  /* ---------- nav highlighting ---------- */
  var navLinks = $$('.nav a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current',
            a.getAttribute('href') === '#' + entry.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- boot ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  wireContact();
  wirePhotos();
  setSize(chosenSize);
  setQty(1);
  showView('front');
  renderBag();
})();
