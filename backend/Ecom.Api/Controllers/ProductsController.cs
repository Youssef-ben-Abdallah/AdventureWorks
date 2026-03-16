using Ecom.Api.DTOs;
using Ecom.Api.Entities;
using Ecom.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text.RegularExpressions;

namespace Ecom.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _repo;
    private readonly IConfiguration _cfg;
    public ProductsController(IProductRepository repo, IConfiguration cfg)
    {
        _repo = repo;
        _cfg = cfg;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<ProductDto>>> GetAll()
    {
        var rows = await _repo.GetAllAsync();
        return rows.Select(p => new ProductDto(
            p.Id, p.Sku, p.Name, p.Description, p.Price, p.StockQty,
            p.ImageFileName,
            p.CategoryId, p.Category?.Name ?? "",
            p.SubCategoryId, p.SubCategory?.Name ?? ""
        )).ToList();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductDto>> Create(CreateProductDto dto)
    {
        if (await _repo.ExistsBySkuAsync(dto.Sku.Trim()))
            return BadRequest("SKU already exists.");

        var entity = new Product
        {
            Sku = dto.Sku.Trim(),
            Name = dto.Name.Trim(),
            Description = dto.Description,
            Price = dto.Price,
            StockQty = dto.StockQty,
            ImageFileName = string.IsNullOrWhiteSpace(dto.ImageFileName) ? null : dto.ImageFileName.Trim(),
            CategoryId = dto.CategoryId,
            SubCategoryId = dto.SubCategoryId
        };

        var created = await _repo.AddAsync(entity);
        var fetched = await _repo.GetByIdAsync(created.Id);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, Map(fetched!));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return NotFound();
        return Map(p);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateProductDto dto)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return NotFound();

        if (await _repo.ExistsBySkuAsync(dto.Sku.Trim(), exceptId: id))
            return BadRequest("SKU already exists.");

        p.Sku = dto.Sku.Trim();
        p.Name = dto.Name.Trim();
        p.Description = dto.Description;
        p.Price = dto.Price;
        p.StockQty = dto.StockQty;
        p.ImageFileName = string.IsNullOrWhiteSpace(dto.ImageFileName) ? null : dto.ImageFileName.Trim();
        p.CategoryId = dto.CategoryId;
        p.SubCategoryId = dto.SubCategoryId;

        await _repo.UpdateAsync(p);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _repo.GetByIdAsync(id);
        if (p == null) return NotFound();
        try
        {
            await _repo.DeleteAsync(p);
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict("Product cannot be deleted because it is referenced by existing order items.");
        }
    }

    [HttpPost("{id:int}/image")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(20_000_000)]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<ActionResult<ProductDto>> UploadImage(int id, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");

        var product = await _repo.GetByIdAsync(id);
        if (product == null) return NotFound();

        var root = _cfg["Images:ProductsPath"] ?? @"C:\images\product";
        Directory.CreateDirectory(root);

        // Delete old image if exists
        if (!string.IsNullOrWhiteSpace(product.ImageFileName))
        {
            var oldPath = Path.Combine(root, product.ImageFileName);
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".png";
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".gif" };
        if (!allowed.Contains(ext)) return BadRequest("Invalid file type.");

        var name = $"product-{id}-{Guid.NewGuid():N}{ext}";
        var path = Path.Combine(root, name);

        await using (var fs = System.IO.File.Create(path))
        {
            await file.CopyToAsync(fs);
        }

        product.ImageFileName = name;
        await _repo.UpdateAsync(product);

        var updated = await _repo.GetByIdAsync(id);
        return Ok(Map(updated!));
    }

    private static ProductDto Map(Product p) => new(
        p.Id, p.Sku, p.Name, p.Description, p.Price, p.StockQty,
        p.ImageFileName,
        p.CategoryId, p.Category?.Name ?? "",
        p.SubCategoryId, p.SubCategory?.Name ?? ""
    );
}
