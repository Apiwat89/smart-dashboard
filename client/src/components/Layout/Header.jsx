import React from 'react';
import { Search, Bell } from 'lucide-react';

const Header = ({ user }) => (
  <header className="header">
     <div className="search-bar">
        <Search size={18} color="#999" />
        <input type="text" placeholder="Search..." />
     </div>
     <div className="user-profile">
        <Bell size={20} color="#666" />
        {user && <><img src={user.avatar} className="avatar" alt="user" /><span>{user.name}</span></>}
     </div>
  </header>
);
export default Header;