const { sb, izipay, cuerpo, txt, soloPost, origenOk } = require('./_lib');

module.exports = async (req, res) => {
  if (!soloPost(req, res) || !origenOk(req, res)) return;
  try {
    const numero = txt(cuerpo(req).numero, 40);
    const filas = await sb('pedidos?numero=eq.' + encodeURIComponent(numero) + '&select=numero,total,correo,estado_pago');
    if (!filas.length) return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });
    const pedido = filas[0];
    if (pedido.estado_pago === 'pagado') return res.status(409).json({ ok: false, error: 'Este pedido ya esta pagado' });

    const z = izipay();
    const r = await fetch('https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(z.username + ':' + z.password).toString('base64'),
      },
      body: JSON.stringify({
        amount: Math.round(Number(pedido.total) * 100),
        currency: 'PEN',
        orderId: pedido.numero,
        formAction: 'PAYMENT',
        customer: { email: pedido.correo },
        ipnTargetUrl: 'https://www.nonamiranda.pe/api/izipay-ipn',
      }),
    });
    const data = await r.json();
    if (data.status === 'SUCCESS' && data.answer && data.answer.formToken) {
      return res.status(200).json({ ok: true, formToken: data.answer.formToken, publicKey: z.publicKey });
    }
    console.error('izipay-crear', JSON.stringify(data).slice(0, 300));
    return res.status(502).json({ ok: false, error: (data.answer && data.answer.errorMessage) || 'No se pudo iniciar el pago' });
  } catch (e) {
    console.error('izipay-crear', e.message);
    return res.status(500).json({ ok: false, error: 'No se pudo iniciar el pago' });
  }
};
