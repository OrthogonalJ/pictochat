import * as React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.less';

export default (props: {}) => (
  <nav id="navbar">
    <div className="title">
      Pictochat
      <span className="nav-links-container">
        <Link to="/threads">Threads</Link>
        <Link to="/leaderboard">Leaderboard</Link>
      </span>
    </div>
  </nav>
);
