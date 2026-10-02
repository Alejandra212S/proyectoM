USE master;
GO

IF DB_ID(N'IndustrialMachineMonitoringDB') IS NULL
BEGIN
    CREATE DATABASE IndustrialMachineMonitoringDB;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.server_principals
    WHERE name = N'api_user'
)
BEGIN
    CREATE LOGIN [api_user]
        WITH PASSWORD = N'Api123456!',
             CHECK_POLICY = OFF,
             CHECK_EXPIRATION = OFF;
END
ELSE
BEGIN
    ALTER LOGIN [api_user]
        WITH PASSWORD = N'Api123456!',
             CHECK_POLICY = OFF,
             CHECK_EXPIRATION = OFF;
END;
GO

USE IndustrialMachineMonitoringDB;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = N'api_user'
)
BEGIN
    CREATE USER [api_user] FOR LOGIN [api_user];
END;
GO

ALTER ROLE db_datareader ADD MEMBER [api_user];
ALTER ROLE db_datawriter ADD MEMBER [api_user];
GO

IF OBJECT_ID(N'dbo.Maquinas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Maquinas (
        MaquinaId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Maquinas PRIMARY KEY,
        Nombre NVARCHAR(120) NOT NULL,
        Tipo NVARCHAR(40) NULL,
        Estado NVARCHAR(30) NULL,
        Descripcion NVARCHAR(500) NULL,
        FechaRegistro DATETIME2(3) NOT NULL CONSTRAINT DF_Maquinas_FechaRegistro DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.DispositivosADAM5060', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DispositivosADAM5060 (
        DispositivoId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DispositivosADAM5060 PRIMARY KEY,
        MaquinaId INT NOT NULL CONSTRAINT UQ_DispositivosADAM5060_Maquina UNIQUE,
        DireccionIP VARCHAR(45) NOT NULL,
        PuertoTCP INT NOT NULL CONSTRAINT DF_DispositivosADAM5060_Puerto DEFAULT 502,
        UnitId TINYINT NOT NULL CONSTRAINT DF_DispositivosADAM5060_UnitId DEFAULT 1,
        Slot TINYINT NULL,
        IntervaloLecturaMs INT NOT NULL CONSTRAINT DF_DispositivosADAM5060_Intervalo DEFAULT 1000,
        Habilitado BIT NOT NULL CONSTRAINT DF_DispositivosADAM5060_Habilitado DEFAULT 1,
        CONSTRAINT FK_DispositivosADAM5060_Maquinas FOREIGN KEY (MaquinaId) REFERENCES dbo.Maquinas (MaquinaId),
        CONSTRAINT CK_DispositivosADAM5060_Puerto CHECK (PuertoTCP BETWEEN 1 AND 65535),
        CONSTRAINT CK_DispositivosADAM5060_Intervalo CHECK (IntervaloLecturaMs >= 250)
    );
END;
GO

IF OBJECT_ID(N'dbo.LecturasADAM5060', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LecturasADAM5060 (
        LecturaId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LecturasADAM5060 PRIMARY KEY,
        DispositivoId INT NOT NULL,
        FechaLectura DATETIME2(3) NOT NULL CONSTRAINT DF_LecturasADAM5060_Fecha DEFAULT SYSUTCDATETIME(),
        DO0 BIT NULL,
        DO1 BIT NULL,
        DO2 BIT NULL,
        DO3 BIT NULL,
        DO4 BIT NULL,
        DO5 BIT NULL,
        CONSTRAINT FK_LecturasADAM5060_Dispositivos FOREIGN KEY (DispositivoId) REFERENCES dbo.DispositivosADAM5060 (DispositivoId)
    );

    CREATE INDEX IX_LecturasADAM5060_Dispositivo_Fecha
        ON dbo.LecturasADAM5060 (DispositivoId, FechaLectura DESC, LecturaId DESC);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Maquinas WHERE Nombre = N'Máquina 1')
