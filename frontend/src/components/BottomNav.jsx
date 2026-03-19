import React from 'react';
import { Home, FileQuestion, Bookmark, User } from 'lucide-react';

const BottomNav = ({ activeView, onChangeView }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'faq', label: 'FAQ', icon: FileQuestion },
    { id: 'topics', label: 'Topics', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: User }
  ];

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onChangeView(item.id)}
            data-testid={`nav-${item.id}`}
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
