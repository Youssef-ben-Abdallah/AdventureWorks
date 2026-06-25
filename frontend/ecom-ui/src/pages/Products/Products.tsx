import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CatalogService } from '../../services/catalog';
import { Product, Category, SubCategory } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Products.css';

export const Products = () => {
  const { isLoggedIn } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Filters
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [subCategoryId, setSubCategoryId] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Paging
  const pageSize = 9;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, subs, prods] = await Promise.all([
          CatalogService.getCategories(),
          CatalogService.getSubCategories(),
          CatalogService.getProducts(),
        ]);
        setCategories(cats || []);
        setSubCategories(subs || []);
        setProducts(prods || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return products
      .filter(p => categoryId ? p.categoryId === categoryId : true)
      .filter(p => subCategoryId ? p.subCategoryId === subCategoryId : true)
      .filter(p => (maxPrice !== '' && maxPrice !== 0) ? p.price <= maxPrice : true)
      .filter(p => query ? (
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      ) : true)
      .sort((a, b) => {
        if (a.price === 0 && b.price !== 0) return 1;
        if (b.price === 0 && a.price !== 0) return -1;
        return 0;
      });
  }, [products, q, categoryId, subCategoryId, maxPrice]);

  const filteredTotal = filtered.length;
  
  const subsForSelected = useMemo(() => {
    return subCategories.filter(s => categoryId ? s.categoryId === categoryId : true);
  }, [subCategories, categoryId]);

  const handleCategoryChange = (val: number) => {
    setCategoryId(val);
    if (subCategoryId && !subCategories.filter(s => val ? s.categoryId === val : true).some(s => s.id === subCategoryId)) {
      setSubCategoryId(0);
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

  // Clamp page if filters reduced the dataset
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const startItem = filteredTotal ? (page - 1) * pageSize + 1 : 0;
  const endItem = filteredTotal ? Math.min(page * pageSize, filteredTotal) : 0;

  const goToPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevPage = () => {
    if (page > 1) goToPage(page - 1);
  };

  const nextPage = () => {
    if (page < totalPages) goToPage(page + 1);
  };

  const pageRange = useMemo(() => {
    const range: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  const clearFilters = () => {
    setQ('');
    setCategoryId(0);
    setSubCategoryId(0);
    setMaxPrice('');
    setPage(1);
  };

  const addToCart = (p: Product) => {
    if (!isLoggedIn) {
      navigate('/login?returnUrl=/products');
      return;
    }
    add(p, 1);
  };

  return (
    <div className="products-page">
      {/* Page Header */}
      <div className="aw-page-header with-inner">
        <div className="aw-page-header-inner">
          <div>
            <div className="aw-badge" style={{ marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '12px' }}>pedal_bike</span>
              Full Catalog
            </div>
            <h1 className="products-title">Products</h1>
            <p className="products-subtitle">Browse and filter {filteredTotal} items. Add to your cart.</p>
          </div>
          <Link className="btn-secondary-glass" to="/cart">
            <span className="material-icons">shopping_cart</span>
            View Cart
          </Link>
        </div>
      </div>

      <div className="neon-divider"></div>

      {/* Loading */}
      {loading && (
        <div className="state-loading">
          <div className="skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="skeleton-item">
                <div className="skeleton" style={{ height: '180px', borderRadius: '12px 12px 0 0' }}></div>
                <div style={{ padding: '1rem' }}>
                  <div className="skeleton" style={{ height: '14px', width: '75%', marginBottom: '8px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '12px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ height: '30px', width: '100%', borderRadius: '8px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="state-error">
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && (
        <div className="products-main aw-page-content">
          {/* Sidebar Filters */}
          <aside className="filters-sidebar glass">
            <div className="filters-title">
              <span className="material-icons">tune</span>
              Filters
            </div>

            <div className="filter-group">
              <label className="filter-label">Search</label>
              <div className="search-wrap">
                <span className="material-icons search-icon">search</span>
                <input
                  className="aw-input search-input"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="Name, SKU, description…"
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select 
                className="aw-select" 
                value={categoryId} 
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
              >
                <option value={0}>All categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sub-category</label>
              <select 
                className="aw-select" 
                value={subCategoryId} 
                onChange={(e) => { setSubCategoryId(Number(e.target.value)); setPage(1); }}
              >
                <option value={0}>All sub-categories</option>
                {subsForSelected.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Max Price</label>
              <input
                className="aw-input"
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                placeholder="e.g. 500"
              />
            </div>

            <div className="filter-results">
              <span className="material-icons" style={{ fontSize: '14px', color: '#6366f1' }}>filter_list</span>
              {filteredTotal} results
            </div>
          </aside>

          {/* Products Grid */}
          <div className="products-content">
            {/* No results */}
            {filteredTotal === 0 ? (
              <div className="empty-state">
                <span className="material-icons">search_off</span>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters.</p>
                <button className="btn-primary-glow" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                {/* Cards */}
                <div className="products-grid">
                  {pagedProducts.map(p => {
                    const imgUrl = CatalogService.imgUrl(p.imageFileName);
                    return (
                      <div key={p.id} data-testid="product-card" className={`aw-product-card ${p.stockQty <= 0 ? 'out-of-stock' : ''}`}>
                        <div className="product-img-wrap">
                          {imgUrl ? (
                            <img src={imgUrl} alt={p.name} />
                          ) : (
                            <div className="product-placeholder">{p.name}</div>
                          )}
                          <div className="product-img-overlay"></div>
                          <div className="product-badges-overlay">
                            <span className="aw-badge-mini">{p.subCategoryName}</span>
                          </div>
                          {p.stockQty <= 0 && <div className="out-of-stock-banner">OUT OF STOCK</div>}
                          <button
                            data-testid="product-add-to-cart"
                            className="quick-add-btn"
                            onClick={() => addToCart(p)}
                            title={p.stockQty <= 0 ? 'Out of stock' : 'Quick add'}
                            disabled={p.stockQty <= 0}
                          >
                            <span className="material-icons">add_shopping_cart</span>
                          </button>
                        </div>

                        <div className="product-body">
                          <div className="product-meta-row">
                            <span className="category-tag">{p.categoryName}</span>
                            <span className="product-sku">{p.sku}</span>
                          </div>
                          <h3 className="product-name">{p.name}</h3>
                          {p.description && (
                            <p className="product-desc">
                              {p.description.slice(0, 70)}{p.description.length > 70 ? '…' : ''}
                            </p>
                          )}

                          <div className="product-footer-row">
                            <div className="product-price">
                              <span className="price-curr">$</span>{p.price.toFixed(2)}
                            </div>
                            <div className="product-btns">
                              <Link data-testid="product-details-link" className="btn-ghost-sm" to={`/products/${p.id}`}>
                                <span className="material-icons">visibility</span>
                              </Link>
                              <button 
                                className="btn-cart-sm" 
                                onClick={() => addToCart(p)} 
                                disabled={p.stockQty <= 0} 
                                title={p.stockQty <= 0 ? 'Out of stock' : ''}
                              >
                                <span className="material-icons">add</span> Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <div className="page-info">
                    Showing <strong>{startItem}–{endItem}</strong> of <strong>{filteredTotal}</strong>
                  </div>
                  <div className="page-actions">
                    <button data-testid="products-prev-page" className="page-btn" onClick={prevPage} disabled={page <= 1}>
                      <span className="material-icons">chevron_left</span>
                    </button>
                    <div className="page-numbers">
                      {pageRange.map(n => (
                        <button key={n} className={`page-num ${n === page ? 'active' : ''}`} onClick={() => goToPage(n)}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <button data-testid="products-next-page" className="page-btn" onClick={nextPage} disabled={page >= totalPages}>
                      <span className="material-icons">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
