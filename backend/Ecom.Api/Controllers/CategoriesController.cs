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
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _repo;
    public CategoriesController(ICategoryRepository repo) => _repo = repo;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
        => (await _repo.GetAllAsync()).Select(c => new CategoryDto(c.Id, c.Name)).ToList();

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryDto dto)
    {
        var created = await _repo.AddAsync(new Category { Name = dto.Name.Trim() });
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new CategoryDto(created.Id, created.Name));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return NotFound();
        return new CategoryDto(c.Id, c.Name);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, CreateCategoryDto dto)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return NotFound();
        c.Name = dto.Name.Trim();
        await _repo.UpdateAsync(c);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return NotFound();
        try
        {
            await _repo.DeleteAsync(c);
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict("Category cannot be deleted because it is referenced by existing subcategories or products.");
        }
    }
}
