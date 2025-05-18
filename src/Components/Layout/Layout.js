import React from 'react';
import NavBar from '../Navbar/Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container container">
      <NavBar />
      <main className="layout-content mt-3 animate__animated animate__fadeIn">
        {children}
      </main>
      <footer className="layout-footer">
        © {new Date().getFullYear()} Vampire League Football. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Layout;