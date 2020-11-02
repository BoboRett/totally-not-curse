import React, { useEffect, useState } from "react";

import './error-dialog.less';

const ErrorDialog = () => {
    const [error, setError] = useState(null);

    useEffect(() => {
        const err = setError;
        events.on('error', err);
        return () => events.off('error', err);
    }, []);

    return (
        !_.isNil(error)
            ? <div className="error-dialog" onClick={() => setError(null)}>{ error }</div>
            : null
    );
};

export default ErrorDialog;
