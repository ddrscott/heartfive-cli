#!/usr/bin/env node

const readline = require('readline');
const { GameStateManager, MeldDetector, CardModel, PlayerModel } = require('./dist/index.js');

// Simple color functions since colors v5 is ESM
const colors = {
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  boldRed: (text) => `\x1b[1m\x1b[31m${text}\x1b[0m`,
  boldGreen: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
  boldYellow: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`,
  boldMagenta: (text) => `\x1b[1m\x1b[35m${text}\x1b[0m`,
  boldWhite: (text) => `\x1b[1m\x1b[37m${text}\x1b[0m`,
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

// Game state
let game = new GameStateManager(4);
let currentInput = '';

// Helper functions
function displayGameState() {
  const state = game.getState();
  const currentPlayer = game.getCurrentPlayer();
  
  // Don't clear screen - we want a continuous log
  
  // Show current trick plays
  const currentTrickPlays = getCurrentTrickPlays(state);
  if (currentTrickPlays.length > 0) {
    currentTrickPlays.forEach(play => {
      console.log(play);
    });
    console.log('');
  }
  
  // Show human player's hand in grid format
  const humanPlayer = state.players.find(p => p.id === 'human');
  if (humanPlayer && currentPlayer.id === 'human') {
    displayHandGrid(humanPlayer.hand);
  }
}

function displayHandGrid(hand) {
  console.log('Your hand:');
  
  // Define rank order (3 is lowest, 2 is highest, then jokers)
  const rankOrder = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2', 'jj'];
  const suitOrder = ['H', 'S', 'D', 'C'];
  
  // Create a 2D grid: suits x ranks
  const grid = {};
  suitOrder.forEach(suit => {
    grid[suit] = {};
  });
  
  // Populate the grid
  hand.forEach(card => {
    if (card.isJoker) {
      // Handle jokers separately
      if (!grid['jj']) grid['jj'] = {};
      grid['jj']['jj'] = true;
    } else {
      const rank = card.rank === '10' ? 'T' : card.rank;
      grid[card.suit][rank] = true;
    }
  });
  
  // Display header with rank labels
  let header = '    ';
  rankOrder.forEach(rank => {
    header += rank.padEnd(4);
  });
  console.log(colors.gray(header));
  
  // Display each suit row
  suitOrder.forEach(suit => {
    let line = suit + ':  ';
    rankOrder.forEach(rank => {
      if (grid[suit] && grid[suit][rank]) {
        const cardNotation = rank + suit;
        
        // Special formatting
        if (cardNotation === '5H') {
          line += colors.boldRed(cardNotation.padEnd(4));
        } else if (suit === 'H' || suit === 'D') {
          line += colors.red(cardNotation.padEnd(4));
        } else {
          line += cardNotation.padEnd(4);
        }
      } else if (rank === 'jj' && grid['jj'] && grid['jj']['jj']) {
        // Skip joker slot for regular suits
        line += '.   ';
      } else {
        line += '.   ';
      }
    });
    console.log(line);
  });
  
  // Display jokers on separate line if present
  if (grid['jj'] && grid['jj']['jj']) {
    let jokerLine = 'J:  ';
    rankOrder.forEach(rank => {
      if (rank === 'jj') {
        jokerLine += colors.magenta('jj'.padEnd(4));
      } else {
        jokerLine += '.   ';
      }
    });
    console.log(jokerLine);
  }
}

function getCurrentTrickPlays(state) {
  const plays = [];
  
  // Get the plays since the last trick started
  let trickStart = state.playHistory.length;
  for (let i = state.playHistory.length - 1; i >= 0; i--) {
    const entry = state.playHistory[i];
    if (i === 0 || (state.playHistory[i - 1].action === 'pass' && 
        countConsecutivePasses(state.playHistory, i - 1) >= state.players.length - 1)) {
      trickStart = i;
      break;
    }
  }
  
  // Build play strings
  for (let i = trickStart; i < state.playHistory.length; i++) {
    const entry = state.playHistory[i];
    const player = state.players.find(p => p.id === entry.player);
    if (!player) continue;
    
    const playerName = player.id === 'human' ? 'You' : player.name;
    const paddedName = (playerName + ':').padEnd(7);
    
    if (entry.action === 'play' && entry.meld) {
      const formattedCards = formatMeldCards(entry.meld);
      const paddedCards = stripAnsi(formattedCards).padEnd(12);
      const cardsLeft = colors.gray(`[${player.hand.length} cards left]`);
      plays.push(`${paddedName} plays ${formattedCards}${' '.repeat(12 - stripAnsi(formattedCards).length)} ${cardsLeft}`);
    } else {
      const paddedDash = colors.gray('--').padEnd(12);
      const cardsLeft = colors.gray(`[${player.hand.length} cards left]`);
      plays.push(`${paddedName}       ${paddedDash}${' '.repeat(10)} ${cardsLeft}`);
    }
  }
  
  return plays;
}

function countConsecutivePasses(history, fromIndex) {
  let count = 0;
  for (let i = fromIndex; i >= 0; i--) {
    if (history[i].action === 'pass') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function formatMeldCards(meld) {
  return meld.cards.map(card => {
    // Convert 10 to T for display
    const notation = card.notation.replace('10', 'T');
    if (card.is5H) {
      return colors.boldRed(notation);
    } else if (card.isJoker) {
      return colors.boldMagenta(notation);
    } else if (card.suit === 'H' || card.suit === 'D') {
      return colors.boldRed(notation);
    } else {
      return colors.boldWhite(notation);
    }
  }).join(' ');
}

function formatMeld(meld) {
  return formatMeldCards(meld);
}

function formatMeldType(type) {
  const types = {
    'single': 'Single',
    'pair': 'Pair',
    'triple': 'Triple',
    'fullHouse': 'Full House',
    'sisters': 'Sisters',
    'run': 'Run',
    'fourOfKindBomb': 'Bomb',
    'straightFlushBomb': 'Straight Flush'
  };
  return types[type] || type;
}

function showHelp() {
  console.log('Commands:');
  console.log('  play <cards>  - Play cards (e.g., "play 5H" or "play 3H 3D")');
  console.log('  pass          - Pass your turn');
  console.log('  legal         - Show legal moves');
  console.log('  help          - Show this help');
}

function showLegalMoves(player) {
  const moves = game.getLegalMoves(player);
  
  if (moves.length === 0) {
    console.log('No legal moves. You must pass.');
    return moves;
  }
  
  console.log('Legal moves:');
  moves.forEach((move, index) => {
    const cards = move.cards.map(c => c.notation).join(' ');
    console.log(`${index + 1}. ${cards} (${formatMeldType(move.type)})`);
  });
  
  return moves;
}

function parseCards(input) {
  const parts = input.trim().split(/\s+/).slice(1);
  const cards = [];
  
  for (const part of parts) {
    const notation = part.toUpperCase().replace('10', 'T');
    try {
      cards.push(CardModel.fromNotation(notation));
    } catch (e) {
      throw new Error(`Invalid card: ${part}`);
    }
  }
  
  return cards;
}

function displayYourTurn(state) {
  const isLeader = state.currentLeader === 'human';
  const establishedType = state.establishedMeldType;
  
  if (isLeader && !establishedType) {
    console.log(colors.yellow('> You are the leader! Play any valid meld.'));
  } else if (state.lastPlay) {
    const lastPlayer = state.players.find(p => p.id === state.lastPlay.player);
    const cardsStr = stripAnsi(formatMeldCards(state.lastPlay.meld));
    process.stdout.write(`Can you beat ${lastPlayer.name}'s ${cardsStr} > `);
  } else {
    process.stdout.write('> ');
  }
}

async function handleBotTurn(player) {
  const state = game.getState();
  const isLeader = player.id === state.currentLeader;
  let moves = game.getLegalMoves(player);
  
  // If leader and no moves found, just play a single card
  if (isLeader && !state.establishedMeldType && moves.length === 0 && player.hand.length > 0) {
    // Fallback: create single card melds manually
    moves = player.hand.map(card => MeldDetector.createMeld([card])).filter(m => m !== null);
  }
  
  // Simple bot strategy
  
  // Leaders should always play something if they can
  if (isLeader && !state.establishedMeldType && moves.length > 0) {
    // Leader always plays when starting a new trick
    const move = moves[Math.floor(Math.random() * Math.min(5, moves.length))];
    const success = game.playMeld(player, move);
    if (success) {
      return false; // Successful play, no new trick
    } else {
      const newTrickStarted = game.pass(player);
      return newTrickStarted;
    }
  } else if (moves.length === 0 || (!isLeader && Math.random() < 0.3)) {
    const newTrickStarted = game.pass(player);
    return newTrickStarted;
  } else {
    const move = moves[Math.floor(Math.random() * moves.length)];
    const success = game.playMeld(player, move);
    if (success) {
      return false; // Successful play, no new trick
    } else {
      const newTrickStarted = game.pass(player);
      return newTrickStarted;
    }
  }
}

async function gameLoop() {
  console.log('You enter the game');
  console.log('Waiting for other players to start...');
  console.log('Alice enters the game');
  console.log('Bob enters the game');
  console.log('Cat enters the game');
  console.log('Game is dealt');
  
  let lastWinnerId = undefined;
  game.startNewRound(lastWinnerId);
  
  // Show who starts
  const state = game.getState();
  const startingPlayer = state.players[state.currentPlayerIndex];
  console.log('---');
  if (state.round === 1) {
    console.log(`${startingPlayer.name} has 3H and can start round ${state.round}.`);
  } else {
    console.log(`${startingPlayer.name} won the previous round and leads round ${state.round}.`);
  }
  
  while (true) {
    const currentPlayer = game.getCurrentPlayer();
    const state = game.getState();
    
    if (currentPlayer.id !== 'human') {
      const newTrickStarted = await handleBotTurn(currentPlayer);
      
      const winner = game.checkRoundEnd();
      if (winner) {
        console.log(`${winner.name} wins the round!`);
        lastWinnerId = winner.id;
        game.startNewRound(lastWinnerId);
        
        // Show who starts next round
        const newState = game.getState();
        const newStartingPlayer = newState.players[newState.currentPlayerIndex];
        console.log('---');
        if (newState.round === 1) {
          console.log(`${newStartingPlayer.name} has 3H and can start round ${newState.round}.`);
        } else {
          console.log(`${newStartingPlayer.name} won the previous round and leads round ${newState.round}.`);
        }
        continue;
      }
      
      if (!newTrickStarted) {
        game.nextTurn();
      }
      continue;
    }
    
    // Human turn
    displayGameState();
    displayYourTurn(state);
    
    const legalMoves = game.getLegalMoves(currentPlayer);
    
    const answer = await new Promise(resolve => {
      rl.once('line', resolve);
    });
    
    const input = answer.trim().toLowerCase();
    const parts = input.split(/\s+/);
    const command = parts[0];
    
    try {
      switch (command) {
        case 'quit':
        case 'exit':
          console.log('\nThanks for playing! 👋');
          rl.close();
          process.exit(0);
          break;
          
        case 'help':
          showHelp();
          break;
          
        case 'hand':
          displayHandGrid(currentPlayer.hand);
          break;
          
        case 'legal':
          showLegalMoves(currentPlayer);
          break;
          
        case 'pass':
          const newTrickStarted = game.pass(currentPlayer);
          if (!newTrickStarted) {
            game.nextTurn();
          }
          break;
          
        case 'play':
          const cards = parseCards(answer);
          const meld = MeldDetector.createMeld(cards);
          
          if (!meld) {
            console.log(colors.red('Error: Invalid card combination'));
            break;
          }
          
          if (!game.isLegalPlay(meld)) {
            console.log(colors.red('Error: That play is not legal right now'));
            break;
          }
          
          const success = game.playMeld(currentPlayer, meld);
          if (success) {
            const winner = game.checkRoundEnd();
            if (winner) {
              console.log(`${winner.name} wins the round!`);
              lastWinnerId = winner.id;
              game.startNewRound(lastWinnerId);
              
              // Show who starts next round
              const newState = game.getState();
              const newStartingPlayer = newState.players[newState.currentPlayerIndex];
              console.log('---');
              if (newState.round === 1) {
                console.log(`${newStartingPlayer.name} has 3H and can start round ${newState.round}.`);
              } else {
                console.log(`${newStartingPlayer.name} won the previous round and leads round ${newState.round}.`);
              }
              break;
            }
            
            game.nextTurn();
          }
          break;
          
        case 'move':
          const moveNum = parseInt(parts[1]);
          if (!moveNum || moveNum < 1 || moveNum > legalMoves.length) {
            console.log(colors.red('Error: Invalid move number'));
            break;
          }
          
          const selectedMove = legalMoves[moveNum - 1];
          const moveSuccess = game.playMeld(currentPlayer, selectedMove);
          
          if (moveSuccess) {
            const moveWinner = game.checkRoundEnd();
            if (moveWinner) {
              console.log(`${moveWinner.name} wins the round!`);
              lastWinnerId = moveWinner.id;
              game.startNewRound(lastWinnerId);
              
              // Show who starts next round
              const newState = game.getState();
              const newStartingPlayer = newState.players[newState.currentPlayerIndex];
              console.log('---');
              if (newState.round === 1) {
                console.log(`${newStartingPlayer.name} has 3H and can start round ${newState.round}.`);
              } else {
                console.log(`${newStartingPlayer.name} won the previous round and leads round ${newState.round}.`);
              }
              break;
            }
            
            game.nextTurn();
          }
          break;
          
        case 'sort':
          if (parts[1] === 'rank' || parts[1] === 'suit') {
            if (currentPlayer instanceof PlayerModel) {
              currentPlayer.sortHand(parts[1] === 'rank');
              console.log(`Hand sorted by ${parts[1]}`);
            }
          }
          break;
          
        default:
          console.log(colors.red('Error: Unknown command. Type "help" for commands.'));
      }
    } catch (error) {
      console.log(colors.red(`Error: ${error.message}`));
    }
  }
}

// Start game
gameLoop().catch(console.error);

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\nThanks for playing! 👋');
  process.exit(0);
});