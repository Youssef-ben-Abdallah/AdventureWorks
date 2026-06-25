import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="page" style={{ paddingTop: '72px' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
