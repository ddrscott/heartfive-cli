import React from 'react';
import {Box, Text} from 'ink';
import {GameState} from '../types/index';

interface PlayerHandsProps {
  gameState: GameState;
}

export default function PlayerHands({gameState}: PlayerHandsProps) {
  // Include all players
  const allPlayers = gameState.players.map(p => ({
    ...p,
    displayName: p.id === 'human' ? 'You' : p.name
  }));

  // Function to create bar graph
  const createBarGraph = (cardCount: number, maxCards: number = 13, width: number = 20) => {
    const barLength = Math.round((cardCount / maxCards) * width);
    return '#'.repeat(barLength).padEnd(width, ' ');
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} height="100%">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold>{'Players Cards'.padEnd(39)}W   L</Text>
      </Box>
      
      {/* Player rows */}
      {allPlayers.map((player) => {
        const name = player.displayName.padEnd(8);
        const bar = createBarGraph(player.hand.length);
        const count = `[${String(player.hand.length).padStart(2)}]`;
        const wins = String(player.wins).padStart(3);
        const losses = String(player.losses).padStart(3);
        
        return (
          <Box key={player.id} width="100%">
            <Box width={8}>
              <Text color={player.id === 'human' ? 'green' : 'yellow'}>{name}</Text>
            </Box>
            <Box width={24}>
              <Text color="cyan">{bar}</Text>
            </Box>
            <Box width={5}>
              <Text>{count}</Text>
            </Box>
            <Box width={4}>
              <Text>{wins}</Text>
            </Box>
            <Box width={4}>
              <Text>{losses}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
