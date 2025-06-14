import React from 'react';
import {Box, Text} from 'ink';

interface VictoryBannerProps {
  winner: string;
  isHuman: boolean;
}

export default function VictoryBanner({winner, isHuman}: VictoryBannerProps) {
  const message = isHuman ? 'YOU WIN!' : `${winner.toUpperCase()} WINS!`;
  
  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Box borderStyle="double" borderColor={isHuman ? 'green' : 'yellow'} paddingX={3} paddingY={1}>
        <Text bold color={isHuman ? 'green' : 'yellow'}>
          {'*'.repeat(message.length + 4)}
        </Text>
      </Box>
      <Box borderStyle="double" borderColor={isHuman ? 'green' : 'yellow'} paddingX={3}>
        <Text bold color={isHuman ? 'green' : 'yellow'}>
          *  {message}  *
        </Text>
      </Box>
      <Box borderStyle="double" borderColor={isHuman ? 'green' : 'yellow'} paddingX={3} paddingY={1}>
        <Text bold color={isHuman ? 'green' : 'yellow'}>
          {'*'.repeat(message.length + 4)}
        </Text>
      </Box>
    </Box>
  );
}