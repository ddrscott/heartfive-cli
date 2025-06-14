# Ink UI for HeartFive CLI

This is the new terminal GUI for HeartFive CLI built with Ink (React for CLIs).

## Running the Ink Interface

### Interactive Mode (requires TTY terminal)
```bash
npm run dev:ink
```

**Note**: This must be run in an interactive terminal (not through pipes or scripts). If you get a "Raw mode is not supported" error, make sure you're running it directly in your terminal.

### Demo Mode (no input required)
```bash
npm run dev:ink-demo
```

This shows the UI layout with mock data and doesn't require input.

## UI Layout

The interface is divided into four main sections:

```
┌─────────────────┐┌────────────────────────────┐
│                 ││ Alice         [13 cards]   │
│ Play History    ││ Bob           [13 cards]   │
│                 ││ Cat           [13 cards]   │
│                 │├────────────────────────────┤
│                 ││                            │
│                 ││ Your Hand [12 cards]       │
│                 ││                            │
│                 ││ (Card grid displayed here) │
│                 ││                            │
└─────────────────┘└────────────────────────────┘
┌────────────────────────────────────────────────┐
│ Hint: ...       | Prompt >                     │
└────────────────────────────────────────────────┘
```

- **Play History** (left): Shows recent moves in the current trick
- **Player Hands** (top right): Shows opponent names and card counts
- **Your Hand** (middle right): Displays your cards in a grid format
- **Input Area** (bottom): Shows hints and accepts commands

## Commands

Simplified command interface:
- `<cards>` - Play cards directly (e.g., "5H" or "3H 3D") - no need to type "play"
- `-` - Pass your turn (or use "pass")
- `legal` - Show legal moves
- `help` - Show available commands

Examples:
- Type `3H` to play the 3 of Hearts
- Type `3H 3D` to play a pair of 3s
- Type `J1` to play the little joker
- Type `J2` to play the big joker
- Type `-` to pass
- Type `legal` to see what moves are available

Note: J1 is displayed in the Hearts row, J2 in the Spades row, both under the 'JK' column.

## Troubleshooting

### TypeError: cards.map is not a function
This error has been fixed. The game now properly handles the parsed command structure.

### Raw mode is not supported
This error occurs when running in a non-TTY environment (like through pipes or in some IDE terminals). Solutions:
1. Run directly in a standard terminal (Terminal.app, iTerm, etc.)
2. Use the demo mode: `npm run dev:ink-demo`
3. Make sure you're not piping the output

## Development Notes

The Ink version uses:
- React components for UI
- Flexbox layout
- Real-time state updates
- TypeScript with JSX support

Key files:
- `src/cli-ink.tsx` - Entry point
- `src/components/App.tsx` - Main layout
- `src/components/*` - UI components
- `src/services/InkGameController.ts` - Game logic with React hooks

## New Features

1. **Simplified Commands**: 
   - Type card notations directly without "play" prefix
   - Use `-` as shortcut for pass

2. **Game Statistics**:
   - Win/Loss counters displayed for all players
   - Stats persist across rounds within a game session

3. **Victory Banner**:
   - Nice ASCII art banner when you win
   - Different styling for human vs bot victories

4. **Complete Game Play**:
   - After human wins/loses, bots continue playing
   - Game determines 2nd, 3rd, and last place
   - Full statistics for all positions

5. **Game Over Options**:
   - When all positions determined, prompted to play another game or quit
   - Statistics reset when starting a new game

6. **Two-line Input Area**:
   - Hints displayed on first line
   - Input prompt on second line for better visibility

7. **Visual Card Tracking**:
   - Bar graphs show relative card counts
   - All players (including human) shown in one view
   - Proper column alignment for stats

## Changes from Original

The main difference is that the InputParser already creates Meld objects from the card notations, so the InkGameController now uses `handlePlayMeld` instead of parsing cards again.