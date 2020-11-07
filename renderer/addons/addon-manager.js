import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback } from 'react';

import AddonStatus from './addon-status-icon';
import { setAddons, setAddon } from '../store/addons';
import { ADDON_STATUS } from '../../utils/constants';
import './addon-manager.less';
import Transitioner from '../transitioner/transitioner';

const headerStops = {
    0: {
        main: {
            minHeight: 164,
            background: 'linear-gradient(-45deg, rgb(33, 33, 33), rgb(8, 14, 12)) fixed'
        },
        controls: {
            left: 10
        },
        count: {
            opacity: 1
        }
    },
    100: {
        main: {
            minHeight: 64,
            background: 'linear-gradient(-45deg, rgb(27, 27, 27), rgb(7, 12, 11)) fixed'
        },
        controls: {
            left: 2
        },
        count: {
            opacity: 0
        }
    }
};

const AddonManager = ({ addons, appMain, setAddons, setAddon, wowPath }) => {
    const resync = useCallback(refresh => {
        api.addons.getInstalledAddons(wowPath, refresh).then(setAddons);
    }, [wowPath]);
    const checkForUpdate = useCallback(() => {
        api.addons.checkForAddonUpdates().then(setAddons);
    });

    const updateAddon = useCallback(addon => {
        api.addons.updateAddon(addon, wowPath)
            .on('update', payload => setAddon(addon.id, payload))
        ;
    });
    const updateAll = () => {
        _.forEach(addons, addon => addon.status === ADDON_STATUS.UPDATE_AVAIL ? updateAddon(addon) : null);
    };

    useEffect(() => {
        if(wowPath && addons.length === 0) {
            resync();
        }
    }, [wowPath]);

    return (
        <div className="addon-manager">
            <Transitioner scrollParent={appMain} stops={headerStops}>
                {(styles, alpha) => (
                    <div className={`addon-manager__header ${alpha >= 1 ? 'addon-manager__header_collapsed' : ''}`} style={styles.main}>
                        <div className="addon-manager__controls" style={styles.controls}>
                            <button id="resync" onClick={ev => ev.shiftKey ? resync(true) : checkForUpdate()}>
                                { alpha < 1 && 'Check for updates' }
                            </button>
                            <button id="download-all" onClick={updateAll}>
                                { alpha < 1 && 'Update all' }
                            </button>
                        </div>
                        <span
                            className="addon-manager__count"
                            style={styles.count}
                        >{ addons.length }</span>
                    </div>
                )}
            </Transitioner>
            <table className="addon-manager__table">
                <colgroup>
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '80%' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Authors</th>
                    </tr>
                </thead>
                <tbody>
                    { _.map(addons, addon => (
                        <tr className="addon-row" key={addon.id} data-type={addon.type}>
                            <td><AddonStatus addon={addon} onClick={() => updateAddon(addon)} /></td>
                            <td className="addon-row__title">{ addon.name }</td>
                            <td className="addon-row__version" title={addon.version}>{ addon.version }</td>
                            <td className="addon-row__authors">{ _.map(addon.authors, 'name').join(' ') }</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const mapStateToProps = state => ({
    addons: state.addons,
    wowPath: state.wowClient.paths[state.wowClient.version]
});

function mapDispatchToProps(dispatch) {
    return bindActionCreators({ setAddons, setAddon }, dispatch);
}

AddonManager.propTypes = {
    addons: PropTypes.arrayOf(PropTypes.object),
    appMain: PropTypes.object,
    setAddons: PropTypes.func,
    setAddon: PropTypes.func,
    wowPath: PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(AddonManager);
