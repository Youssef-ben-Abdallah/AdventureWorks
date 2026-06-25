import React, { useState, useEffect } from 'react';
import { CatalogService } from '../../services/catalog';
import { OrdersService } from '../../services/orders';
import { Category, SubCategory, Product, Order } from '../../types/models';
import './AdminDashboard.css';

const STATUSES = [
  { id: 0, label: 'Pending', icon: 'schedule' },
  { id: 1, label: 'Paid', icon: 'paid' },
  { id: 2, label: 'Processing', icon: 'autorenew' },
  { id: 3, label: 'Shipped', icon: 'local_shipping' },
  { id: 4, label: 'Delivered', icon: 'check_circle' },
  { id: 5, label: 'Cancelled', icon: 'cancel' },
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Search Filters
  const [catFilter, setCatFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [prodFilter, setProdFilter] = useState('');

  useEffect(() => {
    reloadAll();
  }, []);

  const reloadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, subs, prods, ords] = await Promise.all([
        CatalogService.getCategories(),
        CatalogService.getSubCategories(),
        CatalogService.getProducts(),
        OrdersService.allOrders()
      ]);
      setCategories(cats || []);
      setSubCategories(subs || []);
      setProducts(prods || []);
      setOrders(ords || []);
    } catch (e: any) {
      setError(e?.response?.data || e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Categories ----
  const handleNewCategory = async () => {
    const name = window.prompt('Enter new category name:');
    if (!name) return;
    try {
      await CatalogService.createCategory(name);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };
  const handleEditCategory = async (c: Category) => {
    const name = window.prompt('Edit category name:', c.name);
    if (!name || name === c.name) return;
    try {
      await CatalogService.updateCategory(c.id, name);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };
  const handleDeleteCategory = async (c: Category) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await CatalogService.deleteCategory(c.id);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };

  // ---- SubCategories ----
  const handleNewSubCategory = async () => {
    const name = window.prompt('Enter new sub-category name:');
    if (!name) return;
    const catIdStr = window.prompt(`Enter category ID for "${name}":\n` + categories.map(c => `${c.id} - ${c.name}`).join('\n'));
    const catId = Number(catIdStr);
    if (!catId) return;
    try {
      await CatalogService.createSubCategory(name, catId);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };
  const handleEditSubCategory = async (s: SubCategory) => {
    const name = window.prompt('Edit sub-category name:', s.name);
    if (!name) return;
    const catIdStr = window.prompt(`Enter category ID for "${name}":\n` + categories.map(c => `${c.id} - ${c.name}`).join('\n'), String(s.categoryId));
    const catId = Number(catIdStr);
    if (!catId) return;
    try {
      await CatalogService.updateSubCategory(s.id, name, catId);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };
  const handleDeleteSubCategory = async (s: SubCategory) => {
    if (!window.confirm(`Delete sub-category "${s.name}"?`)) return;
    try {
      await CatalogService.deleteSubCategory(s.id);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };

  // ---- Products ----
  const handleDeleteProduct = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      await CatalogService.deleteProduct(p.id);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };

  // ---- Orders ----
  const handleOrderStatus = async (o: Order, newStatus: number) => {
    try {
      await OrdersService.updateStatus(o.id, newStatus);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };

  const getStatusBadge = (id: number) => {
    switch (id) {
      case 0: return 'badge-pending';
      case 1: return 'badge-paid';
      case 2: return 'badge-processing';
      case 3: return 'badge-shipped';
      case 4: return 'badge-delivered';
      case 5: return 'badge-cancelled';
      default: return '';
    }
  };

  const fmtMoney = (v: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v);

  // Filtered lists
  const filteredCats = categories.filter(c => c.name.toLowerCase().includes(catFilter.toLowerCase()));
  const filteredSubs = subCategories.filter(s => s.name.toLowerCase().includes(subFilter.toLowerCase()));
  const filteredProds = products.filter(p => p.name.toLowerCase().includes(prodFilter.toLowerCase()) || p.sku?.toLowerCase().includes(prodFilter.toLowerCase()));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <div className="aw-badge" style={{ marginBottom: '0.5rem' }}>
            <span className="material-icons" style={{ fontSize: '12px' }}>admin_panel_settings</span>
            Admin
          </div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage catalog, orders, and store settings.</p>
        </div>
        <div>
          <button className="btn-secondary-glass" onClick={reloadAll} disabled={loading}>
            <span className="material-icons" style={{ marginRight: '6px' }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-body">
        {loading && <div className="admin-loading"><span className="material-icons rotating">sync</span> Loading data...</div>}
        {error && <div className="admin-error"><span className="material-icons">error_outline</span> {error}</div>}

        <div className="admin-tabs">
          {['Categories', 'Sub-categories', 'Products', 'Orders'].map((name, i) => {
            const icons = ['category', 'account_tree', 'pedal_bike', 'receipt_long'];
            return (
              <button key={i} className={`admin-tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                <span className="material-icons">{icons[i]}</span>
                {name}
              </button>
            );
          })}
        </div>

        {/* CATEGORIES */}
        <div className={`admin-section ${activeTab === 0 ? 'visible' : ''}`}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3 className="admin-card-title"><span className="material-icons">category</span> Categories</h3>
              <button className="btn-primary-glow" onClick={handleNewCategory}><span className="material-icons">add</span> New</button>
            </div>
            <div className="admin-filters">
              <div className="admin-search-wrap">
                <span className="material-icons admin-search-icon">search</span>
                <input className="aw-input admin-search" value={catFilter} onChange={e => setCatFilter(e.target.value)} placeholder="Search..." />
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th></th></tr></thead>
                <tbody>
                  {filteredCats.map(c => (
                    <tr key={c.id}>
                      <td className="name-cell">{c.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tbl-btn" onClick={() => handleEditCategory(c)}><span className="material-icons">edit</span> Edit</button>
                        <button className="tbl-btn tbl-btn-danger" onClick={() => handleDeleteCategory(c)} style={{ marginLeft: '6px' }}><span className="material-icons">delete</span> Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SUB-CATEGORIES */}
        <div className={`admin-section ${activeTab === 1 ? 'visible' : ''}`}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3 className="admin-card-title"><span className="material-icons">account_tree</span> Sub-categories</h3>
              <button className="btn-primary-glow" onClick={handleNewSubCategory}><span className="material-icons">add</span> New</button>
            </div>
            <div className="admin-filters">
              <div className="admin-search-wrap">
                <span className="material-icons admin-search-icon">search</span>
                <input className="aw-input admin-search" value={subFilter} onChange={e => setSubFilter(e.target.value)} placeholder="Search..." />
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Category ID</th><th></th></tr></thead>
                <tbody>
                  {filteredSubs.map(s => (
                    <tr key={s.id}>
                      <td className="name-cell">{s.name}</td>
                      <td>{s.categoryId}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tbl-btn" onClick={() => handleEditSubCategory(s)}><span className="material-icons">edit</span> Edit</button>
                        <button className="tbl-btn tbl-btn-danger" onClick={() => handleDeleteSubCategory(s)} style={{ marginLeft: '6px' }}><span className="material-icons">delete</span> Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className={`admin-section ${activeTab === 2 ? 'visible' : ''}`}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3 className="admin-card-title"><span className="material-icons">pedal_bike</span> Products</h3>
              <button className="btn-primary-glow" onClick={() => window.alert('Use API directly or implement Product Dialog')}><span className="material-icons">add</span> New Product</button>
            </div>
            <div className="admin-filters">
              <div className="admin-search-wrap">
                <span className="material-icons admin-search-icon">search</span>
                <input className="aw-input admin-search" value={prodFilter} onChange={e => setProdFilter(e.target.value)} placeholder="SKU / Name..." />
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>SKU</th><th>Name</th><th>Category ID</th><th>Sub ID</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Stock</th><th></th></tr></thead>
                <tbody>
                  {filteredProds.map(p => (
                    <tr key={p.id}>
                      <td className="mono">{p.sku}</td>
                      <td className="name-cell">{p.name}</td>
                      <td>{p.categoryId}</td>
                      <td>{p.subCategoryId}</td>
                      <td className="price-cell" style={{ textAlign: 'right' }}>{fmtMoney(p.price)}</td>
                      <td className={`stock-cell ${p.stockQty > 50 ? 'stock-high' : p.stockQty > 0 ? 'stock-low' : 'stock-zero'}`} style={{ textAlign: 'right' }}>{p.stockQty}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tbl-btn" onClick={() => window.alert('Edit feature requires full product form.')}><span className="material-icons">edit</span> Edit</button>
                        <button className="tbl-btn tbl-btn-danger" onClick={() => handleDeleteProduct(p)} style={{ marginLeft: '6px' }}><span className="material-icons">delete</span> Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ORDERS */}
        <div className={`admin-section ${activeTab === 3 ? 'visible' : ''}`}>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3 className="admin-card-title"><span className="material-icons">receipt_long</span> All Orders</h3>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>#</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th><th>Change Status</th></tr></thead>
                <tbody>
                  {orders.map(o => {
                    const statusObj = STATUSES.find(s => s.id === o.status) || STATUSES[0];
                    return (
                      <tr key={o.id}>
                        <td className="mono">{o.id}</td>
                        <td>{new Date(o.createdAtUtc).toLocaleDateString()}</td>
                        <td>
                          <span className={`order-badge ${getStatusBadge(o.status)}`}>
                            <span className="material-icons">{statusObj.icon}</span> {statusObj.label}
                          </span>
                        </td>
                        <td className="price-cell" style={{ textAlign: 'right' }}>{fmtMoney(o.total)}</td>
                        <td>
                          <select className="aw-select admin-select" value={o.status} onChange={e => handleOrderStatus(o, Number(e.target.value))}>
                            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