BEGIN
    INSERT INTO dbo.Maquinas (Nombre, Tipo, Estado, Descripcion)
    VALUES
        (N'Máquina 1', N'Inyección', N'Operativa', N'Máquina de inyección principal'),
        (N'Máquina 2', N'Ensamble', N'Alarmada', N'Línea de ensamble B'),
        (N'Máquina 3', N'Enlainadora', N'En mantenimiento', N'Enlainadora de cartón');
END;
GO

DECLARE @Maquina1Id INT = (SELECT MaquinaId FROM dbo.Maquinas WHERE Nombre = N'Máquina 1');
DECLARE @Maquina2Id INT = (SELECT MaquinaId FROM dbo.Maquinas WHERE Nombre = N'Máquina 2');
DECLARE @Maquina3Id INT = (SELECT MaquinaId FROM dbo.Maquinas WHERE Nombre = N'Máquina 3');

IF @Maquina1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.DispositivosADAM5060 WHERE MaquinaId = @Maquina1Id)
BEGIN
    INSERT INTO dbo.DispositivosADAM5060 (MaquinaId, DireccionIP, PuertoTCP, UnitId, Slot, IntervaloLecturaMs, Habilitado)
    VALUES (@Maquina1Id, '192.168.1.10', 502, 1, 0, 1000, 1);
END;

IF @Maquina2Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.DispositivosADAM5060 WHERE MaquinaId = @Maquina2Id)
BEGIN
    INSERT INTO dbo.DispositivosADAM5060 (MaquinaId, DireccionIP, PuertoTCP, UnitId, Slot, IntervaloLecturaMs, Habilitado)
    VALUES (@Maquina2Id, '192.168.1.11', 502, 1, 1, 1000, 1);
END;

IF @Maquina3Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.DispositivosADAM5060 WHERE MaquinaId = @Maquina3Id)
BEGIN
    INSERT INTO dbo.DispositivosADAM5060 (MaquinaId, DireccionIP, PuertoTCP, UnitId, Slot, IntervaloLecturaMs, Habilitado)
    VALUES (@Maquina3Id, '192.168.1.12', 502, 1, 2, 1000, 1);
END;
GO

DECLARE @Dispositivo1Id INT = (SELECT DispositivoId FROM dbo.DispositivosADAM5060 WHERE MaquinaId = @Maquina1Id);
DECLARE @Dispositivo2Id INT = (SELECT DispositivoId FROM dbo.DispositivosADAM5060 WHERE MaquinaId = @Maquina2Id);
DECLARE @Dispositivo3Id INT = (SELECT DispositivoId FROM dbo.DispositivosADAM5060 WHERE MaquinaId = @Maquina3Id);

IF @Dispositivo1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.LecturasADAM5060 WHERE DispositivoId = @Dispositivo1Id)
BEGIN
    INSERT INTO dbo.LecturasADAM5060 (DispositivoId, FechaLectura, DO0, DO1, DO2, DO3, DO4, DO5)
    VALUES (@Dispositivo1Id, SYSUTCDATETIME(), 1, 0, 1, 1, 0, 0);
END;

IF @Dispositivo2Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.LecturasADAM5060 WHERE DispositivoId = @Dispositivo2Id)
BEGIN
    INSERT INTO dbo.LecturasADAM5060 (DispositivoId, FechaLectura, DO0, DO1, DO2, DO3, DO4, DO5)
    VALUES (@Dispositivo2Id, SYSUTCDATETIME(), 0, 1, 0, 0, 1, 0);
END;

IF @Dispositivo3Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.LecturasADAM5060 WHERE DispositivoId = @Dispositivo3Id)
BEGIN
    INSERT INTO dbo.LecturasADAM5060 (DispositivoId, FechaLectura, DO0, DO1, DO2, DO3, DO4, DO5)
    VALUES (@Dispositivo3Id, SYSUTCDATETIME(), 1, 1, 0, 0, 0, 1);
END;
GO

SELECT
    m.MaquinaId,
    m.Nombre,
    m.Tipo,
    m.Estado,
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
LEFT JOIN dbo.DispositivosADAM5060 AS d ON d.MaquinaId = m.MaquinaId
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
ORDER BY m.MaquinaId;
GO
