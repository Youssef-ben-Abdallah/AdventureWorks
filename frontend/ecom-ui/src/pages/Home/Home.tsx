import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CatalogService } from '../../services/catalog';
import { Product } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Home.css';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  gradient: string;
}

interface Module {
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
}

export const Home = () => {
  const { isLoggedIn } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [top, setTop] = useState<Product[]>([]);
  const [filteredTop, setFilteredTop] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);

  const totalProducts = products.length;
  const totalCategories = 4;

  const features: Feature[] = [
    {
      icon: 'pedal_bike',
      title: 'Premium Bike Catalog',
      desc: 'Road, mountain, touring and e-bikes with rich product data — model, size, color, price and category structure.',
      tag: '500+ bikes',
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))'
    },
    {
      icon: 'build',
      title: 'Parts & Components',
      desc: 'Complete drivetrain, wheels, brakes and accessories — perfect for basket insights and cross-sell recommendations.',
      tag: 'Components & Accessories',
      gradient: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))'
    },
    {
      icon: 'analytics',
      title: 'Sales Analytics',
      desc: 'Real historical order data enabling territory analysis, revenue trends, seasonality and growth comparisons.',
      tag: 'Powered by AW2019',
      gradient: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))'
    },
    {
      icon: 'groups',
      title: 'Customer Intelligence',
      desc: 'Customer profiles, buying behavior, segmentation signals — useful for loyalty and cohort tracking.',
      tag: 'CRM-ready',
      gradient: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))'
    }
  ];

  const modules: Module[] = [
    {
      icon: 'pedal_bike',
      title: 'Products: Bikes',
      desc: 'Road, mountain, touring, e-bikes — described by model, size, color, price, and category structure.',
      bullets: ['Top sellers, price bands, stock awareness', 'Category/subcategory browsing and product detail pages']
    },
    {
      icon: 'build',
      title: 'Parts & Accessories',
      desc: 'Components (drivetrain, wheels, brakes) plus accessories (helmets, lights, bags).',
      bullets: ['Basket insights ("often bought together")', 'Cross-sell recommendations on product pages']
    },
    {
      icon: 'groups',
      title: 'Customers',
      desc: 'Customer profiles, buying behavior over time, and segmentation signals.',
      bullets: ['Loyalty, repeat purchase rates, and cohort tracking', 'Pairs naturally with territory + time for trend analysis']
    },
    {
      icon: 'public',
      title: 'Territories & Time',
      desc: 'Regions/territories plus date breakdowns enable dashboard KPIs and drilldowns.',
      bullets: ['Sales by territory, month, quarter, year', 'Trend lines, seasonality, growth comparisons']
    }
  ];

  const pickRandom = (list: Product[], take: number): Product[] => {
    const copy = [...(list ?? [])];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const picked = copy.slice(0, take);
    return picked.sort((a, b) => {
      if (a.price === 0 && b.price !== 0) return 1;
      if (b.price === 0 && a.price !== 0) return -1;
      return 0;
    });
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const rows = await CatalogService.getProducts();
        setProducts(rows);
        const randomTop = pickRandom(rows, 5);
        setTop(randomTop);
        setFilteredTop(randomTop);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleCategoryChange = (id: number) => {
    setSelectedCategory(id);
    if (id === 0) {
      setFilteredTop(pickRandom(products, 5));
    } else {
      const filtered = products.filter(p => p.categoryId === id);
      setFilteredTop(pickRandom(filtered.length > 0 ? filtered : products, 5));
    }
  };

  const addToCart = (p: Product) => {
    if (!isLoggedIn) {
      navigate('/login?returnUrl=/');
      return;
    }
    add(p, 1);
  };

  return (
    <div className="home-page">
      {/* =============== HERO SECTION =============== */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-bg-pattern" aria-hidden="true"></div>
          <div className="hero-overlay"></div>
        </div>

        <div className="orb orb-primary" style={{ width: '500px', height: '500px', top: '-100px', right: '-100px', animation: 'orb-pulse 5s ease-in-out infinite' }}></div>
        <div className="orb orb-cyan" style={{ width: '350px', height: '350px', bottom: '-50px', left: '100px', animation: 'orb-pulse 7s ease-in-out infinite 1s' }}></div>

        <div className="hero-content">
          <div className="hero-badge animate-slide-up">
            <span className="material-icons" style={{ fontSize: '14px' }}>rocket_launch</span>
            Premium Cycling Experience
          </div>

          <h1 className="hero-headline animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Ride the Future.<br />
            <span className="hero-highlight">Adventure</span>
            <span className="hero-highlight-alt"> Awaits.</span>
          </h1>

          <p className="hero-sub animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Discover {totalProducts}+ premium bikes, components & accessories from AdventureWorks.
            Built for performance. Designed for the road ahead.
          </p>

          <div className="hero-actions animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/products" className="btn-primary-glow hero-btn">
              <span className="material-icons">pedal_bike</span>
              Browse Collection
            </Link>
            {isLoggedIn ? (
              <Link to="/orders" className="btn-secondary-glass hero-btn">
                <span className="material-icons">receipt_long</span>
                My Orders
              </Link>
            ) : (
              <Link to="/login" className="btn-secondary-glass hero-btn">
                <span className="material-icons">login</span>
                Get Started
              </Link>
            )}
          </div>

          <div className="hero-stats animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="hero-stat">
              <div className="hero-stat-value">{totalProducts}+</div>
              <div className="hero-stat-label">Products</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-value">{totalCategories}</div>
              <div className="hero-stat-label">Categories</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-value">4.9★</div>
              <div className="hero-stat-label">Avg. Rating</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-value">24/7</div>
              <div className="hero-stat-label">Support</div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-dot"></div>
        </div>
      </section>

      {/* =============== CATEGORY PILLS =============== */}
      <section className="categories-section">
        <div className="section-wrap">
          <div className="categories-row">
            <button className={`cat-pill ${selectedCategory === 1 ? 'active' : ''}`} onClick={() => handleCategoryChange(1)}>
              <span className="material-icons">pedal_bike</span> Bikes
            </button>
            <button className={`cat-pill ${selectedCategory === 2 ? 'active' : ''}`} onClick={() => handleCategoryChange(2)}>
              <span className="material-icons">build</span> Components
            </button>
            <button className={`cat-pill ${selectedCategory === 3 ? 'active' : ''}`} onClick={() => handleCategoryChange(3)}>
              <span className="material-icons">sports_motorsports</span> Clothing
            </button>
            <button className={`cat-pill ${selectedCategory === 4 ? 'active' : ''}`} onClick={() => handleCategoryChange(4)}>
              <span className="material-icons">backpack</span> Accessories
            </button>
          </div>
        </div>
      </section>

      {/* =============== FEATURES SECTION =============== */}
      <section className="features-section">
        <div className="section-wrap">
          <div className="section-header">
            <div className="aw-badge">
              <span className="material-icons" style={{ fontSize: '12px' }}>auto_awesome</span>
              Why AdventureWorks
            </div>
            <h2 className="section-title">Built for riders who <span className="text-gradient">demand more</span></h2>
            <p className="section-subtitle">
              Real adventure data, real product lines — powered by the industry-standard AdventureWorks2019 dataset.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card gradient-border animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon-wrap" style={{ background: f.gradient }}>
                  <span className="material-icons feature-icon">{f.icon}</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-footer">
                  <span className="feature-tag">{f.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== TOP PRODUCTS SECTION =============== */}
      <section className="products-section">
        <div className="section-wrap">
          <div className="section-header-row">
            <div>
              <div className="aw-badge aw-badge-cyan">
                <span className="material-icons" style={{ fontSize: '12px' }}>local_fire_department</span>
                Featured Picks
              </div>
              <h2 className="section-title" style={{ marginTop: '0.5rem' }}>Top Products</h2>
            </div>
            <Link className="btn-secondary-glass" to="/products">
              View all <span className="material-icons" style={{ fontSize: '16px' }}>arrow_forward</span>
            </Link>
          </div>

          {loading && (
            <div className="products-grid">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aw-product-card skeleton-card">
                  <div className="skeleton" style={{ height: '200px', borderRadius: '12px 12px 0 0' }}></div>
                  <div style={{ padding: '1rem' }}>
                    <div className="skeleton" style={{ height: '16px', width: '70%', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '12px' }}></div>
                    <div className="skeleton" style={{ height: '14px', width: '30%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="error-state">
              <span className="material-icons" style={{ fontSize: '2rem', color: '#f87171' }}>error_outline</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="products-grid">
              {filteredTop.map((p) => {
                const imgUrl = CatalogService.imgUrl(p.imageFileName);
                return (
                  <div key={p.id} className="aw-product-card">
                    <div className="product-img-wrap">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.name} className="product-img" />
                      ) : (
                        <div className="product-placeholder">{p.name}</div>
                      )}
                      <div className="product-img-overlay"></div>
                      <div className="product-badges-overlay">
                        <span className="aw-badge aw-badge-cyan">{p.subCategoryName}</span>
                      </div>
                      <button 
                        className="quick-add-btn" 
                        onClick={() => addToCart(p)} 
                        title={p.stockQty <= 0 ? 'Out of stock' : 'Quick add to cart'} 
                        disabled={p.stockQty <= 0}
                      >
                        <span className="material-icons">add_shopping_cart</span>
                      </button>
                    </div>

                    <div className="product-content">
                      <div className="product-meta">
                        <span className="category-tag">{p.categoryName}</span>
                      </div>
                      <h3 className="product-name">{p.name}</h3>
                      {p.description && (
                        <p className="product-desc">
                          {p.description.slice(0, 80)}{p.description.length > 80 ? '...' : ''}
                        </p>
                      )}

                      <div className="product-footer">
                        <div className="product-price">
                          <span className="price-currency">$</span>{p.price.toFixed(2)}
                        </div>
                        <div className="product-actions">
                          <Link className="btn-secondary-glass btn-sm" to={`/products/${p.id}`}>Details</Link>
                          <button 
                            className="btn-primary-glow btn-sm" 
                            onClick={() => addToCart(p)} 
                            disabled={p.stockQty <= 0} 
                            title={p.stockQty <= 0 ? 'Out of stock' : ''}
                          >
                            <span className="material-icons" style={{ fontSize: '15px' }}>add</span> Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =============== DATA MODULES SECTION =============== */}
      <section className="modules-section">
        <div className="section-wrap">
          <div className="section-header">
            <div className="aw-badge">
              <span className="material-icons" style={{ fontSize: '12px' }}>storage</span>
              Data Catalog
            </div>
            <h2 className="section-title">The AdventureWorks <span className="text-gradient">Dataset</span></h2>
            <p className="section-subtitle">
              A complete business story: a bike company with product lines, inventory, customers, regions, and order history.
            </p>
          </div>

          <div className="modules-grid">
            {modules.map((m, i) => (
              <div key={i} className="module-card gradient-border">
                <div className="module-icon-wrap">
                  <span className="material-icons">{m.icon}</span>
                </div>
                <h3 className="module-title">{m.title}</h3>
                <p className="module-desc">{m.desc}</p>
                <ul className="module-bullets">
                  {m.bullets.map((b, idx) => (
                    <li key={idx}>
                      <span className="material-icons" style={{ fontSize: '14px', color: '#6366f1' }}>check_circle</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============== CTA SECTION =============== */}
      <section className="cta-section">
        <div className="section-wrap">
          <div className="cta-card gradient-border">
            <div className="cta-orb-left"></div>
            <div className="cta-orb-right"></div>
            <div className="cta-content">
              <div className="aw-badge" style={{ marginBottom: '1.25rem' }}>
                <span className="material-icons" style={{ fontSize: '12px' }}>shopping_cart</span>
                Start Shopping
              </div>
              <h2 className="cta-title">Ready to ride?</h2>
              <p className="cta-desc">
                Browse our full collection of {totalProducts}+ products. From performance road bikes to essential accessories.
              </p>
              <div className="cta-actions">
                <Link className="btn-primary-glow" to="/products">
                  <span className="material-icons">pedal_bike</span>
                  Shop Now
                </Link>
                {!isLoggedIn && (
                  <Link className="btn-cyan-glow" to="/login">
                    <span className="material-icons">login</span>
                    Create Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
