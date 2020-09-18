import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback } from 'react';

import { setAddons } from '../store/addons';
import { ADDON_STATUS } from '../../utils/constants';
import './addon-manager.less';

const AddonManager = ({ addons, setAddons, wowPath }) => {
    const resync = useCallback(refresh => {
        api.getInstalledAddons(wowPath, refresh).then(setAddons);
    }, [wowPath]);
    const checkForUpdate = useCallback(() => {
        api.checkForUpdates().then(setAddons);
    });

    useEffect(() => {
        if(wowPath && addons.length === 0) {
            resync();
        }
    }, [wowPath]);

    return (
        <div className="addon-manager">
            <div className="addon-manager__commands">
                <button id="resync" onClick={ev => ev.shiftKey ? resync(true) : checkForUpdate()}>Check for updates</button>
            </div>
            <div className="addon-manager__table">
                <div className="addon-manager__header">
                    <span>Status</span>
                    <span>Name</span>
                    <span>Authors</span>
                </div>
                { _.map(addons, addon => (
                    <div className="addon-row" key={addon.id} data-type={addon.type}>
                        <span className="addon-row__status" data-status={addon.status || ADDON_STATUS.OK} />
                        <span className="addon-row__title">{ addon.name }</span>
                        <span className="addon-row__authors">{ _.map(addon.authors, 'name').join(' ') }</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const mapStateToProps = state => ({
    addons: state.addons,
    wowPath: state.wowClient.paths[state.wowClient.version]
});

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ setAddons }, dispatch);
}

AddonManager.propTypes = {
    addons: PropTypes.arrayOf(PropTypes.object),
    setAddons: PropTypes.func,
    wowPath: PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(AddonManager);
