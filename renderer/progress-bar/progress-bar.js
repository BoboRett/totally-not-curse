import React, { useState, useEffect } from 'react';

import './progress-bar.less';

const ProgressBar = () => {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const progStart = (total, msg) => setProgress(_.assign({ msg }, _.isNil(total) || { total }));
        const prog = (delta, msg) => setProgress(curProgress => _.assign({}, curProgress, { value: _.get(curProgress, 'value', 0) + delta, msg }));
        const progEnd = () => setProgress(null);
        events.on('progress_start', progStart);
        events.on('progress', prog);
        events.on('progress_end', progEnd);
        return () => {
            events.off('progress_start', progStart);
            events.off('progress', prog);
            events.off('progress_end', progEnd);
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
