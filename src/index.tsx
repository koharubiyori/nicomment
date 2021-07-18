import React from 'react'
import { render } from 'react-dom'
import App from './App'
import settingsPref, { initSettingsPref } from './prefs/settingsPref'
import './styles/index.global.scss'

initSettingsPref()

// settingsPref.

render(<App />, document.getElementById('root'));

