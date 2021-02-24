import electron from 'electron'
import React from 'react';
import { render } from 'react-dom';
import App from './App';

render(<App />, document.getElementById('root'));

console.log(electron)
// Menu.setApplicationMenu(null)
