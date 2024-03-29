import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

import AddonStatus from './addon-status-icon';
import ConfirmButton from '../components/confirm-button';
import { removeAddon, setAddons, setAddon } from '../store/addons';
import { ADDON_STATUS, ADDON_TYPE } from '../../utils/constants';
import './addon-manager.less';

const AddonRow = ({ addon, onUpdate, onUninstall }) => {
    const [isOpen, setIsOpen] = useState(false);
    const onToggleOpen = useCallback(ev => {
        if(ev.target !== ev.currentTarget) return;
        setIsOpen(currentOpen => !currentOpen);
    }, []);
    const onStatusClick = useCallback(event => {
        event.stopPropagation();
        onUpdate(addon);
    }, [addon, onUpdate]);
    const onUninstallAddon = useCallback(event => {
        event.stopPropagation();
        onUninstall(addon);
    }, [addon, onUninstall]);
    return (
        <>
            <CSSTransition in={!isOpen} timeout={200}>
                <div className="addon-row" key={addon.id} data-type={addon.type} onClick={onToggleOpen}>
                    <span className="addon-row__status"><AddonStatus addon={addon} onClick={onStatusClick} /></span>
                    <span className="addon-row__title">{ addon.name }</span>
                    <span className="addon-row__version" title={addon.version}>{ addon.gameVersion }</span>
                    <span className="addon-row__authors">{ addon.authors.join(' ') }</span>
                </div>
            </CSSTransition>
            <CSSTransition in={isOpen} timeout={200} mountOnEnter>
                <div className="addon-large-row" key={addon.id} data-type={addon.type} onClick={onToggleOpen}>
                    <p className="addon-large-row__title" >{ addon.name } - { addon.gameVersion }</p>
                    <span>{ _.map(addon.authors, 'name').join(' ') }</span>
                    <div className="addon-large-row__actions">
                        <button className="addon-large-row__home" onClick={() => api.window.open(addon.url)}>
                            { addon.type === ADDON_TYPE.CUSTOM ? 'Folder' : 'Website' }
                        </button>
                        <ConfirmButton className="addon-large-row__remove" onClick={onUninstallAddon}>Uninstall</ConfirmButton>
                    </div>
                </div>
            </CSSTransition>
        </>
    );
};

const AddonManager = ({ addons, removeAddon, setAddons, setAddon, wowPath }) => {
    const sortedAddons = useMemo(() => {
        return _.orderBy(addons, [addon => addon.status > 0, 'name'], ['desc', 'asc']);
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
    const uninstallAddon = useCallback(addon => {
        api.addons.uninstallAddon(wowPath, addon)
            .then(() => removeAddon(addon))
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
            <div className="addon-manager__header">
                <div className="addon-manager__controls">
                    <button id="resync" onClick={ev => ev.shiftKey ? resync(true) : checkForUpdate()}>
                        Check for updates
                    </button>
                    <button id="download-all" onClick={updateAll}>
                        Update all
                    </button>
                </div>
            </div>
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
                        onUninstall={uninstallAddon}
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

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ removeAddon, setAddons, setAddon }, dispatch);
};

AddonRow.propTypes = {
    addon: PropTypes.object,
    onUpdate: PropTypes.func,
    onUninstall: PropTypes.func
};

AddonManager.propTypes = {
    addons: PropTypes.arrayOf(PropTypes.object),
    appMain: PropTypes.object,
    removeAddon: PropTypes.func,
    setAddons: PropTypes.func,
    setAddon: PropTypes.func,
    wowPath: PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(AddonManager);
