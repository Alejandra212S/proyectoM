require("dotenv").config();

const sql = require("mssql");

//Configuración de la conexión a la base de datos SQL Server, se puede configurar el servidor, puerto, base de datos, usuario y contraseña a través del archivo .env.\*
const config = {
  server: process.env.SQL_SERVER  || "localhost", 
  port: Number(process.env.SQL_PORT || 1433),
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,

  options: {
    trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE !== "false",
    encrypt: process.env.SQL_ENCRYPT === "true",
  },
};

module.exports = { sql, config };