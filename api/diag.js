const { env, origenOk } = require('./_lib');

// TEMPORAL: diagnostico sin mostrar valores secretos. Se borra al terminar.
module.exports = async (req, res) => {
  if (!origenOk(req, res)) return;
  const nombres = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'IZIPAY_MODE', 'IZIPAY_USERNAME', 'IZIPAY_PASSWORD_PROD', 'IZIPAY_HMAC_PROD', 'IZIPAY_PUBLICKEY_PROD'];
  const vars = {};
  for (const n of nombres) vars[n] = env(n) ? 'ok (' + env(n).length + ' caracteres)' : 'FALTA';
  let supabase = 'sin probar';
  try {
    const url = env('SUPABASE_URL').replace(/\/$/, '');
    const key = env('SUPABASE_SERVICE_ROLE_KEY');
    const r = await fetch(url + '/rest/v1/pedidos?select=numero&limit=1', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
    supabase = r.status + ' ' + (await r.text()).slice(0, 200);
  } catch (e) {
    supabase = 'error: ' + e.message;
  }
  res.status(200).json({ vars, urlEmpiezaCon: env('SUPABASE_URL').slice(0, 30), formatoClave: env('SUPABASE_SERVICE_ROLE_KEY').slice(0, 7), supabase });
};
