/* eslint-disable react/no-children-prop */
import { connect } from 'react-redux';
import { NavLink, Route } from "react-router-dom";
import PropTypes from 'prop-types';
import React from 'react';

import './nav-menu.less';

const NavMenu = ({ updateAvailable }) => {
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
            <NavLink to="/settings" className={updateAvailable ? 'notify' : ''}>Settings</NavLink>
        </div>
    );
};

const mapStateToProps = state => ({
    updateAvailable: state.app.updateAvailable
});

NavMenu.propTypes = {
    updateAvailable: PropTypes.bool
};

export default connect(mapStateToProps)(NavMenu);
