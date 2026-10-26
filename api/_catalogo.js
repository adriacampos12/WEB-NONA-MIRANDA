// Precios oficiales (S/). El servidor calcula el total con esta tabla; el navegador no decide el precio.
// Al agregar un producto nuevo a la tienda, agregalo tambien aqui.
const PRECIOS = {
  'p-bolsos-1': 50,
  'p-billeteras-1': 30,
  'p-billeteras-2': 30,
  'p-billeteras-3': 30,
  'p-billeteras-4': 30,
  'p-billeteras-5': 30,
};

// Cupones: codigo -> porcentaje de descuento
const CUPONES = { NONA10: 10 };

module.exports = { PRECIOS, CUPONES };
