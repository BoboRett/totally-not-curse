import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import './addon-installer.less';
import { bindActionCreators } from 'redux';
import { addAddons } from '../store/addons';

const useQuery = () => {
    const location = useLocation();
    const [query, setQuery] = useState(null);

    useEffect(() => {
        setQuery(new URLSearchParams(location.search));
    }, [location]);

    return query;
};

const AddonInstaller = ({ wowPath, addAddons }) => {
    const query = useQuery();
    const [url, setUrl] = useState('');
    const [addon, setAddon] = useState({});
    const [canInstallAddon, setCanInstallAddon] = useState(false);

    const installAddon = useCallback(() => {
        api.addons.installAddon(wowPath, addon.type, addon.id, addon.file.id)
            .then(addons => {
                setCanInstallAddon(false);
                addAddons(addons);
            })
        ;
    }, [addAddons, addon]);

    useEffect(() => {
        if(!query || !query.get('url')) {
            setUrl('');
            setCanInstallAddon(false);
            return;
        } else if(query.get('url')) {
            setUrl(query.get('url'));
        } else {
            setUrl('');
        }
    }, [query]);

    useEffect(() => {
        if(!url) { return; }
        api.addons.getAddonDetails(url).then(queryAddon => {
            setAddon(queryAddon || {});
            setCanInstallAddon(queryAddon);
        });
    }, [url]);

    return (
        <div className="addon-installer">
            <label className="addon-installer__url-input">
                <input
                    value={url}
                    readOnly={false}
                    spellCheck={false}
                    onChange={ev => setUrl(ev.target.value)}
                />
            </label>
            <pre className="addon-installer__details">
                { addon.name }
                {'\n'}
                { _.map(addon.authors, 'name').join('  -  ') }
                { _.map(addon.dependencies, 'name') }
            </pre>
            <button
                className="addon-installer__install"
                disabled={!canInstallAddon}
                onClick={installAddon}
            >
                Install
            </button>
        </div>
    );
};

const mapStateToProps = state => ({
    wowPath: state.wowClient.paths[state.wowClient.version]
});


function mapDispatchToProps(dispatch) {
    return bindActionCreators({ addAddons }, dispatch);
}

AddonInstaller.propTypes = {
    addAddons: PropTypes.func,
    wowPath: PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(AddonInstaller);
