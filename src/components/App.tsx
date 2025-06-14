import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useApp} from 'ink';
import {InkGameController} from '../services/InkGameController';
import {GameState} from '../types/index';
import PlayHistory from './PlayHistory';
import PlayerHands from './PlayerHands';
import YourHand from './YourHand';
import InputPrompt from './InputPrompt';

export default function App() {
  const {exit} = useApp();
  const [gameController] = useState(() => new InkGameController());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [hint, setHint] = useState('');

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      gameController.onStateChange = (state: GameState) => {
        setGameState(state);
      };
      
      gameController.onInputRequest = (prompt: string) => {
        setInputPrompt(prompt);
        setWaitingForInput(true);
        return new Promise((resolve) => {
          gameController.resolveInput = resolve;
        });
      };

      gameController.onHint = (hintText: string) => {
        setHint(hintText);
      };

      await gameController.startGame();
    };

    initGame().catch(console.error);
  }, [gameController]);

  // Handle input submission
  const handleSubmit = (value: string) => {
    if (waitingForInput && gameController.resolveInput) {
      gameController.resolveInput(value);
      setInputValue('');
      setWaitingForInput(false);
      setHint('');
    }
  };

  // Handle ctrl+c
  useInput((input: string, key: any) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  if (!gameState) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1}>
        <Box width="40%" borderStyle="single" flexDirection="column">
          <PlayHistory gameState={gameState} />
        </Box>
        <Box width="60%" flexDirection="column">
          <PlayerHands gameState={gameState} />
          <Box borderStyle="single" flexGrow={1}>
            <YourHand gameState={gameState} />
          </Box>
        </Box>
      </Box>
      <Box height={3} borderStyle="single">
        <InputPrompt
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          prompt={inputPrompt}
          hint={hint}
          isActive={waitingForInput}
        />
      </Box>
    </Box>
  );
}