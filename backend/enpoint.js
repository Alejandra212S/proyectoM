const express = require("express");
const cors = require("cors");
const { sql, config } = require("./bd");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/maquinas", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .query(`
        SELECT
          m.IdMaquina AS MaquinaId,
          m.NumeroMaquina,
          m.Nombre,
          m.Tipo,
          m.OtroTipo,
          m.Marca,
          m.Modelo,
          m.Area,
          m.Ubicacion,
          m.Estado,
          m.FechaRegistro,
          d.DireccionIP,
          d.PuertoTCP,
          d.UnitId,
          d.Slot,
          latest.FechaLectura,
          latest.DO0,
          latest.DO1,
          latest.DO2,
          latest.DO3,
          latest.DO4,
          latest.DO5
        FROM dbo.Maquinas AS m
        LEFT JOIN dbo.DispositivosADAM5060 AS d ON d.MaquinaId = m.IdMaquina
        OUTER APPLY (
          SELECT TOP (1)
            l.FechaLectura,
            l.DO0,
            l.DO1,
            l.DO2,
            l.DO3,
            l.DO4,
            l.DO5
          FROM dbo.LecturasADAM5060 AS l
          WHERE l.DispositivoId = d.DispositivoId
          ORDER BY l.FechaLectura DESC, l.LecturaId DESC
        ) AS latest
        ORDER BY m.IdMaquina;
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/maquinas", async (req, res) => {
  const numero = String(req.body.numero ?? "").trim() || `MAQ-${Date.now()}`;
  const nombre = String(req.body.nombre ?? "").trim();
  const tipo = String(req.body.tipo ?? "").trim();
  const estado = String(req.body.estado ?? "Operativa").trim();
  const ipAddress = String(req.body.ip ?? "").trim();
  const requestedPort = Number(req.body.puerto);
  const port = Number.isInteger(requestedPort) && requestedPort >= 1 && requestedPort <= 65535
    ? requestedPort
    : 502;

  if (!nombre || !tipo || !estado) {
    return res.status(400).json({ error: "Nombre, tipo y estado son obligatorios." });
  }

  if (ipAddress.length > 45) {
    return res.status(400).json({ error: "La dirección IP no puede superar 45 caracteres." });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("numero", sql.VarChar(50), numero)
      .input("nombre", sql.VarChar(100), nombre)
      .input("tipo", sql.VarChar(50), tipo)
      .input("otroTipo", sql.VarChar(100), req.body.otroTipo || null)
      .input("marca", sql.VarChar(100), req.body.marca || null)
      .input("modelo", sql.VarChar(100), req.body.modelo || null)
      .input("area", sql.VarChar(100), req.body.area || null)
      .input("ubicacion", sql.VarChar(150), req.body.ubicacion || null)
      .input("estado", sql.VarChar(30), estado)
      .input("ipAddress", sql.VarChar(45), ipAddress || null)
      .input("port", sql.Int, port)
      .query(`
        INSERT INTO dbo.Maquinas
          (NumeroMaquina, Nombre, Tipo, OtroTipo, Marca, Modelo, Area, Ubicacion, Estado, FechaRegistro)
        VALUES
          (@numero, @nombre, @tipo, @otroTipo, @marca, @modelo, @area, @ubicacion, @estado, SYSUTCDATETIME());

        DECLARE @MaquinaId INT = CONVERT(INT, SCOPE_IDENTITY());

        IF @ipAddress IS NOT NULL
        BEGIN
          INSERT INTO dbo.DispositivosADAM5060 (MaquinaId, DireccionIP, PuertoTCP)
          VALUES (@MaquinaId, @ipAddress, @port);
        END;

        SELECT
          m.IdMaquina AS MaquinaId,
          m.NumeroMaquina,
          m.Nombre,
          m.Tipo,
          m.OtroTipo,
          m.Marca,
          m.Modelo,
          m.Area,
          m.Ubicacion,
          m.Estado,
          m.FechaRegistro,
          d.DireccionIP,
          d.PuertoTCP,
          d.UnitId,
          d.Slot,
          latest.FechaLectura,
          latest.DO0,
          latest.DO1,
          latest.DO2,
          latest.DO3,
          latest.DO4,
          latest.DO5
        FROM dbo.Maquinas AS m
        LEFT JOIN dbo.DispositivosADAM5060 AS d ON d.MaquinaId = m.IdMaquina
        OUTER APPLY (
          SELECT TOP (1) l.FechaLectura, l.DO0, l.DO1, l.DO2, l.DO3, l.DO4, l.DO5
          FROM dbo.LecturasADAM5060 AS l
          WHERE l.DispositivoId = d.DispositivoId
          ORDER BY l.FechaLectura DESC, l.LecturaId DESC
        ) AS latest
        WHERE m.IdMaquina = @MaquinaId;
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error(error);
    const duplicate = error.number === 2627 || error.number === 2601;
    res.status(duplicate ? 409 : 500).json({
      error: duplicate ? `Ya existe una máquina con el número ${numero}.` : error.message,
    });
  }
});

const port = Number(process.env.API_PORT || 3001);

app.listen(port, () => {
  console.log(`Servidor ejecutándose en puerto ${port}`);
});