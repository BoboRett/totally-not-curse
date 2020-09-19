const _ = require('lodash');
const { useState, useEffect, useCallback } = require("react");

const useScrollLerp = (el, stops) => {
    const [out, setOut] = useState(stops[0][1]);
    const [stop, setStop] = useState(0);
    const onScroll = useCallback(() => {
        const scroll = el.scrollTop;
        const targetIndex = _.sortedIndexBy(stops, [scroll], '0');
        const prev = stops[targetIndex - 1];
        const next = stops[targetIndex];
        if(!prev) {
            setOut(stops[0][1]);
            setStop(0);
        } else if(!next) {
            setOut(_.last(stops)[1]);
            setStop(stops.length - 1);
        } else {
            const alpha = _.clamp((scroll - prev[0]) / (next[0] - prev[0]), 0, 1);
            setOut(prev[1] + (next[1] - prev[1]) * alpha);
            setStop(targetIndex - 1);
        }
    }, [el, stops]);

    useEffect(() => {
        if(!el) return;
        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
        };
    }, [el, onScroll]);

    return [out, stop];
};

export default useScrollLerp;
