import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home/Home';
import { Products } from './pages/Products/Products';
import { ProductDetails } from './pages/ProductDetails/ProductDetails';
import { Login } from './pages/Login/Login';
import { Cart } from './pages/Cart/Cart';
import { MyOrders } from './pages/MyOrders/MyOrders';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { CubeInsights } from './pages/CubeInsights/CubeInsights';
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotFound } from './pages/NotFound/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="login" element={<Login />} />
          
          {/* Protected user routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<Cart />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cube-insights" element={<CubeInsights />} />
          </Route>

          {/* Protected admin route */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
