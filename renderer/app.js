import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import AddonInstaller from './addons/addon-installer';
import AddonManager from './addons/addon-manager';
import AppSettings from './settings/app-settings';
import ErrorDialog from './error-dialog/error-dialog';
import NavMenu from './nav-menu/nav-menu';
import ProgressBar from './progress-bar/progress-bar';
import { setAddons } from './store/addons';
import { setPaths } from './store/wow-client';
import './app.less';
import { Switch, Route } from 'react-router-dom';

const App = ({ setAddons, setPaths }) => {
    useEffect(() => {
        api.findWow().then(wowPaths => {
            setPaths(wowPaths);
            api.addons.getInstalledAddons(wowPaths.wow_retail).then(setAddons);
        });
    }, []);

    const appMain = useRef(null);

    return (
        <>
            <div className="app">
                <NavMenu />
                <div ref={appMain} className="app__main">
                <Switch>
                    <Route exact path="/addons">
                        <AddonManager appMain={appMain} />
                    </Route>
                    <Route exact path="/addons/get">
                        <AddonInstaller />
                    </Route>
                    <Route exact path="/settings">
                        <AppSettings />
                    </Route>
                </Switch>
                </div>
            </div>
            <ProgressBar />
            <ErrorDialog />
        </>
    );
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ setAddons, setPaths }, dispatch);
};

App.propTypes = {
    setAddons: PropTypes.func,
    setPaths: PropTypes.func
};

export default connect(null, mapDispatchToProps)(App);
