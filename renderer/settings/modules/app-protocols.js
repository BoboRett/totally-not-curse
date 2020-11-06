import React, { useCallback, useEffect, useState } from 'react';

function AppProtocols() {
    const [isCFHandled, setIsCFHandled] = useState(false);

    const checkProtocol = useCallback((scheme, setState) => {
        api.app.protocols.isProtocolHandled('curseforge')
            .then(setState)
        ;
    });
    const handleProtocol = useCallback(scheme => {
        api.app.protocols.handleProtocol(scheme)
            .then(() => checkProtocol('curseforge', setIsCFHandled))
        ;
    });

    useEffect(() => {
        checkProtocol('curseforge', setIsCFHandled);
    }, []);

    return (
        <div className="app-protocols">
            <h2 className="app-settings__heading">Integration</h2>
            <p className="app-settings__details">
                URLs contain a &quot;protocol&quot;, such as http://, https://, and ftp://.
                The way websites talk to desktop apps is via a special, custom protocol.
                For instance, Curseforge talks to the desktop client via a curseforge:// protocol
                which we can hijack here so that when you click install on the website,
                tnc will handle everything.
            </p>
            <p className="app-settings__details">
                This hijack is not done automatically, so that you
                have control over the defaults. You can set tnc to be the default
                handler for protocols below.
            </p>
            <button className="app-settings__entry-value_button" disabled={isCFHandled} onClick={() => handleProtocol('curseforge')}>
                {
                    isCFHandled
                        ? 'curseforge:// protocol handled'
                        : 'Handle curseforge:// protocol'
                }
            </button>
        </div>
    );
}

export default AppProtocols;
