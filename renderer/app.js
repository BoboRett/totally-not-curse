import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import NavMenu from './nav-menu/nav-menu';
import { setPaths } from './store/wow-client';
import './app.less';

const App = ({ setPaths }) => {
    useEffect(() => {
        api.findWow().then(setPaths);
    }, []);

    return (
        <>
            <NavMenu />
        </>
    );
};

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ setPaths }, dispatch);
}

App.propTypes = {
    setPaths: PropTypes.func
};

export default connect(null, mapDispatchToProps)(App);
