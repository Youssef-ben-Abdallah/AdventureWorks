using Ecom.Api.DTOs;
using Ecom.Api.Entities;
using Ecom.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecom.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubCategoriesController : ControllerBase
{
    private readonly ISubCategoryRepository _repo;
    public SubCategoriesController(ISubCategoryRepository repo) => _repo = repo;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<SubCategoryDto>>> GetAll()
    {
        var rows = await _repo.GetAllAsync();
        return rows.Select(s => new SubCategoryDto(s.Id, s.Name, s.CategoryId, s.Category?.Name ?? ""))
                   .ToList();
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SubCategoryDto>> Create(CreateSubCategoryDto dto)
    {
        var created = await _repo.AddAsync(new SubCategory { Name = dto.Name.Trim(), CategoryId = dto.CategoryId });
        var fetched = await _repo.GetByIdAsync(created.Id);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            new SubCategoryDto(created.Id, created.Name, created.CategoryId, fetched?.Category?.Name ?? ""));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SubCategoryDto>> GetById(int id)
    {
        var s = await _repo.GetByIdAsync(id);
        if (s == null) return NotFound();
        return new SubCategoryDto(s.Id, s.Name, s.CategoryId, s.Category?.Name ?? "");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateSubCategoryDto dto)
    {
        var s = await _repo.GetByIdAsync(id);
        if (s == null) return NotFound();
        s.Name = dto.Name.Trim();
        s.CategoryId = dto.CategoryId;
        await _repo.UpdateAsync(s);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await _repo.GetByIdAsync(id);
        if (s == null) return NotFound();
        try
        {
            await _repo.DeleteAsync(s);
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict("Subcategory cannot be deleted because it is referenced by existing products.");
        }
    }
}
