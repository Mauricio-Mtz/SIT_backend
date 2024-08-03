const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const empleadoRoutes = require('./routes/empleadoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const loginRoutes = require('./routes/loginRoutes');
const refaccionRoutes = require('./routes/refaccionRoutes')
const sucursalRoutes = require('./routes/sucursalRoutes')
const citaRoutes = require('./routes/citaRoutes')
const servicioRoutes = require('./routes/servicioRoutes')
const utilidadRoutes = require('./routes/utilidadRoutes')
const ordenTrabajoRoutes = require('./routes/ordenTrabajoRoutes')
const vehiculoRoutes = require('./routes/vehiculoRoutes')
const jsonRoutes = require('./routes/jsonRoutes')

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('¡Bienvenido al backend de Mecanico Express!');
});

app.use('/empleados', empleadoRoutes);
app.use('/clientes', clienteRoutes);
app.use('/proveedores', proveedorRoutes);
app.use('/login', loginRoutes);
app.use('/refacciones', refaccionRoutes);
app.use('/sucursales', sucursalRoutes);
app.use('/citas', citaRoutes);
app.use('/servicio', servicioRoutes);
app.use('/utilidades', utilidadRoutes);
app.use('/ordenTrabajo', ordenTrabajoRoutes);
app.use('/vehiculos', vehiculoRoutes);
app.use('/json', jsonRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`URL del backend: http://localhost:${PORT}`);
});
