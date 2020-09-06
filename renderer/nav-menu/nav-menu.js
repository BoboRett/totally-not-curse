/* eslint-disable react/no-children-prop */
import { NavLink, Route } from "react-router-dom";
import React from 'react';

import './nav-menu.less';

const NavMenu = () => {
    return (
        <div className="nav-menu">
            <NavLink to="/addons">Addons</NavLink>
            <Route path="/addons" children={({ match }) => (
                <div className={`nav-menu__sub-menu ${match ? 'active' : ''}`} style={{ height: match ? 90 : 0 }}>
                    <NavLink exact to="/addons">Manage</NavLink>
                    <NavLink to="/addons/get">Get</NavLink>
                    <NavLink to="/addons/backup">Backup</NavLink>
                </div>
            )} />
            <NavLink to="/was">WeakAuras</NavLink>
            <Route path="/was" children={({ match }) => (
                <div className={`nav-menu__sub-menu ${match ? 'active' : ''}`} style={{ height: match ? 60 : 0 }}>
                    <NavLink exact to="/was">Manage</NavLink>
                    <NavLink to="/was/get">Get</NavLink>
                </div>
            )} />
            <NavLink to="/logs">Logs</NavLink>
            <Route path="/logs" children={({ match }) => (
                <div className={`nav-menu__sub-menu ${match ? 'active' : ''}`} style={{ height: match ? 60 : 0 }}>
                    <NavLink exact to="/logs">Manage</NavLink>
                    <NavLink to="/logs/upload">Upload</NavLink>
                </div>
            )} />
            <div className="nav-menu__spacer" />
            <Route path="/settings" children={({ match }) => (
                <div className={`nav-menu__sub-menu ${match ? 'active' : ''}`} style={{ height: match ? 60 : 0 }}>
                    <NavLink exact to="/settings">App</NavLink>
                    <NavLink to="/settings/dirs">Directories</NavLink>
                </div>
            )} />
            <NavLink to="/settings">Settings</NavLink>
        </div>
    );
};

export default NavMenu;
