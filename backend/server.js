const express = require("express");
const ModbusRTU = require("modbus-serial");
const cors = require("cors");

const app = express();
const client = new ModbusRTU();
app.use(cors());

// CAMBIA esta IP por la IP real del ADAM-6050
const IP_ADAM = "10.0.0.1";
const PUERTO_MODBUS = 502;
const ID_MODBUS = 1;

let conectado = false;
let leyendo = false;
let entradas = Array(12).fill(null);
let error = "Esperando conexión con el ADAM-6050";

async function leerEntradas() {
  if (leyendo) return;
  leyendo = true;

  try {
    if (!conectado) {
      await client.connectTCP(IP_ADAM, {
        port: PUERTO_MODBUS
      });

      client.setID(ID_MODBUS);
      client.setTimeout(2000);
      conectado = true;
      error = "";
    }

    // Lee DI0 hasta DI11
    const resultado = await client.readDiscreteInputs(0, 12);

    entradas = resultado.data.slice(0, 12).map((estado, indice) => ({
      canal: `DI${indice}`,
      activa: estado,
      estado: estado ? "ACTIVADA" : "DESACTIVADA"
    }));

    error = "";
  } catch (e) {
    conectado = false;
    error = "Sin comunicación: " + e.message;
    entradas = Array(12).fill(null);
  } finally {
    leyendo = false;
  }
}

// Actualizar los datos aproximadamente cada 500 ms
setInterval(leerEntradas, 500);
leerEntradas();

app.get("/api/entradas", (req, res) => {
  res.json({
    conectado,
    error,
    entradas
  });
});

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monitor ADAM-6050</title>
<style>
body {
  font-family: Arial, sans-serif;
  background: #f1f4f8;
  margin: 0;
  padding: 20px;
  color: #172b4d;
}
h1 { text-align: center; }
#conexion {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 12px;
}
.canal {
  background: white;
  padding: 20px 10px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 6px #0001;
}
.luz {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #9ca3af;
  margin: 10px auto;
}
.activa .luz { background: #16a34a; }
.inactiva .luz { background: #9ca3af; }
.fallo .luz { background: #dc2626; }
.estado { font-weight: bold; }
small { color: #64748b; }
</style>
</head>
<body>
<h1>Monitor de señales ADAM-6050</h1>
<div id="conexion">Conectando...</div>
<div class="grid" id="grid"></div>
<p><small>Actualización automática cada 500 ms.
El estado indica la lectura digital, no una medición exacta de voltaje.</small></p>

<script>
async function actualizar() {
  try {
    const respuesta = await fetch("/api/entradas");
    const datos = await respuesta.json();

    document.getElementById("conexion").textContent =
      datos.conectado
        ? "🟢 ADAM-6050 conectado"
        : "🔴 " + datos.error;

    document.getElementById("grid").innerHTML =
      datos.entradas.map((entrada, i) => {
        const estado = entrada === null
          ? "SIN DATOS"
          : entrada.estado;

        const clase = entrada === null
          ? "fallo"
          : entrada.activa
            ? "activa"
            : "inactiva";

        return \`
          <div class="canal \${clase}">
            <h3>DI\${i}</h3>
            <div class="luz"></div>
            <div class="estado">\${estado}</div>
          </div>
        \`;
      }).join("");
  } catch (e) {
    document.getElementById("conexion").textContent =
      "Error al consultar el servidor";
  }
}

actualizar();
setInterval(actualizar, 500);
</script>
</body>
</html>
  `);
});

app.listen(3000, () => {
  console.log("Monitor disponible en http://localhost:3000");
});