import { GameStateManager } from './GameState';
import { BotManager, BotDecision, Difficulty } from '../ai/BotStrategy';
import { InputParser, ParsedCommand } from '../cli/InputParser';
import { Player, Meld, GameState } from '../types/index';

export class InkGameController {
  private gameState: GameStateManager;
  private botStrategies: Map<string, any> = new Map();
  private isGameRunning: boolean = false;
  private lastRoundWinnerId: string | undefined;
  
  // Callbacks for React integration
  public onStateChange?: (state: GameState) => void;
  public onInputRequest?: (prompt: string) => Promise<string>;
  public onHint?: (hint: string) => void;
  public onExit?: () => void;
  public resolveInput?: (value: string) => void;

  constructor() {
    this.gameState = new GameStateManager(4);
    this.initializeBots();
  }

  private initializeBots(): void {
    const difficulties: Difficulty[] = ['intermediate', 'intermediate', 'advanced'];
    const botIds = ['alice', 'bob', 'cat'];
    
    botIds.forEach((botId, index) => {
      this.botStrategies.set(botId, BotManager.createBot(difficulties[index]));
    });
  }

  private emitStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.gameState.getState());
    }
  }

  async startGame(): Promise<void> {
    this.isGameRunning = true;
    this.emitStateChange();
    
    // Small delay for UI to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    while (this.isGameRunning) {
      await this.playRound();
      
      // Check if we should continue
      const winner = this.checkGameWin();
      if (winner) {
        // Update win/loss stats
        this.updateGameStats(winner);
        this.emitStateChange();
        
        if (this.onHint) {
          this.onHint(`GAME OVER! ${winner.name} wins the game!`);
        }
        
        // Ask if player wants to play again
        const playAgain = await this.askPlayNewGame();
        if (playAgain) {
          // Reset for new game
          this.gameState = new GameStateManager(4);
          this.lastRoundWinnerId = undefined;
          this.emitStateChange();
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        } else {
          this.isGameRunning = false;
          if (this.onExit) {
            this.onExit();
          }
          break;
        }
      }
    }
  }

  private async playRound(): Promise<void> {
    this.gameState.startNewRound(this.lastRoundWinnerId);
    this.emitStateChange();
    
    const state = this.gameState.getState();
    const startingPlayer = state.players[state.currentPlayerIndex];
    
    if (this.onHint) {
      if (state.round === 1) {
        this.onHint(`${startingPlayer.name} has 3H and can start round ${state.round}.`);
      } else {
        this.onHint(`${startingPlayer.name} won the previous round and leads round ${state.round}.`);
      }
    }
    
    let roundWinner: Player | null = null;

    while (!roundWinner) {
      const currentPlayer = this.gameState.getCurrentPlayer();
      let skipNextTurn = false;
      
      if (currentPlayer.isBot) {
        // Add a small delay for bot turns to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, 1000));
        skipNextTurn = await this.handleBotTurn(currentPlayer);
      } else {
        skipNextTurn = await this.handleHumanTurn(currentPlayer);
      }

      this.emitStateChange();
      roundWinner = this.gameState.checkRoundEnd();
      
      if (!roundWinner && !skipNextTurn) {
        this.gameState.nextTurn();
        this.emitStateChange();
      }
    }

    if (this.onHint) {
      this.onHint(`${roundWinner.name} wins the round!`);
    }
    this.lastRoundWinnerId = roundWinner.id;
  }

  private async handleHumanTurn(player: Player): Promise<boolean> {
    while (true) {
      const legalMoves = this.gameState.getLegalMoves(player);
      
      if (legalMoves.length === 0) {
        const newTrickStarted = this.gameState.pass(player);
        return newTrickStarted;
      }

      // Generate prompt
      const state = this.gameState.getState();
      let prompt = '> ';
      
      if (state.currentLeader === 'human' && !state.establishedMeldType) {
        prompt = 'You are the leader! Play any valid meld > ';
      } else if (state.lastPlay) {
        const lastPlayer = state.players.find(p => p.id === state.lastPlay!.player);
        const cardsStr = state.lastPlay.meld.cards.map(c => c.notation.replace('10', 'T')).join(' ');
        prompt = `Can you beat ${lastPlayer?.name}'s ${cardsStr} > `;
      }
      
      if (!this.onInputRequest) {
        throw new Error('onInputRequest callback not set');
      }
      
      const input = await this.onInputRequest(prompt);
      const command = InputParser.parseCommand(input);
      const result = await this.processCommand(command, player, legalMoves);
      
      if (result.turnComplete) {
        return result.newTrickStarted || false;
      }
    }
  }

  private async handleBotTurn(player: Player): Promise<boolean> {
    const legalMoves = this.gameState.getLegalMoves(player);
    const strategy = this.botStrategies.get(player.id);
    
    if (!strategy) {
      const newTrickStarted = this.gameState.pass(player);
      return newTrickStarted;
    }

    const decision: BotDecision = strategy.makeDecision(
      player,
      this.gameState.getState(),
      legalMoves
    );

    if (decision.action === 'play' && decision.meld) {
      const success = this.gameState.playMeld(player, decision.meld);
      if (success) {
        return false;
      } else {
        const newTrickStarted = this.gameState.pass(player);
        return newTrickStarted;
      }
    } else {
      const newTrickStarted = this.gameState.pass(player);
      return newTrickStarted;
    }
  }

  private async processCommand(
    command: ParsedCommand,
    player: Player,
    legalMoves: Meld[]
  ): Promise<{ turnComplete: boolean; newTrickStarted?: boolean }> {
    switch (command.type) {
      case 'play':
        // The InputParser already created the meld, so we just need to play it
        const playResult = this.handlePlayMeld(command.args.meld, player);
        return { turnComplete: playResult, newTrickStarted: false };
      
      case 'move':
        const moveResult = this.handleMoveCommand(command.args.moveNumber, player, legalMoves);
        return { turnComplete: moveResult, newTrickStarted: false };
      
      case 'pass':
        const newTrickStarted = this.gameState.pass(player);
        return { turnComplete: true, newTrickStarted };
      
      case 'legal':
        if (this.onHint) {
          if (legalMoves.length === 0) {
            this.onHint('No legal moves. You must pass.');
          } else {
            const movesStr = legalMoves.map((move, index) => 
              `${index + 1}. ${move.cards.map(c => c.notation).join(' ')}`
            ).join(', ');
            this.onHint(`Legal moves: ${movesStr}`);
          }
        }
        return { turnComplete: false };
      
      case 'help':
        if (this.onHint) {
          this.onHint('Commands: <cards> (e.g. 3H, 3H 3D, J1, J2), - (pass), legal, help');
        }
        return { turnComplete: false };
      
      case 'unknown':
        if (this.onHint) {
          this.onHint(command.args?.error || 'Unknown command. Type "help" for available commands.');
        }
        return { turnComplete: false };
      
      default:
        if (this.onHint) {
          this.onHint('Unknown command. Type "help" for available commands.');
        }
        return { turnComplete: false };
    }
  }

  private handlePlayMeld(meld: Meld, player: Player): boolean {
    // Check if player has these cards
    const hasAllCards = meld.cards.every(card =>
      player.hand.some(handCard =>
        handCard.rank === card.rank && handCard.suit === card.suit && handCard.isJoker === card.isJoker
      )
    );

    if (!hasAllCards) {
      if (this.onHint) {
        this.onHint('You don\'t have those cards.');
      }
      return false;
    }

    const success = this.gameState.playMeld(player, meld);
    
    if (!success) {
      if (this.onHint) {
        this.onHint('Invalid play. Try again.');
      }
      return false;
    }

    return true;
  }


  private handleMoveCommand(moveNumber: number, player: Player, legalMoves: Meld[]): boolean {
    if (moveNumber < 1 || moveNumber > legalMoves.length) {
      if (this.onHint) {
        this.onHint(`Invalid move number. Choose between 1 and ${legalMoves.length}.`);
      }
      return false;
    }

    const selectedMeld = legalMoves[moveNumber - 1];
    const success = this.gameState.playMeld(player, selectedMeld);
    
    if (!success) {
      if (this.onHint) {
        this.onHint('Failed to play selected move.');
      }
      return false;
    }

    return true;
  }

  private checkGameWin(): Player | null {
    const state = this.gameState.getState();
    return state.players.find(p => p.hand.length === 0) || null;
  }


  private async askPlayNewGame(): Promise<boolean> {
    if (!this.onInputRequest) return false;
    
    const answer = await this.onInputRequest('Play another game? (y/n) > ');
    return answer.toLowerCase().startsWith('y');
  }

  private updateGameStats(winner: Player): void {
    const state = this.gameState.getState();
    state.players.forEach(player => {
      if (player.id === winner.id) {
        player.wins++;
      } else {
        player.losses++;
      }
    });
  }
}