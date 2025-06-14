#!/usr/bin/env node

import React from 'react';
import {render} from 'ink';
import App from './components/App';

// Check if we're in a TTY environment
const isRawModeSupported = process.stdin.isTTY || false;

if (!isRawModeSupported) {
  console.log('This game requires an interactive terminal.');
  console.log('Please run it directly in your terminal, not through pipes or scripts.');
  process.exit(1);
}

render(<App />);