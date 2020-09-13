import React, { useState, useEffect } from 'react';

import './progress-bar.less';

const ProgressBar = () => {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        events.on('progress_start', (total, msg) => setProgress(_.assign({ msg }, _.isNil(total) || { total })));
        events.on('progress', (delta, msg) => setProgress(curProgress => _.assign({}, curProgress, { value: _.get(curProgress, 'value', 0) + delta, msg })));
        events.on('progress_end', () => setProgress(null));
        return () => {
            events.removeAllListeners('progress_start');
            events.removeAllListeners('progress');
            events.removeAllListeners('progress_end');
        };
    }, []);

    return (
        <div className={`progress-bar ${progress ? 'active' : ''}`}>
            <span
                className={`progress-bar__fill ${_.has(progress, 'total') ? 'determinate': (progress ? 'indeterminate' : '')}`}
                style={{ width: _.has(progress, 'total') && `${_.get(progress, 'value', 0) / _.get(progress, 'total') * 100}%` }}
            />
            <span className="progress-bar__status">{ _.get(progress, 'msg') }</span>
        </div>
    );
};

export default ProgressBar;
