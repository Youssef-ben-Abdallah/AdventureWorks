-- Drop tables if they exist
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.SubCategories', 'U') IS NOT NULL DROP TABLE dbo.SubCategories;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;

-- Drop existing views and triggers if they exist
IF OBJECT_ID('dbo.TR_Products_Update', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Products_Update;
IF OBJECT_ID('dbo.TR_Products_Insert', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Products_Insert;
IF OBJECT_ID('dbo.OrderItems', 'V') IS NOT NULL DROP VIEW dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'V') IS NOT NULL DROP VIEW dbo.Orders;
IF OBJECT_ID('dbo.Products', 'V') IS NOT NULL DROP VIEW dbo.Products;
IF OBJECT_ID('dbo.SubCategories', 'V') IS NOT NULL DROP VIEW dbo.SubCategories;
IF OBJECT_ID('dbo.Categories', 'V') IS NOT NULL DROP VIEW dbo.Categories;
GO

-- 1. Categories
CREATE VIEW dbo.Categories AS
SELECT 
    ProductCategoryID AS Id,
    Name AS Name
FROM Production.ProductCategory;
GO

-- 2. SubCategories
CREATE VIEW dbo.SubCategories AS
SELECT 
    ProductSubcategoryID AS Id,
    ProductCategoryID AS CategoryId,
    Name AS Name
FROM Production.ProductSubcategory;
GO

-- 3. Products
CREATE VIEW dbo.Products AS
SELECT 
    ProductID AS Id,
    ISNULL(ProductSubcategoryID, 1) AS SubCategoryId,
    1 AS CategoryId, -- Dummy value for EF navigation
    ProductNumber AS Sku,
    Name AS Name,
    Color AS Description,
    ListPrice AS Price,
    CAST(SafetyStockLevel AS INT) AS StockQty,
    NULL AS ImageFileName
FROM Production.Product;
GO

-- INSTEAD OF UPDATE for Products
CREATE TRIGGER TR_Products_Update
ON dbo.Products
INSTEAD OF UPDATE
AS
BEGIN
    UPDATE p
    SET 
        p.ProductNumber = i.Sku,
        p.Name = i.Name,
        p.Color = i.Description,
        p.ListPrice = i.Price,
        p.SafetyStockLevel = i.StockQty,
        p.ProductSubcategoryID = CASE WHEN i.SubCategoryId = 1 THEN NULL ELSE i.SubCategoryId END,
        p.ModifiedDate = GETUTCDATE()
    FROM Production.Product p
    INNER JOIN inserted i ON p.ProductID = i.Id;
END
GO

-- INSTEAD OF INSERT for Products
CREATE TRIGGER TR_Products_Insert
ON dbo.Products
INSTEAD OF INSERT
AS
BEGIN
    INSERT INTO Production.Product (
        ProductNumber, Name, Color, ListPrice, SafetyStockLevel, ProductSubcategoryID,
        MakeFlag, FinishedGoodsFlag, ReorderPoint, StandardCost, DaysToManufacture, SellStartDate, rowguid, ModifiedDate
    )
    SELECT 
        i.Sku, i.Name, i.Description, i.Price, i.StockQty, 
        CASE WHEN i.SubCategoryId = 1 THEN NULL ELSE i.SubCategoryId END,
        0, 1, 75, 0, 0, GETUTCDATE(), NEWID(), GETUTCDATE()
    FROM inserted i;
END
GO

-- 4. Orders
CREATE VIEW dbo.Orders AS
SELECT 
    SalesOrderID AS Id,
    OrderDate AS CreatedAtUtc,
    CAST(Status AS INT) AS Status,
    Comment AS UserId, -- Mapping string ID to Comment
    SubTotal AS Total,
    CustomerID,
    BillToAddressID,
    ShipToAddressID,
    ShipMethodID
FROM Sales.SalesOrderHeader;
GO

-- INSTEAD OF INSERT for Orders
CREATE TRIGGER TR_Orders_Insert
ON dbo.Orders
INSTEAD OF INSERT
AS
BEGIN
    INSERT INTO Sales.SalesOrderHeader (
        RevisionNumber, OrderDate, DueDate, ShipDate, Status, OnlineOrderFlag, 
        AccountNumber, CustomerID, SalesPersonID, TerritoryID, BillToAddressID, ShipToAddressID, ShipMethodID, 
        CreditCardID, CreditCardApprovalCode, CurrencyRateID, SubTotal, TaxAmt, Freight, Comment, rowguid, ModifiedDate
    )
    SELECT 
        0, -- RevisionNumber
        i.CreatedAtUtc, 
        i.CreatedAtUtc, -- DueDate
        NULL, -- ShipDate
        i.Status, 
        1, -- OnlineOrderFlag
        NULL, -- AccountNumber
        i.CustomerID, 
        NULL, -- SalesPersonID
        NULL, -- TerritoryID 
        i.BillToAddressID, 
        i.ShipToAddressID, 
        i.ShipMethodID, 
        NULL, NULL, NULL, 
        i.Total, 
        0, 0, 
        i.UserId, -- Storing UserId in Comment
        NEWID(),
        GETUTCDATE()
    FROM inserted i;
END
GO

-- 5. OrderItems
CREATE VIEW dbo.OrderItems AS
SELECT 
    SalesOrderDetailID AS Id,
    SalesOrderID AS OrderId,
    ProductID AS ProductId,
    CAST(OrderQty AS INT) AS Qty,
    UnitPrice AS UnitPrice
FROM Sales.SalesOrderDetail;
GO

-- INSTEAD OF INSERT for OrderItems
CREATE TRIGGER TR_OrderItems_Insert
ON dbo.OrderItems
INSTEAD OF INSERT
AS
BEGIN
    INSERT INTO Sales.SalesOrderDetail (
        SalesOrderID, CarrierTrackingNumber, OrderQty, ProductID, SpecialOfferID, UnitPrice, UnitPriceDiscount, rowguid, ModifiedDate
    )
    SELECT 
        i.OrderId,
        NULL,
        i.Qty,
        i.ProductId,
        1, -- SpecialOfferID (1 is No Discount)
        i.UnitPrice,
        0.00,
        NEWID(),
        GETUTCDATE()
    FROM inserted i;
END
GO
