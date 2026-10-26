const { sb, cuerpo, txt, soloPost, origenOk } = require('./_lib');

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const correo = txt(cuerpo(req).correo, 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ ok: false, error: 'Correo no valido' });
    }
    await sb('suscriptores?on_conflict=correo', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: { correo } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('boletin', e.message);
    return res.status(500).json({ ok: false, error: 'No se pudo guardar' });
  }
};
