import React from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';

interface InputPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  prompt: string;
  hint: string;
  isActive: boolean;
}

export default function InputPrompt({
  value,
  onChange,
  onSubmit,
  prompt,
  hint,
  isActive
}: InputPromptProps) {
  return (
    <Box flexDirection="column" width="100%" paddingX={1}>
      {/* First line - Hint */}
      <Box height={1}>
        {hint ? (
          <Text dimColor>Hint: {hint}</Text>
        ) : (
          <Text> </Text>
        )}
      </Box>
      
      {/* Second line - Input prompt */}
      <Box height={1}>
        {isActive ? (
          <Box>
            <Text>{prompt || 'Prompt > '}</Text>
            <TextInput
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              focus={isActive}
            />
          </Box>
        ) : (
          <Text dimColor>Waiting...</Text>
        )}
      </Box>
    </Box>
  );
}