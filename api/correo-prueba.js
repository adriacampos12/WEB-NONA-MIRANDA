const { origenOk } = require('./_lib');
const { avisarPago } = require('./_correo');

// TEMPORAL: envia el correo de ejemplo solo al correo de la tienda. Se borra al terminar la prueba.
module.exports = async (req, res) => {
  if (!origenOk(req, res)) return;
  const ejemplo = {
    numero: 'NM-PRUEBA',
    nombre: 'Prueba de correo',
    correo: 'infononamiranda@gmail.com',
    telefono: '999999999',
    dni: '00000000',
    productos: 'Crossbody Negro x1',
    productos_json: [{ nombre: 'Crossbody Negro', cantidad: 1, precio: 50 }],
    subtotal: 50,
    envio: '12',
    total: 62,
    entrega: 'Agencia',
    courier: 'Shalom',
    direccion: 'Shalom Av. Ejemplo 123 (Clave: prueba)',
    distrito: 'San Isidro',
    provincia: 'Lima',
    departamento: 'Lima',
    fecha_entrega: 'Jueves 29 de octubre 2026',
    comprobante: 'Boleta',
  };
  try {
    await avisarPago(ejemplo, true);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message.slice(0, 200) });
  }
};
