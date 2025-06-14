# Heart of Five CLI Game

A command-line implementation of the Heart of Five card game, where the Five of Hearts is the strongest single card and players compete to discard all their cards first.

## Features

- **Complete Game Implementation**: All 8 meld types including singles, pairs, triples, full houses, sisters, runs, and bombs
- **AI Opponents**: Three difficulty levels (beginner, intermediate, advanced) with different strategies
- **Interactive CLI**: Intuitive commands with helpful error messages and suggestions
- **Configurable**: Customizable game rules, bot difficulties, and display settings
- **Testing**: Comprehensive test suite with 75+ tests covering all game mechanics

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd heartfive-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run the game
npm start
```

## How to Play

### Card Ranking

**Single Card Strength (Weakest to Strongest):**
```
3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < jj < JJ < 5H
```

**Special Cards:**
- **Small Joker (jj)**: Second strongest single card
- **Big Joker (JJ)**: Third strongest single card
- **Five of Hearts (5H)**: Strongest single card (game namesake)

**Run/Straight Ranking (Different from singles):**
```
A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A
```

### Meld Types

1. **Single Card**: Any individual card
2. **Pair**: Two cards of same rank (no jokers allowed)
3. **Triple**: Three cards of same rank
4. **Full House**: One pair + one triple (5 cards)
5. **Sisters**: 2+ consecutive pairs or triples
6. **Run/Straight**: 5+ consecutive cards (uses run ranking)
7. **Four of a Kind Bomb**: All four cards of same rank
8. **Straight Flush Bomb**: 5+ card run in same suit

### Game Flow

1. Player with **Three of Hearts** starts the first round
2. **Lead player** can play any valid meld type
3. **Following players** must match the meld type or play a bomb
4. **Bombs** can break style rules and beat any non-bomb meld
5. **Straight flush bombs** beat four-of-a-kind bombs
6. When all others pass, the last player to play becomes the new leader
7. **First to empty their hand** wins the round

## Commands

### Basic Actions
```bash
play <cards>     # Play specific cards: "play AS 2H 3C"
move <number>    # Play legal move by number: "move 1"
pass            # Pass your turn
hand            # Display your current hand
legal           # Show all legal moves
history         # Show recent play history
score           # Show win/loss records
help            # Display command help
```

### Hand Management
```bash
sort rank       # Sort hand by rank strength
sort suit       # Sort hand by suit
```

### Card Notation

- **Standard Cards**: RankSuit (AS = Ace of Spades, TH = Ten of Hearts)
- **Jokers**: jj (Small Joker), JJ (Big Joker)
- **Five of Hearts**: 5H (highlighted as strongest single)

## Development

### Scripts

```bash
npm run dev       # Run in development mode
npm run build     # Build TypeScript to JavaScript
npm test          # Run test suite
npm run lint      # Type checking
npm start         # Run built application
```

### Project Structure

```
src/
├── ai/           # Bot strategy implementations
├── cli/          # Command-line interface and display
├── config/       # Configuration management
├── models/       # Core game models (Card, Deck, Meld, Player)
├── services/     # Game state and controller logic
├── types/        # TypeScript type definitions
├── __tests__/    # Test files
├── cli.ts        # Main CLI entry point
└── index.ts      # Library exports
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### Configuration

The game can be customized through configuration files or the `ConfigManager`:

```typescript
import { ConfigManager } from './src/config/ConfigManager';

// Create a speed game (3 rounds, faster bots)
const speedConfig = ConfigManager.createSpeedGameConfig();

// Create a tournament (15 rounds, all advanced bots)
const tournamentConfig = ConfigManager.createTournamentConfig();

// Create a beginner-friendly game
const beginnerConfig = ConfigManager.createBeginnerConfig();
```

## Game Variations

The modular design allows for easy creation of game variations:

- **Speed Game**: 3 rounds, faster bot thinking
- **Tournament**: 15 rounds, all advanced difficulty bots
- **Beginner Mode**: 5 rounds, easier bots with longer thinking time

## Technical Details

- **TypeScript**: Full type safety with comprehensive interfaces
- **Modular Architecture**: Separation of concerns between game logic, AI, and UI
- **Extensible AI**: Strategy pattern allows for easy addition of new bot behaviors
- **Comprehensive Testing**: Unit tests for all game mechanics and edge cases
- **Configurable**: JSON-based configuration with validation

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

**Enjoy playing Heart of Five! 🃏**



## Example Game Session output
```
   3  4  5  6  7  8  9  T  J  Q  K  A  2  JK
H: .  4H .  .  .  .  .  TH .  .  .  .  .  J1
S: .  .  .  .  .  8S 9S TS .  QS .  AS .  J2
D: .  .  .  .  .  .  9D .  .  .  KD .  .   
C: .  4C .  6C 7C .  .  .  .  QC .  .  .  .
```
