import React from 'react';
import {Box, Text} from 'ink';
import {GameState} from '../types/index';

interface PlayHistoryProps {
  gameState: GameState;
}

export default function PlayHistory({gameState}: PlayHistoryProps) {
  const getTrickHistory = () => {
    const plays: Array<{player: string; action: string; cards?: string}> = [];
    
    // Get the plays since the last trick started
    let trickStart = gameState.playHistory.length;
    for (let i = gameState.playHistory.length - 1; i >= 0; i--) {
      if (i === 0 || (gameState.playHistory[i - 1].action === 'pass' && 
          countConsecutivePasses(gameState.playHistory, i - 1) >= gameState.players.length - 1)) {
        trickStart = i;
        break;
      }
    }
    
    // Build play entries
    for (let i = trickStart; i < gameState.playHistory.length; i++) {
      const entry = gameState.playHistory[i];
      const player = gameState.players.find(p => p.id === entry.player);
      if (!player) continue;
      
      const playerName = player.id === 'human' ? 'You' : player.name;
      
      if (entry.action === 'play' && entry.meld) {
        const cards = entry.meld.cards.map(c => c.notation.replace('10', 'T')).join(' ');
        plays.push({player: playerName, action: 'play', cards});
      } else {
        plays.push({player: playerName, action: 'pass'});
      }
    }
    
    return plays;
  };

  const countConsecutivePasses = (history: any[], fromIndex: number): number => {
    let count = 0;
    for (let i = fromIndex; i >= 0; i--) {
      if (history[i].action === 'pass') {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const trickHistory = getTrickHistory();

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold underline>Play History</Text>
      <Box marginTop={1} flexDirection="column">
        {trickHistory.length === 0 ? (
          <Text dimColor>No plays yet</Text>
        ) : (
          trickHistory.map((play, index) => (
            <Box key={index}>
              <Text color="cyan">{play.player.padEnd(7)}</Text>
              {play.action === 'play' ? (
                <Text color="white">{play.cards}</Text>
              ) : (
                <Text dimColor>pass</Text>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}