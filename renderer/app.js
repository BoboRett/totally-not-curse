import ReactDOM from 'react-dom';
import React from 'react';

const App = () => {
    return (
        <>
            <h1>Boop</h1>
        </>
    );
};

window.onload = () => {
    ReactDOM.render(App(), document.querySelector('.root'));
};
