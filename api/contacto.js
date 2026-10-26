const { sb, cuerpo, txt, soloPost, origenOk } = require('./_lib');
const { enviarCorreo, TIENDA } = require('./_correo');

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const d = cuerpo(req);
    const nombre = txt(d.nombre, 120);
    const correo = txt(d.correo, 120);
    const mensaje = txt(d.mensaje, 2000);
    if (!nombre || !mensaje || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ ok: false, error: 'Datos incompletos' });
    }
    await sb('mensajes_contacto', { method: 'POST', body: { nombre, correo, mensaje } });
    await enviarCorreo({
      to: TIENDA,
      replyTo: correo,
      subject: 'Mensaje de contacto — ' + nombre,
      text: 'Nuevo mensaje desde la web\n\nNombre: ' + nombre + '\nCorreo: ' + correo + '\n\n' + mensaje,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contacto', e.message);
    return res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje' });
  }
};
