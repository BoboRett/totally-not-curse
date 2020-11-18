import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import './confirm-button.less';

const ConfirmButton = (props) => {
    const [confirmation, setConfirmation] = useState(null);

    const onClick = useCallback(ev => {
        if(!confirmation) {
            setConfirmation(setTimeout(() => setConfirmation(null), 2000));
        } else {
            props.onClick(ev);
            clearTimeout(confirmation);
            setConfirmation(null);
        }
    }, [confirmation]);

    return (
        <button
            {...props}
            className={`${props.className} confirm-button ${confirmation ? 'confirm-button_confirm' : ''}`}
            onClick={onClick}
        >
            { confirmation ? 'Click to confirm' : props.children }
        </button>
    );
};

ConfirmButton.propTypes = {
    children: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func
};

export default ConfirmButton;
