import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback, useRef } from 'react';

import { setAddons } from '../store/addons';
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

const AddonManager = ({ addons, setAddons, wowPath }) => {
    const resync = useCallback(refresh => {
        api.getInstalledAddons(wowPath, refresh).then(setAddons);
    }, [wowPath]);
    const checkForUpdate = useCallback(() => {
        api.checkForUpdates().then(setAddons);
    });

    const root = useRef(null);

    useEffect(() => {
        if(wowPath && addons.length === 0) {
            resync();
        }
    }, [wowPath]);

    return (
        <div ref={root} className="addon-manager">
            <Transitioner scrollParent={root} stops={headerStops}>
                {styles => (
                    <div className="addon-manager__header" style={styles.main}>
                        <div className="addon-manager__controls" style={styles.controls}>
                            <button
                                id="resync"
                                style={styles.button}
                                onClick={ev => ev.shiftKey ? resync(true) : checkForUpdate()}
                            />
                            <button
                                id="download-all"
                                style={styles.button}
                            />
                        </div>
                        <span
                            className="addon-manager__count"
                            style={styles.count}
                        >{ addons.length }</span>
                        <div className="addon-manager__table-header">
                            <span>Status</span>
                            <span>Name</span>
                            <span>Authors</span>
                        </div>
                    </div>
                )}
            </Transitioner>
            <div className="addon-manager__table">
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
