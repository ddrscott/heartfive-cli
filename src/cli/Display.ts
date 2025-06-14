import chalk from 'chalk';
import { GameState, Player, Meld } from '../types';

export class GameDisplay {
  static displayGameState(gameState: GameState, humanPlayerId: string = 'human'): void {
    // Don't clear screen - we want a continuous log
    
    // Show current trick plays
    const currentTrickPlays = this.getCurrentTrickPlays(gameState);
    if (currentTrickPlays.length > 0) {
      currentTrickPlays.forEach(play => {
        console.log(play);
      });
      console.log('');
    }
    
    // Show human player's hand in grid format
    const humanPlayer = gameState.players.find(p => p.id === humanPlayerId);
    if (humanPlayer) {
      this.displayHandGrid(humanPlayer.hand);
    }
  }

  static displayHandGrid(hand: any[]): void {
    console.log('Your hand:');
    
    // Define rank order (3 is lowest, 2 is highest, then jokers)
    const rankOrder = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2', 'jj'];
    const suitOrder = ['H', 'S', 'D', 'C'];
    
    // Create a 2D grid: suits x ranks
    const grid: Record<string, Record<string, boolean>> = {};
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
    console.log(chalk.gray(header));
    
    // Display each suit row
    suitOrder.forEach(suit => {
      let line = suit + ':  ';
      rankOrder.forEach(rank => {
        if (grid[suit] && grid[suit][rank]) {
          const cardNotation = rank + suit;
          
          // Special formatting
          if (cardNotation === '5H') {
            line += chalk.bold.red(cardNotation.padEnd(4));
          } else if (suit === 'H' || suit === 'D') {
            line += chalk.red(cardNotation.padEnd(4));
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
          jokerLine += chalk.magenta('jj'.padEnd(4));
        } else {
          jokerLine += '.   ';
        }
      });
      console.log(jokerLine);
    }
  }

  static getCurrentTrickPlays(gameState: GameState): string[] {
    const plays: string[] = [];
    
    // Get the plays since the last trick started
    let trickStart = gameState.playHistory.length;
    for (let i = gameState.playHistory.length - 1; i >= 0; i--) {
      if (i === 0 || (gameState.playHistory[i - 1].action === 'pass' && 
          this.countConsecutivePasses(gameState.playHistory, i - 1) >= gameState.players.length - 1)) {
        trickStart = i;
        break;
      }
    }
    
    // Build play strings
    for (let i = trickStart; i < gameState.playHistory.length; i++) {
      const entry = gameState.playHistory[i];
      const player = gameState.players.find(p => p.id === entry.player);
      if (!player) continue;
      
      const playerName = player.id === 'human' ? 'You' : player.name;
      const paddedName = (playerName + ':').padEnd(7);
      
      if (entry.action === 'play' && entry.meld) {
        const formattedCards = this.formatMeldCards(entry.meld);
        const cardsLeft = chalk.gray(`[${player.hand.length} cards left]`);
        plays.push(`${paddedName} plays ${formattedCards}${' '.repeat(12 - this.stripAnsi(formattedCards).length)} ${cardsLeft}`);
      } else {
        const paddedDash = chalk.gray('--').padEnd(12);
        const cardsLeft = chalk.gray(`[${player.hand.length} cards left]`);
        plays.push(`${paddedName}       ${paddedDash}${' '.repeat(10)} ${cardsLeft}`);
      }
    }
    
    return plays;
  }

  static stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  static formatMeldCards(meld: Meld): string {
    return meld.cards.map(card => {
      // Convert 10 to T for display
      const notation = card.notation.replace('10', 'T');
      if (card.is5H) {
        return chalk.bold.red(notation);
      } else if (card.isJoker) {
        return chalk.bold.magenta(notation);
      } else if (card.suit === 'H' || card.suit === 'D') {
        return chalk.bold.red(notation);
      } else {
        return chalk.bold.white(notation);
      }
    }).join(' ');
  }

  static countConsecutivePasses(history: any[], fromIndex: number): number {
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

  static displayHand(hand: any[]): void {
    this.displayHandGrid(hand);
  }

  static displayLegalMoves(moves: Meld[]): void {
    if (moves.length === 0) {
      console.log('No legal moves. You must pass.');
      return;
    }

    console.log('Legal moves:');
    moves.forEach((move, index) => {
      const cards = move.cards.map(c => c.notation).join(' ');
      console.log(`${index + 1}. ${cards} (${this.formatMeldType(move.type)})`);
    });
  }

  static displayPlayHistory(history: Array<{ player: string; action: 'play' | 'pass'; meld?: Meld }>, players: Player[]): void {
    console.log('--- Play History ---');
    history.slice(-15).forEach(entry => {
      const player = players.find(p => p.id === entry.player);
      const playerName = player?.name || entry.player;
      
      if (entry.action === 'play' && entry.meld) {
        const cards = entry.meld.cards.map(c => c.notation).join(' ');
        console.log(`${playerName}: ${cards}`);
      } else {
        console.log(`${playerName}: passed`);
      }
    });
    console.log('---');
  }

  static displayCommands(): void {
    console.log('Commands:');
    console.log('  play <cards>  - Play cards (e.g., "play 5H" or "play 3H 3D")');
    console.log('  pass          - Pass your turn');
    console.log('  legal         - Show legal moves');
    console.log('  help          - Show this help');
  }

  static displayWelcome(): void {
    console.log('You enter the game');
    console.log('Waiting for other players to start...');
  }

  static displayPlayerJoined(playerName: string): void {
    console.log(`${playerName} enters the game`);
  }

  static displayGameStart(): void {
    console.log('Game is dealt');
  }

  static displayRoundStart(round: number, firstPlayer: Player): void {
    console.log('---');
    console.log(`${firstPlayer.name} has 3H and can start round ${round}.`);
  }

  static displayRoundWinner(winner: Player): void {
    console.log(`${winner.name} wins the round!`);
  }

  static displayGameWinner(winner: Player): void {
    console.log('---');
    console.log(`GAME OVER! ${winner.name} wins the game!`);
  }

  static displayError(message: string): void {
    console.log(chalk.red(`Error: ${message}`));
  }

  static displayInfo(message: string): void {
    console.log(message);
  }

  static displaySuccess(message: string): void {
    console.log(message);
  }

  static displayYourTurn(isLeader: boolean, establishedType?: string): void {
    if (isLeader && !establishedType) {
      console.log(chalk.yellow('> You are the leader! Play any valid meld.'));
    } else {
      console.log('> ');
    }
  }

  private static formatMeldType(type: string): string {
    const typeMap: Record<string, string> = {
      'single': 'Single',
      'pair': 'Pair',
      'triple': 'Triple',
      'fullHouse': 'Full House',
      'sisters': 'Sisters',
      'run': 'Run',
      'fourOfKindBomb': 'Bomb',
      'straightFlushBomb': 'Straight Flush'
    };
    
    return typeMap[type] || type;
  }
}