import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { setPaths } from './store/wow-client';
import './app.less';

const App = ({ setPaths }) => {
    useEffect(() => {
        api.findWow().then(setPaths);
    }, []);

    return (
        <>
            <h1>Boop</h1>
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
