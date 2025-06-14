import React from 'react';
import {Box, Text} from 'ink';
import {GameState} from '../types/index';

interface YourHandProps {
  gameState: GameState;
}

export default function YourHand({gameState}: YourHandProps) {
  const humanPlayer = gameState.players.find(p => p.id === 'human');
  if (!humanPlayer) return null;

  const rankOrder = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2', 'JK'];
  const suitOrder = ['H', 'S', 'D', 'C'];
  
  // Create a 2D grid: suits x ranks
  const grid: Record<string, Record<string, boolean>> = {};
  suitOrder.forEach(suit => {
    grid[suit] = {};
  });
  
  // Populate the grid
  humanPlayer.hand.forEach(card => {
    if (card.isJoker) {
      // J1 goes in Heart row, J2 goes in Spade row
      if (card.rank === 'J1') {
        grid['H']['JK'] = true;
      } else if (card.rank === 'J2') {
        grid['S']['JK'] = true;
      }
    } else {
      const rank = card.rank;
      if (card.suit) {
        grid[card.suit][rank] = true;
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Your Hand</Text>
      </Box>
      
      {/* Header with rank labels */}
      <Box>
        <Text>   </Text>
        {rankOrder.map((rank, index) => (
          <Text key={`header-${rank}-${index}`} dimColor>{(rank.length === 2 ? rank : rank + ' ').padEnd(3)}</Text>
        ))}
      </Box>
      
      {/* Each suit row */}
      {suitOrder.map(suit => (
        <Box key={suit}>
          <Text color="cyan">{suit}: </Text>
          {rankOrder.map(rank => {
            if (rank === 'JK' && grid[suit] && grid[suit]['JK']) {
              // Display jokers
              const jokerNotation = suit === 'H' ? 'J1' : 'J2';
              return <Text key={`${suit}-${rank}`} color="magenta">{jokerNotation} </Text>;
            } else if (grid[suit] && grid[suit][rank]) {
              const cardNotation = rank + suit;
              
              if (cardNotation === '5H') {
                return <Text key={`${suit}-${rank}`} bold color="red">{cardNotation.padEnd(3)}</Text>;
              } else if (suit === 'H' || suit === 'D') {
                return <Text key={`${suit}-${rank}`} color="red">{cardNotation.padEnd(3)}</Text>;
              } else {
                return <Text key={`${suit}-${rank}`}>{cardNotation.padEnd(3)}</Text>;
              }
            } else {
              return <Text key={`${suit}-${rank}`} dimColor>.  </Text>;
            }
          })}
        </Box>
      ))}
      
    </Box>
  );
}