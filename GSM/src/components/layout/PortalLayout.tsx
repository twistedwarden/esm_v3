import React from 'react';
import { useLocation } from 'react-router-dom';
import { PortalNavbar } from './PortalNavbar';
import { Footer } from './Footer';
import { Chatbot } from '../ai/Chatbot';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Don't show footer on scholarship dashboard
  const shouldShowFooter = !location.pathname.includes('/scholarship-dashboard');
  
  return (
    <div className="min-h-screen flex flex-col">
      <PortalNavbar />
      <main className="flex-1">
        {children}
      </main>
      {shouldShowFooter && <Footer />}
      <Chatbot />
    </div>
  );
};
