import React from 'react'
import { render } from 'react-dom'
import App from './App'
import { initSettingsPref } from './prefs/settingsPref'
import './styles/index.global.scss'

initSettingsPref()

render(<App />, document.getElementById('root'));

