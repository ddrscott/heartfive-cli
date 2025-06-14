#!/usr/bin/env node

// Simple demo of Heart of Five game mechanics
const { GameStateManager, MeldDetector, CardModel } = require('./dist/index.js');

console.log('🃏 Heart of Five Game Demo 🃏\n');

// Create a game
const game = new GameStateManager(4);
game.startNewRound();

const state = game.getState();
const humanPlayer = state.players.find(p => p.id === 'human');

console.log('=== GAME SETUP ===');
console.log(`Round: ${state.round}`);
console.log(`Players: ${state.players.map(p => p.name).join(', ')}`);
console.log(`Starting Player: ${state.players[state.currentPlayerIndex].name}`);
console.log('');

console.log('=== YOUR HAND ===');
console.log(`Your cards: ${humanPlayer.hand.map(c => c.notation).join(' ')}`);
console.log('');

console.log('=== EXAMPLE COMMANDS YOU CAN USE ===');
console.log('');

// Show some example plays
console.log('💡 SINGLE CARDS (play one card):');
humanPlayer.hand.slice(0, 3).forEach(card => {
  console.log(`  play ${card.notation}     # Play ${card.notation} (strength: ${CardModel.getSingleRankValue(card)})`);
});
console.log('');

// Find pairs
console.log('💡 PAIRS (two cards of same rank):');
const rankGroups = {};
humanPlayer.hand.forEach(card => {
  if (!rankGroups[card.rank]) rankGroups[card.rank] = [];
  rankGroups[card.rank].push(card);
});

let pairCount = 0;
for (const [rank, cards] of Object.entries(rankGroups)) {
  if (cards.length >= 2 && !cards[0].isJoker && pairCount < 2) {
    console.log(`  play ${cards[0].notation} ${cards[1].notation}     # Play pair of ${rank}s`);
    pairCount++;
  }
}
console.log('');

// Find triples
console.log('💡 TRIPLES (three cards of same rank):');
let tripleCount = 0;
for (const [rank, cards] of Object.entries(rankGroups)) {
  if (cards.length >= 3 && tripleCount < 1) {
    console.log(`  play ${cards[0].notation} ${cards[1].notation} ${cards[2].notation}     # Play triple of ${rank}s`);
    tripleCount++;
  }
}
console.log('');

// Check for special cards
console.log('💡 SPECIAL CARDS:');
if (humanPlayer.hand.some(c => c.is5H)) {
  console.log(`  play 5H          # Play Five of Hearts (STRONGEST SINGLE!)`);
}
if (humanPlayer.hand.some(c => c.rank === 'jj')) {
  console.log(`  play jj          # Play small joker`);
}
if (humanPlayer.hand.some(c => c.rank === 'JJ')) {
  console.log(`  play JJ          # Play big joker`);
}
console.log('');

console.log('💡 OTHER COMMANDS:');
console.log('  legal            # Show all legal moves');
console.log('  hand             # Show your cards again');
console.log('  history          # Show recent plays');
console.log('  score            # Show win/loss record');
console.log('  sort rank        # Sort cards by strength');
console.log('  sort suit        # Sort cards by suit');
console.log('  pass             # Skip your turn');
console.log('  help             # Show all commands');
console.log('');

console.log('=== CARD STRENGTH ORDER ===');
console.log('Weakest → Strongest:');
console.log('3 < 4 < 5 < 6 < 7 < 8 < 9 < T < J < Q < K < A < 2 < jj < JJ < 5H');
console.log('');

console.log('=== HOW TO START PLAYING ===');
console.log('1. Run: npm start');
console.log('2. When it\'s your turn, type one of the commands above');
console.log('3. Try "legal" first to see what moves you can make');
console.log('4. Have fun! 🎉');
console.log('');

console.log('Example first move:');
const firstCard = humanPlayer.hand[0];
console.log(`  play ${firstCard.notation}`);
console.log('');

console.log('🃏 Ready to play? Run "npm start" to begin! 🃏');