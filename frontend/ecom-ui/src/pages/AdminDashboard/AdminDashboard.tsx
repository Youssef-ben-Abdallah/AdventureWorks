import React, { useState, useEffect } from 'react';
import { CatalogService } from '../../services/catalog';
import { OrdersService } from '../../services/orders';
import { Category, SubCategory, Product, Order } from '../../types/models';
import { OrderTicketModal } from '../../components/orders/OrderTicketModal';
import './AdminDashboard.css';

const STATUSES = [
  { id: 0, label: 'Pending', icon: 'schedule' },
  { id: 1, label: 'Paid', icon: 'paid' },
  { id: 2, label: 'Processing', icon: 'autorenew' },
  { id: 3, label: 'Shipped', icon: 'local_shipping' },
  { id: 4, label: 'Delivered', icon: 'check_circle' },
  { id: 5, label: 'Cancelled', icon: 'cancel' },
];

type ModalField = { name: string; label: string; type: 'text'|'number'|'select'; options?: {value: string|number, label: string}[] | ((vals: any) => {value: string|number, label: string}[]); disabled?: boolean | ((vals: any) => boolean); };
type ModalConfig = { isOpen: boolean; title: string; fields: ModalField[]; initial: any; onSubmit: (val: any) => Promise<void>; isDelete?: boolean };

