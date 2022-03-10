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
                <div className={`nav-menu__sub-menu ${match ? 'active' : ''}`} style={{ height: match ? 60 : 0 }}>
                    <NavLink exact to="/addons">Manage</NavLink>
                    <NavLink to="/addons/get">Get</NavLink>
                </div>
            )} />
            <div className="nav-menu__spacer" />
            <Route path="/settings" children={({ match }) => (
                <div className={`nav-menu__sub-menu ${match ? 'active' : ''}`} style={{ height: match ? 30 : 0 }}>
                    <NavLink exact to="/settings">App</NavLink>
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
