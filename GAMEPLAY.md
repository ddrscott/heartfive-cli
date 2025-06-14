# How to Play Heart of Five CLI

## Starting the Game

```bash
npm start
```

## Basic Commands You Can Type

### 🎮 **Playing Cards**

```bash
# Play a single card
play 5H              # Play the Five of Hearts (strongest single)
play AS              # Play Ace of Spades
play jj              # Play small joker
play JJ              # Play big joker

# Play a pair (two cards of same rank)
play 5H 5D           # Play pair of fives
play KS KH           # Play pair of kings

# Play a triple
play 7H 7D 7C        # Play three sevens

# Play a full house (triple + pair)
play 5H 5D 5C 7H 7D  # Three fives + pair of sevens

# Play four of a kind (bomb!)
play 3H 3D 3C 3S     # Four threes bomb

# Play a run (5+ consecutive cards)
play 3H 4D 5C 6H 7S  # 3-4-5-6-7 straight

# Play sisters (consecutive pairs)
play 3H 3D 4H 4C     # Pairs of 3s and 4s
play 5H 5D 5C 6H 6D 6C  # Triples of 5s and 6s
```

### 🎯 **Quick Play Commands**

```bash
# See all your legal moves
legal

# Play a legal move by number
move 1               # Play the first legal move shown
move 3               # Play the third legal move shown

# Pass your turn
pass
```

### 📋 **Information Commands**

```bash
# Show your current hand
hand

# See recent play history
history

# Check win/loss scores
score

# Get help
help
```

### 🔧 **Hand Management**

```bash
# Sort your hand by card strength
sort rank

# Sort your hand by suit (clubs, diamonds, hearts, spades)
sort suit
```

## Example Game Session

```
=== HEART OF FIVE - Round 1 ===
Your hand: 3H 4S 5D 6C 7H 8S 9D TH JC QS KH AD 2C jj

> legal
Legal moves:
1. 3H (Single)
2. 4S (Single)
3. 5D (Single)
... (and so on)

> play 3H
✅ You played: 3H

Alice plays: 4D
Bob plays: 7S
Cat passes

=== YOUR TURN AGAIN ===
You're now the leader! You can play any meld type.

> play 5D 6C
✅ You played: 5D 6C (Pair)

Alice passes
Bob plays: 8H 8C
Cat passes

> move 1
✅ You played: 9D 9S (Pair)

... game continues ...
```

## 💡 **Pro Tips**

### Card Strength Order (Weakest → Strongest)
```
3 < 4 < 5 < 6 < 7 < 8 < 9 < T < J < Q < K < A < 2 < jj < JJ < 5H
```

### Strategy Tips
- **Save 5H**: It's the strongest single card - use it wisely!
- **Use Bombs Strategically**: Four-of-a-kind and straight flush bombs can break any style
- **Watch the Flow**: When you're leader, choose meld types that favor your hand
- **Count Cards**: Pay attention to what others play to predict what they have left

### Common Mistakes to Avoid
- **Wrong Meld Type**: Must match the leader's style (unless playing a bomb)
- **Not Strong Enough**: Your play must beat the previous play of the same type
- **Invalid Combinations**: Make sure your cards form a valid meld

### Card Notation Help
- **Regular Cards**: Rank + Suit (AS = Ace Spades, TH = Ten Hearts)
- **Ten**: Use 'T' (TH, TD, TC, TS)
- **Jokers**: jj (small), JJ (big)
- **Suits**: H=Hearts, D=Diamonds, C=Clubs, S=Spades

## Quick Start Commands

When the game starts and it's your turn, try these:

```bash
help        # See all commands
legal       # See what moves you can make
hand        # Look at your cards again
play 3H     # Play the three of hearts (if you have it)
move 1      # Play the first legal move
pass        # Skip your turn
```

Have fun playing! 🃏