import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import useScrollLerp from '../hooks/use-scroll-lerp';

function toInterpolators(stops) {
    const interpolate = (from, to) => _.mapValues(from, (v, k) => (_.isPlainObject(v) ? interpolate : d3.interpolate)(v, to[k]));
    const scrolls = _.keys(stops);
    return _.transform(scrolls, (interps, scroll, i) => {
        if(i === scrolls.length - 1) return;
        const from = stops[scroll];
        const to = stops[scrolls[i + 1]];
        interps.push(interpolate(from, to));
    }, []);
}

function fromInterpolators(interps, val) {
    return _.mapValues(interps, interp => _.isPlainObject(interp) ? fromInterpolators(interp, val) : interp(val));
}

const Transitioner = ({ children, scrollParent, stops }) => {
    const [interpolators, setInterpolators] = useState({});
    const [styles, setStyles] = useState({});
    const scrollStops = useMemo(() => _.map(_.keys(stops), (scroll, i) => [scroll, i]), [stops]);
    const [alpha, stop] = useScrollLerp(scrollParent.current, scrollStops);

    useEffect(() => {
        setInterpolators(toInterpolators(stops));
    }, [stops]);
    useEffect(() => {
        const clampedStop = _.clamp(stop, 0, interpolators.length - 1);
        const interps = interpolators[clampedStop];
        setStyles(fromInterpolators(interps, alpha - clampedStop));
    }, [stop, alpha, interpolators]);

    return (
        <>
            { children(styles) }
        </>
    );
};

Transitioner.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.array]),
    scrollParent: PropTypes.object,
    stops: PropTypes.object,
};

export default Transitioner;
