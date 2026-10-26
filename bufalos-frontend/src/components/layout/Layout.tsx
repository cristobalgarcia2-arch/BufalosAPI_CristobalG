import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-night-900 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Enlace de accesibilidad para saltar al contenido principal (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-950 focus:font-extrabold focus:rounded-lg focus:outline-2 focus:outline-white focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-hidden">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
