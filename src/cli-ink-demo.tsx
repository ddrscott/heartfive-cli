#!/usr/bin/env node

import React from 'react';
import {render, Box, Text} from 'ink';
import {GameState} from './types/index';
import PlayHistory from './components/PlayHistory';
import PlayerHands from './components/PlayerHands';
import YourHand from './components/YourHand';

// Create a mock game state for demo
const mockGameState: GameState = {
  round: 1,
  players: [
    {
      id: 'human',
      name: 'You',
      hand: [
        {rank: '3', suit: 'H', notation: '3H', isJoker: false, is5H: false},
        {rank: '5', suit: 'H', notation: '5H', isJoker: false, is5H: true},
        {rank: '7', suit: 'H', notation: '7H', isJoker: false, is5H: false},
        {rank: '9', suit: 'S', notation: '9S', isJoker: false, is5H: false},
        {rank: 'T', suit: 'S', notation: 'TS', isJoker: false, is5H: false},
        {rank: 'Q', suit: 'S', notation: 'QS', isJoker: false, is5H: false},
        {rank: 'K', suit: 'D', notation: 'KD', isJoker: false, is5H: false},
        {rank: 'A', suit: 'D', notation: 'AD', isJoker: false, is5H: false},
        {rank: '2', suit: 'C', notation: '2C', isJoker: false, is5H: false},
        {rank: '4', suit: 'C', notation: '4C', isJoker: false, is5H: false},
        {rank: '6', suit: 'C', notation: '6C', isJoker: false, is5H: false},
        {rank: 'J', suit: 'C', notation: 'JC', isJoker: false, is5H: false},
      ],
      wins: 0,
      losses: 0,
      isBot: false
    },
    {
      id: 'alice',
      name: 'Alice',
      hand: Array(13).fill(null),
      wins: 0,
      losses: 0,
      isBot: true
    },
    {
      id: 'bob',
      name: 'Bob',
      hand: Array(13).fill(null),
      wins: 0,
      losses: 0,
      isBot: true
    },
    {
      id: 'cat',
      name: 'Cat',
      hand: Array(13).fill(null),
      wins: 0,
      losses: 0,
      isBot: true
    }
  ],
  currentPlayerIndex: 0,
  currentLeader: 'human',
  establishedMeldType: 'single',
  lastPlay: {
    player: 'bob',
    meld: {
      type: 'single',
      cards: [{rank: '3', suit: 'D', notation: '3D', isJoker: false, is5H: false}],
      strength: 1
    }
  },
  consecutivePasses: 0,
  deck: [],
  playHistory: [
    {
      player: 'human',
      action: 'play',
      meld: {
        type: 'single',
        cards: [{rank: '3', suit: 'H', notation: '3H', isJoker: false, is5H: false}],
        strength: 1
      }
    },
    {
      player: 'alice',
      action: 'pass'
    },
    {
      player: 'bob',
      action: 'play',
      meld: {
        type: 'single',
        cards: [{rank: '3', suit: 'D', notation: '3D', isJoker: false, is5H: false}],
        strength: 1
      }
    },
    {
      player: 'cat',
      action: 'pass'
    }
  ]
};

function DemoApp() {
  return (
    <Box flexDirection="column" height={30}>
      <Box flexGrow={1}>
        <Box width="40%" borderStyle="single" flexDirection="column">
          <PlayHistory gameState={mockGameState} />
        </Box>
        <Box width="60%" flexDirection="column">
          <PlayerHands gameState={mockGameState} />
          <Box borderStyle="single" flexGrow={1}>
            <YourHand gameState={mockGameState} />
          </Box>
        </Box>
      </Box>
      <Box height={3} borderStyle="single">
        <Box flexDirection="row" width="100%">
          <Box width="30%" paddingX={1}>
            <Text dimColor>Hint: Type 'legal' to see moves</Text>
          </Box>
          <Box flexGrow={1} paddingX={1}>
            <Text>Can you beat Bob's 3D &gt; </Text>
            <Text dimColor>(Demo mode - no input)</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

render(<DemoApp />);