export const AdminDashboard = () => {
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, title: '', fields: [], initial: {}, onSubmit: async () => {} });
  const [modalVals, setModalVals] = useState<any>({});
  const [modalSaving, setModalSaving] = useState(false);

  const openModal = (title: string, fields: ModalField[], initial: any, onSubmit: (val: any) => Promise<void>, isDelete = false) => {
    setModal({ isOpen: true, title, fields, initial, onSubmit, isDelete });
    setModalVals(initial);
  };
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Order | null>(null);

  // Search Filters
  const [catFilter, setCatFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [prodFilter, setProdFilter] = useState('');

  useEffect(() => {
    reloadAll();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.isOpen) {
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modal.isOpen]);

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
  const handleNewCategory = () => openModal('New Category', [{ name: 'name', label: 'Name', type: 'text' }], { name: '' }, async (v) => { await CatalogService.createCategory(v.name); reloadAll(); });
  const handleEditCategory = (c: Category) => openModal('Edit Category', [{ name: 'name', label: 'Name', type: 'text' }], { name: c.name }, async (v) => { await CatalogService.updateCategory(c.id, v.name); reloadAll(); });
  const handleDeleteCategory = (c: Category) => openModal('Delete Category', [], {}, async () => { await CatalogService.deleteCategory(c.id); reloadAll(); }, true);

  // ---- SubCategories ----
  const handleNewSubCategory = () => {
    const opts = categories.map(c => ({ value: c.id, label: c.name }));
    openModal('New Sub-category', [{ name: 'name', label: 'Name', type: 'text' }, { name: 'categoryId', label: 'Category', type: 'select', options: opts }], { name: '', categoryId: categories[0]?.id || '' }, async (v) => { await CatalogService.createSubCategory(v.name, Number(v.categoryId)); reloadAll(); });
  };
  const handleEditSubCategory = (s: SubCategory) => {
    const opts = categories.map(c => ({ value: c.id, label: c.name }));
    openModal('Edit Sub-category', [{ name: 'name', label: 'Name', type: 'text' }, { name: 'categoryId', label: 'Category', type: 'select', options: opts }], { name: s.name, categoryId: s.categoryId }, async (v) => { await CatalogService.updateSubCategory(s.id, v.name, Number(v.categoryId)); reloadAll(); });
  };
  const handleDeleteSubCategory = (s: SubCategory) => openModal('Delete Sub-category', [], {}, async () => { await CatalogService.deleteSubCategory(s.id); reloadAll(); }, true);

  // ---- Products ----
  const handleNewProduct = () => {
    const catOpts = [{ value: '', label: 'Select a category...' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
    const subOptsFn = (vals: any) => {
      if (!vals.categoryId) return [{ value: '', label: 'Select category first...' }];
      return [{ value: '', label: 'Select a sub-category...' }, ...subCategories.filter(s => s.categoryId === Number(vals.categoryId)).map(c => ({ value: c.id, label: c.name }))];
    };
    openModal('New Product', [
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'price', label: 'Price', type: 'number' },
      { name: 'stockQty', label: 'Stock', type: 'number' },
      { name: 'categoryId', label: 'Category', type: 'select', options: catOpts },
      { name: 'subCategoryId', label: 'Sub-category', type: 'select', options: subOptsFn, disabled: (v) => !v.categoryId }
    ], { sku: '', name: '', price: 0, stockQty: 0, categoryId: '', subCategoryId: '' }, async (v) => {
      await CatalogService.createProduct({ ...v, price: Number(v.price), stockQty: Number(v.stockQty), categoryId: Number(v.categoryId), subCategoryId: Number(v.subCategoryId) }); reloadAll();
    });
  };
  const handleEditProduct = (p: Product) => {
    const catOpts = [{ value: '', label: 'Select a category...' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
    const subOptsFn = (vals: any) => {
      if (!vals.categoryId) return [{ value: '', label: 'Select category first...' }];
      return [{ value: '', label: 'Select a sub-category...' }, ...subCategories.filter(s => s.categoryId === Number(vals.categoryId)).map(c => ({ value: c.id, label: c.name }))];
    };
    openModal('Edit Product', [
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'price', label: 'Price', type: 'number' },
      { name: 'stockQty', label: 'Stock', type: 'number' },
      { name: 'categoryId', label: 'Category', type: 'select', options: catOpts },
      { name: 'subCategoryId', label: 'Sub-category', type: 'select', options: subOptsFn, disabled: (v) => !v.categoryId }
    ], { sku: p.sku, name: p.name, price: p.price, stockQty: p.stockQty, categoryId: p.categoryId, subCategoryId: p.subCategoryId }, async (v) => {
      await CatalogService.updateProduct(p.id, { ...v, price: Number(v.price), stockQty: Number(v.stockQty), categoryId: Number(v.categoryId), subCategoryId: Number(v.subCategoryId) }); reloadAll();
    });
  };
  const handleDeleteProduct = (p: Product) => openModal('Delete Product', [], {}, async () => { await CatalogService.deleteProduct(p.id); reloadAll(); }, true);

  // ---- Orders ----
  const handleOrderStatus = async (o: Order, newStatus: number) => {
    try {
      await OrdersService.updateStatus(o.id, newStatus);
      reloadAll();
    } catch (e: any) { setError(e.message); }
  };

  const handleDeleteOrder = (o: Order) => openModal('Delete Order', [], {}, async () => { 
    await OrdersService.deleteOrder(o.id); 
    reloadAll(); 
    if (selectedTicket?.id === o.id) setSelectedTicket(null);
  }, true);

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

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || id;
  const getSubCategoryName = (id: number) => subCategories.find(s => s.id === id)?.name || id;

  // Filtered lists
  const filteredCats = categories.filter(c => c.name.toLowerCase().includes(catFilter.toLowerCase()));
  const filteredSubs = subCategories.filter(s => s.name.toLowerCase().includes(subFilter.toLowerCase()));
  const filteredProds = products.filter(p => p.name.toLowerCase().includes(prodFilter.toLowerCase()) || p.sku?.toLowerCase().includes(prodFilter.toLowerCase()));

  return (
    <div className="admin-page">
      <div className="aw-page-header with-inner">
        <div className="aw-page-header-inner">
          <div>
            <div className="aw-badge" style={{ marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '12px' }}>admin_panel_settings</span>
              Store Management
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
      </div>

      <div className="admin-body aw-page-content">
        {loading && <div className="admin-loading"><span className="material-icons rotating">sync</span> Loading data...</div>}
        {error && <div className="admin-error"><span className="material-icons">error_outline</span> {error}</div>}

        <div className="admin-tabs">
          {['Categories', 'Sub-categories', 'Products', 'Orders'].map((name, i) => {
            const icons = ['category', 'account_tree', 'pedal_bike', 'receipt_long'];
            const testIds = ['admin-tab-categories', 'admin-tab-subcategories', 'admin-tab-products', 'admin-tab-orders'];
            return (
              <button key={i} data-testid={testIds[i]} className={`admin-tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
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
              <h3 data-testid="admin-categories-title" className="admin-card-title"><span className="material-icons">category</span> Categories</h3>
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
              <h3 data-testid="admin-subcategories-title" className="admin-card-title"><span className="material-icons">account_tree</span> Sub-categories</h3>
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
                <thead><tr><th>Name</th><th>Category</th><th></th></tr></thead>
                <tbody>
                  {filteredSubs.map(s => (
                    <tr key={s.id}>
                      <td className="name-cell">{s.name}</td>
                      <td>{getCategoryName(s.categoryId)}</td>
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
              <h3 data-testid="admin-products-title" className="admin-card-title"><span className="material-icons">pedal_bike</span> Products</h3>
              <button className="btn-primary-glow" onClick={handleNewProduct}><span className="material-icons">add</span> New Product</button>
            </div>
            <div className="admin-filters">
              <div className="admin-search-wrap">
                <span className="material-icons admin-search-icon">search</span>
                <input className="aw-input admin-search" value={prodFilter} onChange={e => setProdFilter(e.target.value)} placeholder="SKU / Name..." />
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Sub-category</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Stock</th><th></th></tr></thead>
                <tbody>
                  {filteredProds.map(p => (
                    <tr key={p.id}>
                      <td className="mono">{p.sku}</td>
                      <td className="name-cell">{p.name}</td>
                      <td>{getCategoryName(p.categoryId)}</td>
                      <td>{getSubCategoryName(p.subCategoryId)}</td>
                      <td className="price-cell" style={{ textAlign: 'right' }}>{fmtMoney(p.price)}</td>
                      <td className={`stock-cell ${p.stockQty > 50 ? 'stock-high' : p.stockQty > 0 ? 'stock-low' : 'stock-zero'}`} style={{ textAlign: 'right' }}>{p.stockQty}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="tbl-btn" onClick={() => handleEditProduct(p)}><span className="material-icons">edit</span> Edit</button>
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
                          <button className="tbl-btn" style={{ marginLeft: '8px' }} onClick={() => setSelectedTicket(o)}>
                            <span className="material-icons">receipt_long</span> Ticket
                          </button>
                          <button className="tbl-btn tbl-btn-danger" style={{ marginLeft: '8px' }} onClick={() => handleDeleteOrder(o)}>
                            <span className="material-icons">delete</span> Del
                          </button>
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

      {modal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setModal({...modal, isOpen: false})}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">{modal.title}</div>
            <div className="admin-modal-body">
              {modal.isDelete ? (
                <p>Are you sure you want to perform this deletion? This action cannot be undone.</p>
              ) : (
                modal.fields.map(f => (
                  <div key={f.name} className="filter-item" style={{ textAlign: 'left' }}>
                    <label>{f.label}</label>
                    {f.type === 'select' ? (
                      <select 
                        className="aw-select" 
                        value={modalVals[f.name]} 
                        onChange={e => {
                          const updated = {...modalVals, [f.name]: e.target.value};
                          // Auto-clear subcategory if category changes
                          if (f.name === 'categoryId') updated.subCategoryId = '';
                          setModalVals(updated);
                        }}
                        disabled={typeof f.disabled === 'function' ? f.disabled(modalVals) : f.disabled}
                      >
                        {(typeof f.options === 'function' ? f.options(modalVals) : f.options)?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={f.type} 
                        className="aw-input" 
                        value={modalVals[f.name]} 
                        onChange={e => setModalVals({...modalVals, [f.name]: e.target.value})} 
                      />
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="admin-modal-actions">
              <button className="btn-secondary-glass" onClick={() => setModal({...modal, isOpen: false})} disabled={modalSaving}>Cancel</button>
              <button className="btn-primary-glow" onClick={async () => {
                setModalSaving(true);
                try {
                  await modal.onSubmit(modalVals);
                  setModal({...modal, isOpen: false});
                } catch(e:any) { setError(e.message); }
                finally { setModalSaving(false); }
              }} disabled={modalSaving}>
                {modalSaving ? <span className="material-icons rotating">sync</span> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      <OrderTicketModal 
        isOpen={selectedTicket !== null} 
        order={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        isAdmin={true} 
        onDelete={handleDeleteOrder}
      />
    </div>
  );
};
