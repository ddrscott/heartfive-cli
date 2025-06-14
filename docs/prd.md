# Heart of Five CLI Game - Product Requirements Document

## Game Overview

Heart of Five is a multiplayer shedding card game where players compete to discard all their cards first. The game features a unique card ranking system where the Five of Hearts is the strongest single card, and players must match meld types established by the lead player.

## Core Game Mechanics

### 1. Setup & Players
- **Players**: 2-6 players (optimal: 4 players)
- **Deck**: 52-card deck + 2 jokers (54 cards total)
- **Multiple Decks**: Add additional decks for 6+ players
- **Deal**: Distribute entire deck evenly among all players

### 2. Card Ranking System

#### Single Card Strength (Weakest to Strongest)
```
3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 < jj < JJ < 5H
```

#### Special Cards
- **Small Joker (jj)**: Second strongest single card
- **Big Joker (JJ)**: Third strongest single card  
- **Five of Hearts (5H)**: Strongest single card (game namesake)

#### Run/Straight Ranking (Different from singles)
```
A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A
```
*Note: In runs, Ace can be low (A-2-3-4-5) or high (J-Q-K-A), but 2 becomes low rank*

### 3. Meld Types

#### Basic Melds
1. **Single Card**: Any individual card
2. **Pair (Two of a Kind)**: Two cards of same rank (no jokers allowed)
3. **Triple (Three of a Kind)**: Three cards of same rank
4. **Full House**: One pair + one triple

#### Sequential Melds
5. **Sisters**: 2+ consecutive pairs or triples (e.g., 3♥3♦,4♥4♦)
6. **Run/Straight**: 5+ consecutive cards (uses run ranking)

#### Bomb Melds (Can break style rules)
7. **Four of a Kind Bomb**: All four cards of same rank (notation: rank!)
8. **Straight Flush Bomb**: 5+ card run in same suit

### 4. Game Flow

#### Round Structure
1. **Initial Lead**: Player with Three of Hearts starts first round
2. **Subsequent Rounds**: Previous round winner leads
3. **Meld Matching**: Players must play same meld type as leader
4. **Strength Requirement**: Each play must beat previous play of same type
5. **Passing**: Players can pass if unable/unwilling to play
6. **New Leadership**: When all others pass, last player becomes new leader

#### Winning Conditions
- **Round Winner**: First player to discard all cards
- **Round Loser**: Last player with remaining cards
- **Game Winner**: First to win 10 rounds OR best record when time expires

## CLI Implementation Requirements

### 5. User Interface Design

#### Game Display Format
```
=== HEART OF FIVE - Round 3 ===
Current Leader: Alice (established: Sisters)
Last Play: 5♥5♦,6♥6♠ by Bob

Players:          Cards:    Last Action:    W/L Record:
You               8         Played pair     3/1
Alice (Leader)    12        Passed         2/2  
Bob               10        Played sisters  4/0
Cat               7         Passed         1/3

Your hand: AS 2H 3C 3D 4H 5S 6C 7H 8D 9S JC QH
```

#### Hand Notation System
- **Standard Format**: RankSuit (e.g., AS = Ace of Spades)
- **Ten Representation**: T (e.g., TC = Ten of Clubs)
- **Jokers**: jj (Small Joker), JJ (Big Joker)
- **Five of Hearts**: 5H (highlighted as strongest single)
- **Bomb Notation**: rank! (e.g., 3! = Four threes bomb)

### 6. Player Input Commands

#### Basic Actions
```bash
play <cards>     # Play specific cards: "play AS 2H 3C"
move <number>    # Play legal move by number: "move 1"
pass            # Pass turn
hand            # Display current hand
legal           # Show all legal moves
history         # Show recent play history
score           # Show win/loss records
help            # Display command help
```

