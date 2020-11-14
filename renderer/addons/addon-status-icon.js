import PropTypes from 'prop-types';
import React from 'react';

import { ADDON_STATUS } from '../../utils/constants';
import './addon-status-icon.less';

const AddonStatus = ({ addon, onClick }) => {
    return (
        <span className="addon-status" data-status={addon.status || ADDON_STATUS.OK} onClick={onClick}>
            <svg className="addon-status__progress" opacity={addon.status >= ADDON_STATUS.UPDATE_WAIT && addon.status < ADDON_STATUS.UPDATE_COMPLETE ? 1 : 0}>
                <circle
                    className="addon-status__progress-bg"
                    cx="50%"
                    cy="50%"
                    r="25%"
                />
                <circle
                    className={`addon-status__progress-fill ${addon.status === ADDON_STATUS.UPDATE_PROG && _.isNil(addon.updateProgress) ? 'indeterminate' : ''}`}
                    cx="50%"
                    cy="50%"
                    r="25%"
                    strokeDashoffset={98 - ((addon.updateProgress * 98) || 0)}
                />
            </svg>
        </span>
    );
};

AddonStatus.propTypes = {
    addon: PropTypes.object,
    onClick: PropTypes.func
};

export default AddonStatus;
