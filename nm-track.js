// Medición de Nona Miranda. Todo se carga solo si el cliente lo permite en el aviso de cookies
// (localStorage 'nm-cookies': 'all', 'none' o combinación de a = analítica, p = publicidad).
(function () {
  var GA4 = 'G-3XGDF5B8JK';
  var META_PIXEL = '457444570410053';
  var GTM = 'GTM-5QP32GSR';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });

  function cargar(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  window.__nmTrack = function () {
    var c = '';
    try { c = localStorage.getItem('nm-cookies') || ''; } catch (e) {}
    var a = c !== 'none' && (c === 'all' || c.indexOf('a') >= 0);
    var p = c !== 'none' && (c === 'all' || c.indexOf('p') >= 0);
    gtag('consent', 'update', {
      analytics_storage: a ? 'granted' : 'denied',
      ad_storage: p ? 'granted' : 'denied',
      ad_user_data: p ? 'granted' : 'denied',
      ad_personalization: p ? 'granted' : 'denied'
    });

    if (a && !window.__nmGa) {
      window.__nmGa = 1;
      gtag('js', new Date());
      gtag('config', GA4);
      cargar('https://www.googletagmanager.com/gtag/js?id=' + GA4);
    }

    if ((a || p) && !window.__nmGtm) {
      window.__nmGtm = 1;
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      cargar('https://www.googletagmanager.com/gtm.js?id=' + GTM);
    }

    if (p && !window.__nmFb) {
      window.__nmFb = 1;
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', META_PIXEL);
      fbq('track', 'PageView');
    }
  };

  // Evento de tienda: 'add_to_cart' o 'purchase'. Se envía solo a lo que esté cargado.
  window.__nmEvt = function (nombre, d) {
    try {
      if (window.__nmGa) gtag('event', nombre, d);
      if (window.fbq) {
        var ids = (d.items || []).map(function (i) { return i.item_id; });
        var n = (d.items || []).reduce(function (t, i) { return t + (i.quantity || 1); }, 0);
        if (nombre === 'add_to_cart') fbq('track', 'AddToCart', { value: d.value, currency: d.currency, content_ids: ids, content_type: 'product' });
        if (nombre === 'purchase') fbq('track', 'Purchase', { value: d.value, currency: d.currency, content_ids: ids, content_type: 'product', num_items: n });
      }
    } catch (e) {}
  };

  window.__nmTrack();
})();
