import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import { setPath } from '../../store/wow-client';

const AppDirectories = ({ paths, setPath }) => {
    const  browse = useCallback(client => {
        return api.window.browseOpen({
            title: 'WoW retail directory',
            defaultPath: _.get(paths, client),
            properties: ['openDirectory']
        }).then(result => {
            if(result.canceled) {
                return;
            } else {
                setPath(client, result.filePaths[0]);
            }
        });
    }, [paths]);

    return (
        <div className="app-directories">
            <h2 className="app-settings__heading">Directories</h2>
            <label className="app-settings__entry">
                <span className="app-settings__entry-heading">Retail</span>
                <span className="app-settings__entry-value_text">{ _.get(paths, 'wow_retail', 'Not found') }</span>
                <button
                    className="app-settings__entry-value_button app-settings__entry-value_button-inline"
                    onClick={() => browse('wow_retail')}
                >
                    Browse...
                </button>
            </label>
        </div>
    );
};

const mapStateToProps = state => ({
    paths: state.wowClient.paths
});


const mapDispatchToProps = dispatch => {
    return bindActionCreators({ setPath }, dispatch);
};

AppDirectories.propTypes = {
    paths: PropTypes.object,
    setPath: PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(AppDirectories);
