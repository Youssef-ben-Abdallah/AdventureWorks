namespace Ecom.Api.DTOs;

public record CategoryDto(int Id, string Name);
public record CreateCategoryDto(string Name);

public record SubCategoryDto(int Id, string Name, int CategoryId, string CategoryName);
public record CreateSubCategoryDto(string Name, int CategoryId);

public record ProductDto(
    int Id,
    string Sku,
    string Name,
    string? Description,
    decimal Price,
    int StockQty,
    string? ImageFileName,
    int CategoryId,
    string CategoryName,
    int SubCategoryId,
    string SubCategoryName
);

public record CreateProductDto(
    string Sku,
    string Name,
    string? Description,
    decimal Price,
    int StockQty,
    string? ImageFileName,
    int CategoryId,
    int SubCategoryId
);
