import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CatalogService } from '../../services/catalog';
import { Product } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './ProductDetails.css';

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { add } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) {
      setError('Invalid product id');
      return;
    }
    const loadProduct = async () => {
      try {
        setLoading(true);
        const p = await CatalogService.getProduct(Number(id));
        setProduct(p);
      } catch (err: any) {
        setError(err?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    if (!isLoggedIn) {
      navigate(`/login?returnUrl=/products/${id}`);
      return;
    }
    add(product, qty);
  };

  const imgUrl = product ? CatalogService.imgUrl(product.imageFileName) : '';

  return (
    <div className="pd-page">
      {/* Back breadcrumb */}
      <div className="pd-breadcrumb">
        <Link className="breadcrumb-link" to="/products">
          <span className="material-icons">arrow_back</span>
          Back to Products
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="pd-skeleton">
          <div className="pd-skeleton-img skeleton"></div>
          <div className="pd-skeleton-body">
            <div className="skeleton" style={{ height: '14px', width: '35%', marginBottom: '12px', borderRadius: '4px' }}></div>
            <div className="skeleton" style={{ height: '28px', width: '80%', marginBottom: '20px', borderRadius: '6px' }}></div>
            <div className="skeleton" style={{ height: '12px', width: '100%', marginBottom: '8px', borderRadius: '4px' }}></div>
            <div className="skeleton" style={{ height: '12px', width: '75%', marginBottom: '8px', borderRadius: '4px' }}></div>
            <div className="skeleton" style={{ height: '12px', width: '55%', marginBottom: '24px', borderRadius: '4px' }}></div>
            <div className="skeleton" style={{ height: '48px', width: '220px', borderRadius: '10px' }}></div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="pd-error">
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <Link className="btn-secondary-glass" to="/products">Browse Products</Link>
        </div>
      )}

      {/* Product */}
      {product && !loading && (
        <div className="pd-layout">
          {/* Image panel */}
          <div className="pd-image-panel gradient-border" style={{ width: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pd-img-wrap" style={{ width: '100%', height: '100%', position: 'relative' }}>
              {imgUrl ? (
                <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div className="product-placeholder" style={{ borderRadius: '15px' }}>{product.name}</div>
              )}
              <div className="pd-img-overlay"></div>
            </div>
            {/* Stock badge */}
            <div className={`pd-stock-badge ${product.stockQty > 0 ? 'in-stock' : 'out-stock'}`}>
              <span className="material-icons">{product.stockQty > 0 ? 'check_circle' : 'cancel'}</span>
              {product.stockQty > 0 ? `In Stock (${product.stockQty})` : 'Out of Stock'}
            </div>
          </div>

          {/* Details panel */}
          <div className="pd-details">
            {/* Breadcrumb category */}
            <div className="pd-category-path">
              <span className="category-tag">{product.categoryName}</span>
              <span className="material-icons pd-path-sep">chevron_right</span>
              <span className="category-tag" style={{ color: '#818cf8' }}>{product.subCategoryName}</span>
            </div>

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-sku-row">
              <span className="pd-sku-label">SKU</span>
              <code className="pd-sku">{product.sku}</code>
            </div>

            {product.description && <p className="pd-description">{product.description}</p>}

            {/* Price */}
            <div className="pd-price-block">
              <div className="pd-price">
                <span className="pd-price-curr">$</span>{product.price.toFixed(2)}
              </div>
              <div className="pd-price-label">per unit</div>
            </div>

            {/* Divider */}
            <div className="neon-divider" style={{ margin: '1.5rem 0' }}></div>

            {/* Quantity + actions */}
            <div className="pd-actions">
              <div className="pd-qty-group">
                <label className="pd-qty-label">Quantity</label>
                <div className="pd-qty-wrap">
                  <button className="qty-btn" onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>
                    <span className="material-icons">remove</span>
                  </button>
                  <input
                    className="pd-qty-input"
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value), product.stockQty)))}
                    min="1"
                    max={product.stockQty}
                  />
                  <button className="qty-btn" onClick={() => setQty(qty < product.stockQty ? qty + 1 : qty)}>
                    <span className="material-icons">add</span>
                  </button>
                </div>
              </div>

              <div className="pd-btn-row">
                <button
                  className="btn-primary-glow pd-add-btn"
                  onClick={addToCart}
                  disabled={product.stockQty <= 0}
                >
                  <span className="material-icons">add_shopping_cart</span>
                  Add to Cart
                </button>
                <Link className="btn-secondary-glass pd-add-btn" to="/cart">
                  <span className="material-icons">shopping_cart</span>
                  Go to Cart
                </Link>
              </div>
            </div>

            {/* Meta info chips */}
            <div className="pd-meta-chips">
              <div className="pd-meta-chip">
                <span className="material-icons">local_shipping</span>
                Fast Shipping
              </div>
              <div className="pd-meta-chip">
                <span className="material-icons">verified</span>
                Genuine Product
              </div>
              <div className="pd-meta-chip">
                <span className="material-icons">replay</span>
                Easy Returns
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
