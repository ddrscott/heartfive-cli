import { GameStateManager } from './GameState';
import { BotManager, BotDecision, Difficulty } from '../ai/BotStrategy';
import { GameDisplay } from '../cli/Display';
import { InputParser, ParsedCommand } from '../cli/InputParser';
import { Player, Meld } from '../types';
import { PlayerModel } from '../models/Player';
import chalk from 'chalk';

export class GameController {
  private gameState: GameStateManager;
  private botStrategies: Map<string, any> = new Map();
  private isGameRunning: boolean = false;
  private lastRoundWinnerId: string | undefined;

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

  async startGame(): Promise<void> {
    this.isGameRunning = true;
    GameDisplay.displayWelcome();
    
    // Simulate players joining
    GameDisplay.displayPlayerJoined('Alice');
    GameDisplay.displayPlayerJoined('Bob');
    GameDisplay.displayPlayerJoined('Cat');
    GameDisplay.displayGameStart();
    
    while (this.isGameRunning) {
      await this.playRound();
      
      // Check if we should continue
      const winner = this.checkGameWin();
      if (winner) {
        GameDisplay.displayGameWinner(winner);
        break;
      }
      
      // Ask if player wants another round
      const playAgain = await this.askPlayAgain();
      if (!playAgain) {
        this.isGameRunning = false;
      }
    }
  }

  private async playRound(): Promise<void> {
    this.gameState.startNewRound(this.lastRoundWinnerId);
    
    // Display round start info
    const state = this.gameState.getState();
    const startingPlayer = state.players[state.currentPlayerIndex];
    GameDisplay.displayRoundStart(state.round, startingPlayer);
    
    let roundWinner: Player | null = null;

    while (!roundWinner) {
      const currentPlayer = this.gameState.getCurrentPlayer();
      let skipNextTurn = false;
      
      if (currentPlayer.isBot) {
        skipNextTurn = await this.handleBotTurn(currentPlayer);
      } else {
        skipNextTurn = await this.handleHumanTurn(currentPlayer);
      }

      roundWinner = this.gameState.checkRoundEnd();
      
      if (!roundWinner && !skipNextTurn) {
        this.gameState.nextTurn();
      }
    }

    GameDisplay.displayRoundWinner(roundWinner);
    this.lastRoundWinnerId = roundWinner.id;
  }

  private async handleHumanTurn(player: Player): Promise<boolean> {
    // Display the current state once at the start of turn
    GameDisplay.displayGameState(this.gameState.getState());
    
    while (true) {
      const legalMoves = this.gameState.getLegalMoves(player);
      
      if (legalMoves.length === 0) {
        console.log('You:           --           ' + chalk.gray(`[${player.hand.length} cards left]`));
        const newTrickStarted = this.gameState.pass(player);
        return newTrickStarted;
      }

      // Show prompt
      GameDisplay.displayYourTurn(this.gameState.getState());
      
      const input = await this.getPlayerInput('');
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
      // Fallback: pass
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
        // Display will be handled by displayGameState on next turn
        return false; // Successful play, no new trick
      } else {
        // Fallback to pass
        const newTrickStarted = this.gameState.pass(player);
        return newTrickStarted;
      }
    } else {
      const newTrickStarted = this.gameState.pass(player);
      return newTrickStarted;
    }

    return false;
  }

  private async processCommand(
    command: ParsedCommand,
    player: Player,
    legalMoves: Meld[]
  ): Promise<{ turnComplete: boolean; newTrickStarted?: boolean }> {
    switch (command.type) {
      case 'play':
        const playResult = this.handlePlayCommand(command.args.meld, player);
        return { turnComplete: playResult, newTrickStarted: false };
      
      case 'move':
        const moveResult = this.handleMoveCommand(command.args.moveNumber, player, legalMoves);
        return { turnComplete: moveResult, newTrickStarted: false };
      
      case 'pass':
        const newTrickStarted = this.gameState.pass(player);
        return { turnComplete: true, newTrickStarted };
      
      case 'hand':
        GameDisplay.displayHand(player.hand);
        return { turnComplete: false };
      
      case 'legal':
        GameDisplay.displayLegalMoves(legalMoves);
        return { turnComplete: false };
      
      case 'history':
        GameDisplay.displayPlayHistory(this.gameState.getRecentHistory(), this.gameState.getState().players);
        return { turnComplete: false };
      
      case 'score':
        this.displayScores();
        return { turnComplete: false };
      
      case 'sort':
        this.handleSortCommand(command.args.sortType, player);
        return { turnComplete: false };
      
      case 'help':
        GameDisplay.displayCommands();
        return { turnComplete: false };
      
      case 'unknown':
        GameDisplay.displayError(command.args?.error || 'Unknown command. Type "help" for available commands.');
        return { turnComplete: false };
      
      default:
        GameDisplay.displayError('Unknown command. Type "help" for available commands.');
        return { turnComplete: false };
    }
  }

  private handlePlayCommand(meld: Meld, player: Player): boolean {
    // Validate meld is legal
    if (!this.gameState.isLegalPlay(meld)) {
      GameDisplay.displayError('That play is not legal in the current situation.');
      return false;
    }

    // Validate player has the cards
    if (!InputParser.validateMeldAgainstHand(meld, player.hand)) {
      GameDisplay.displayError('You don\'t have those cards in your hand.');
      return false;
    }

    // Make the play
    const success = this.gameState.playMeld(player, meld);
    if (success) {
      // Display will be handled by displayGameState
      return true;
    } else {
      GameDisplay.displayError('Failed to play that meld.');
      return false;
    }
  }

  private handleMoveCommand(moveNumber: number, player: Player, legalMoves: Meld[]): boolean {
    if (moveNumber > legalMoves.length) {
      GameDisplay.displayError(`Invalid move number. Choose 1-${legalMoves.length}.`);
      return false;
    }

    const meld = legalMoves[moveNumber - 1];
    const success = this.gameState.playMeld(player, meld);
    
    if (success) {
      // Display will be handled by displayGameState
      return true;
    } else {
      GameDisplay.displayError('Failed to play that move.');
      return false;
    }
  }

  private handleSortCommand(sortType: string, player: Player): void {
    if (player instanceof PlayerModel) {
      player.sortHand(sortType === 'rank');
      GameDisplay.displaySuccess(`Hand sorted by ${sortType}.`);
    }
  }

  private displayScores(): void {
    console.log('\n' + '='.repeat(40));
    console.log('SCORES:');
    console.log('='.repeat(40));
    
    this.gameState.getState().players.forEach(player => {
      const total = player.wins + player.losses;
      const winRate = total === 0 ? 0 : (player.wins / total * 100).toFixed(1);
      console.log(`${player.name}: ${player.wins} wins, ${player.losses} losses (${winRate}%)`);
    });
    
    console.log('='.repeat(40) + '\n');
  }


  private checkGameWin(): Player | null {
    // Simple win condition: first to 10 wins
    return this.gameState.getState().players.find(p => p.wins >= 10) || null;
  }

  private async askPlayAgain(): Promise<boolean> {
    const input = await this.getPlayerInput('Play another round? (y/n): ');
    return input.toLowerCase().startsWith('y');
  }

  protected async getPlayerInput(prompt: string = '> '): Promise<string> {
    // This would be replaced with actual readline interface in a real CLI
    // For now, returning a mock response
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }

}