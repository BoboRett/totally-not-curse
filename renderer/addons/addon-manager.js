import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

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
            minHeight: 65,
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

const AddonRow = ({ addon, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const onToggleOpen = useCallback(() => {
        setIsOpen(currentOpen => !currentOpen);
    }, []);
    const onStatusClick = useCallback(event => {
        event.stopPropagation();
        onUpdate(addon);
    }, [addon, onUpdate]);
    return (
        <>
            <CSSTransition in={!isOpen} timeout={200}>
                <div className="addon-row" key={addon.id} data-type={addon.type} onClick={onToggleOpen}>
                    <span className="addon-row__status"><AddonStatus addon={addon} onClick={onStatusClick} /></span>
                    <span className="addon-row__title">{ addon.name }</span>
                    <span className="addon-row__version" title={addon.version}>{ addon.version }</span>
                    <span className="addon-row__authors">{ _.map(addon.authors, 'name').join(' ') }</span>
                </div>
            </CSSTransition>
            <CSSTransition in={isOpen} timeout={200} mountOnEnter>
                <div className="addon-large-row" key={addon.id} data-type={addon.type}>
                    <h1 onClick={onToggleOpen}>{ addon.name } - { addon.version }</h1>
                    <span>{ _.map(addon.authors, 'name').join(' ') }</span>
                    <span className="addon-large-row__close" onClick={onToggleOpen}>{'\uf106'}</span>
                </div>
            </CSSTransition>
        </>
    );
};

const AddonManager = ({ addons, appMain, setAddons, setAddon, wowPath }) => {
    const sortedAddons = useMemo(() => {
        return _.orderBy(addons, [addon => addon.status === 0, 'name']);
    }, [addons]);
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
            <div className="addon-manager__table">
                <div className="addon-manager__table-head">
                    <span>Status</span>
                    <span>Name</span>
                    <span>Version</span>
                    <span>Authors</span>
                </div>
                { _.map(sortedAddons, addon => (
                    <AddonRow
                        key={addon.id}
                        addon={addon}
                        onUpdate={updateAddon}
                    />
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
    return bindActionCreators({ setAddons, setAddon }, dispatch);
}

AddonRow.propTypes = {
    addon: PropTypes.object,
    onUpdate: PropTypes.func
};

AddonManager.propTypes = {
    addons: PropTypes.arrayOf(PropTypes.object),
    appMain: PropTypes.object,
    setAddons: PropTypes.func,
    setAddon: PropTypes.func,
    wowPath: PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(AddonManager);