#### Advanced Commands
```bash
sort rank       # Sort hand by rank strength
sort suit       # Sort hand by suit
bomb <rank>     # Quick bomb notation: "bomb 3" = play 3!
sisters <ranks> # Quick sisters: "sisters 34" = pairs of 3s and 4s
```

### 7. Legal Move Validation

#### Move Type Matching
- Must match leader's established meld type
- Exception: Bombs can be played over any meld type
- Straight flush bombs can beat four-of-a-kind bombs

#### Strength Comparison Rules
```javascript
// Meld strength comparison examples
{
  "single": "compareCardRank", 
  "pair": "compareHighestRank",
  "triple": "compareHighestRank", 
  "sisters": "compareHighestPairRank",
  "fullHouse": "compareTripleRank",
  "run": "compareHighestCardInRun",
  "fourOfKindBomb": "compareRank",
  "straightFlushBomb": "compareLengthThenHighCard"
}
```

### 8. Bot AI Requirements

#### Difficulty Levels
- **Beginner**: Random valid plays, basic card retention
- **Intermediate**: Heuristic-based with bomb timing
- **Advanced**: Monte Carlo with meld optimization

#### AI Considerations
- **Bomb Timing**: When to use four-of-a-kind strategically
- **5H Protection**: Preserve Five of Hearts for critical moments
- **Meld Planning**: Optimize for sisters and full houses
- **Leading Strategy**: Choose meld types that favor remaining hand

### 9. Game Configuration

#### JSON Config Structure
```json
{
  "gameInfo": {
    "name": "Heart of Five",
    "players": {"min": 2, "max": 6, "optimal": 4},
    "deck": "standard52Plus2Jokers"
  },
  "cardRanking": {
    "singleRanks": ["3","4","5","6","7","8","9","T","J","Q","K","A","2","jj","JJ","5H"],
    "runRanks": ["A","2","3","4","5","6","7","8","9","T","J","Q","K","A"],
    "suits": ["C","D","H","S"]
  },
  "specialCards": {
    "gameStarter": "3H",
    "strongestSingle": "5H",
    "smallJoker": "jj",
    "bigJoker": "JJ"
  }
}
```

### 10. Core Features Implementation

#### Essential Features (MVP)
- [ ] 52+2 card deck with proper ranking
- [ ] All 8 meld types with validation
- [ ] Turn-based play with lead/follow mechanics
- [ ] Bomb interruption system
- [ ] Win/loss tracking across rounds
- [ ] 1 human + 3 bot gameplay

#### Enhanced Features
- [ ] Multiple deck support for 6+ players
- [ ] Advanced bot personalities
- [ ] Game replay system
- [ ] Statistics tracking (bombs used, 5H plays, etc.)
- [ ] Custom tournament modes

### 11. Technical Specifications

#### Game State Management
```javascript
const gameState = {
  round: 3,
  currentLeader: "alice",
  establishedMeldType: "sisters", 
  lastPlay: {
    player: "bob",
    meldType: "sisters",
    cards: ["5H","5D","6H","6S"],
    strength: 6 // highest pair rank
  },
  players: [
    {id: "human", handSize: 8, wins: 3, losses: 1},
    {id: "alice", handSize: 12, wins: 2, losses: 2},
    {id: "bob", handSize: 10, wins: 4, losses: 0}, 
    {id: "cat", handSize: 7, wins: 1, losses: 3}
  ]
}
```

#### Error Handling
- Invalid meld type for current style
- Insufficient card strength 
- Malformed card notation
- Bot timeout/error recovery
- Graceful game interruption

### 12. Success Metrics

#### Gameplay Metrics
- Complete games without crashes
- Accurate meld validation (100% rule compliance)
- Bot decision quality (competitive but not perfect)
- Average game duration (15-30 minutes)

#### User Experience
- Intuitive command interface
- Clear legal move display
- Helpful error messages
- Responsive turn progression

---

*This PRD defines the foundation for a CLI implementation of Heart of Five that captures the unique mechanics and strategic depth of this distinctive card game variant.*