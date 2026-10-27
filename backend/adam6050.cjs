const express = require("express");
const ModbusRTU = require("modbus-serial");

const app = express();
const client = new ModbusRTU();

let piezas = 0;
let ultimoSensorPieza = false;

async function conectarAdam() {
  await client.connectTCP("10.0.0.1", { port: 502 });
  client.setID(1);

  console.log("ADAM-6050 conectado");
}

conectarAdam();

app.get("/api/adam6050", async (req, res) => {
  try {

    const result = await client.readDiscreteInputs(0, 12);

    const di = result.data;

    // DI0 -> Sensor de piezas
    if (di[0] && !ultimoSensorPieza) {
      piezas++;
    }

    ultimoSensorPieza = di[0];

    const datos = {
      produccion: piezas,

      maquina: di[11]
        ? "Produciendo"
        : "Detenida",

      alarma: di[11]
        ? "Activa"
        : "Normal",

      emergencia: di[11]
        ? "ACTIVADA"
        : "Normal",

      puerta: di[11]
        ? "Abierta"
        : "Cerrada",

      entradas: di
    };

    console.log(datos);

    res.json(datos);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

app.listen(3001, () => {
  console.log("Servidor iniciado en puerto 3001");
});