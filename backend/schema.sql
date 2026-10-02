IF DB_ID(N'IndustrialMachineMonitoringDB') IS NULL
BEGIN
    CREATE DATABASE IndustrialMachineMonitoringDB;
END;
GO

USE IndustrialMachineMonitoringDB;
GO

IF OBJECT_ID(N'dbo.Maquinas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Maquinas (
        IdMaquina INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Maquinas PRIMARY KEY,
        NumeroMaquina VARCHAR(50) NOT NULL CONSTRAINT UQ_Maquinas_Numero UNIQUE,
        Nombre VARCHAR(100) NOT NULL,
        Tipo VARCHAR(50) NOT NULL,
        OtroTipo VARCHAR(100) NULL,
        Marca VARCHAR(100) NULL,
        Modelo VARCHAR(100) NULL,
        Area VARCHAR(100) NULL,
        Ubicacion VARCHAR(150) NULL,
        Estado VARCHAR(30) NOT NULL,
        FechaRegistro DATETIME NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.DispositivosADAM5060', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DispositivosADAM5060 (
        DispositivoId INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_DispositivosADAM5060 PRIMARY KEY,
        MaquinaId INT NOT NULL CONSTRAINT UQ_DispositivosADAM5060_Maquina UNIQUE,
        DireccionIP VARCHAR(45) NOT NULL,
        PuertoTCP INT NOT NULL CONSTRAINT DF_DispositivosADAM5060_Puerto DEFAULT 502,
        UnitId TINYINT NOT NULL CONSTRAINT DF_DispositivosADAM5060_UnitId DEFAULT 1,
        Slot TINYINT NULL,
        IntervaloLecturaMs INT NOT NULL CONSTRAINT DF_DispositivosADAM5060_Intervalo DEFAULT 1000,
        Habilitado BIT NOT NULL CONSTRAINT DF_DispositivosADAM5060_Habilitado DEFAULT 1,
        CONSTRAINT FK_DispositivosADAM5060_Maquinas FOREIGN KEY (MaquinaId) REFERENCES dbo.Maquinas (IdMaquina),
        CONSTRAINT CK_DispositivosADAM5060_Puerto CHECK (PuertoTCP BETWEEN 1 AND 65535),
        CONSTRAINT CK_DispositivosADAM5060_Intervalo CHECK (IntervaloLecturaMs >= 250)
    );
END;
GO

IF OBJECT_ID(N'dbo.LecturasADAM5060', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LecturasADAM5060 (
        LecturaId BIGINT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_LecturasADAM5060 PRIMARY KEY,
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