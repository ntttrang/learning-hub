-- DP-800 lab database for SQL Server 2025.
-- Run after the container is healthy:
--   docker exec -it dp800-mssql /opt/mssql-tools18/bin/sqlcmd \
--     -S localhost -U sa -P 'Dp800_Strong!Pass' -C -i /seed/01-init.sql
IF DB_ID('dp800') IS NULL
    CREATE DATABASE dp800;
GO
USE dp800;
GO

-- Domain 1 (JSON lab) sample objects
IF OBJECT_ID('dbo.Product') IS NULL
BEGIN
    CREATE TABLE dbo.Product (
        ProductId INT IDENTITY PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        Price DECIMAL(10,2) NOT NULL,
        Attributes NVARCHAR(MAX) NOT NULL  -- use `json` type on SQL Server 2025
    );
    INSERT dbo.Product (Name, Price, Attributes) VALUES
    (N'Cordless drill', 129.00, N'{"color":"blue","voltage":18,"tags":["power","sale"]}'),
    (N'Hex bolt M8',      0.20,  N'{"color":"silver","thread":"M8","tags":["fastener"]}'),
    (N'LED work light', 49.99,  N'{"color":"blue","lumens":2000,"tags":["lighting","new"]}'),
    (N'Paint roller',    8.50,  N'{"color":"yellow","tags":["decor"]}');
END
GO

-- Domain 2 (RLS lab) sample objects
IF OBJECT_ID('dbo.Orders') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        OrderId INT IDENTITY PRIMARY KEY,
        TenantId INT NOT NULL,
        Product NVARCHAR(100) NOT NULL,
        Amount DECIMAL(10,2) NOT NULL
    );
    CREATE INDEX IX_Orders_TenantId ON dbo.Orders(TenantId);
    INSERT dbo.Orders (TenantId, Product, Amount) VALUES
    (1, N'Widget', 10.00), (1, N'Gadget', 25.50),
    (2, N'Sprocket', 5.75), (2, N'Cog', 40.00);
END
GO
PRINT 'DP-800 SQL Server lab database ready.';
GO
