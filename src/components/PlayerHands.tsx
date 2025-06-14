import React from 'react';
import {Box, Text} from 'ink';
import {GameState} from '../types/index';

interface PlayerHandsProps {
  gameState: GameState;
}

export default function PlayerHands({gameState}: PlayerHandsProps) {
  const otherPlayers = gameState.players.filter(p => p.id !== 'human');

  return (
    <Box flexDirection="column" borderStyle="single">
      {otherPlayers.map((player, index) => (
        <Box key={player.id} paddingX={1} paddingY={index === 0 ? 1 : 0}>
          <Box width="50%">
            <Text color="yellow">{player.name}</Text>
          </Box>
          <Box>
            <Text>[{player.hand.length} cards]</Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
}