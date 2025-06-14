import { GameState, Player, Meld, MeldType, Card } from '../types';
import { PlayerModel } from '../models/Player';
import { Deck } from '../models/Deck';
import { MeldDetector } from '../models/Meld';

export class GameStateManager {
  private state: GameState;

  constructor(playerCount: number = 4) {
    this.state = this.initializeGame(playerCount);
  }

  private initializeGame(playerCount: number): GameState {
    // Create players
    const players: Player[] = [
      PlayerModel.createHumanPlayer(),
      PlayerModel.createBotPlayer('alice', 'Alice'),
      PlayerModel.createBotPlayer('bob', 'Bob'),
      PlayerModel.createBotPlayer('cat', 'Cat')
    ].slice(0, playerCount);

    return {
      round: 1,
      players,
      currentPlayerIndex: 0,
      currentLeader: '',
      establishedMeldType: undefined,
      lastPlay: undefined,
      consecutivePasses: 0,
      deck: [],
      playHistory: []
    };
  }

  startNewRound(previousRoundWinnerId?: string): void {
    this.state.round++;
    this.state.playHistory = [];
    this.state.lastPlay = undefined;
    this.state.establishedMeldType = undefined;
    this.state.consecutivePasses = 0;

    // Deal cards
    this.dealCards();

    // Determine starting player
    let startingPlayerIndex: number;
    
    if (this.state.round === 1) {
      // First round: find who has 3H
      startingPlayerIndex = this.findStartingPlayer();
    } else if (previousRoundWinnerId) {
      // Subsequent rounds: previous winner leads
      startingPlayerIndex = this.state.players.findIndex(p => p.id === previousRoundWinnerId);
      if (startingPlayerIndex === -1) {
        // Fallback if winner not found
        startingPlayerIndex = 0;
      }
    } else {
      // Fallback: first player
      startingPlayerIndex = 0;
    }
    
    this.state.currentPlayerIndex = startingPlayerIndex;
    this.state.currentLeader = this.state.players[startingPlayerIndex].id;
  }

  private dealCards(): void {
    // Clear all hands
    this.state.players.forEach(player => {
      if (player instanceof PlayerModel) {
        player.clearHand();
      } else {
        player.hand = [];
      }
    });

    // Create and shuffle deck
    const deck = new Deck(true);
    deck.shuffle();
    
    // Deal to players
    const hands = deck.dealToPlayers(this.state.players.length);
    
    this.state.players.forEach((player, index) => {
      if (player instanceof PlayerModel) {
        player.addCards(hands[index]);
      } else {
        player.hand = hands[index];
      }
    });

    this.state.deck = deck.getCards();
  }

  private findStartingPlayer(): number {
    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      if (player instanceof PlayerModel) {
        if (player.findStartingPlayer()) {
          return i;
        }
      } else {
        if (player.hand.some(card => card.notation === '3H')) {
          return i;
        }
      }
    }
    // If no 3H found (shouldn't happen), start with first player
    return 0;
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  getLeader(): Player | null {
    return this.state.players.find(p => p.id === this.state.currentLeader) || null;
  }

  playMeld(player: Player, meld: Meld): boolean {
    // Validate player has the cards
    if (player instanceof PlayerModel) {
      if (!player.hasCards(meld.cards)) {
        return false;
      }
    } else {
      const handNotations = player.hand.map(c => c.notation);
      if (!meld.cards.every(card => handNotations.includes(card.notation))) {
        return false;
      }
    }

    // Validate meld is legal
    if (!this.isLegalPlay(meld)) {
      return false;
    }

    // Remove cards from player's hand
    if (player instanceof PlayerModel) {
      player.removeCards(meld.cards);
    } else {
      const notations = meld.cards.map(c => c.notation);
      player.hand = player.hand.filter(card => !notations.includes(card.notation));
    }

    // Update game state
    this.state.lastPlay = {
      player: player.id,
      meld
    };

    if (!this.state.establishedMeldType) {
      this.state.establishedMeldType = meld.type;
    }

    this.state.consecutivePasses = 0;

    // Add to play history
    this.state.playHistory.push({
      player: player.id,
      action: 'play',
      meld
    });

    return true;
  }

  pass(player: Player): boolean {
    this.state.consecutivePasses++;
    
    this.state.playHistory.push({
      player: player.id,
      action: 'pass'
    });

    // If everyone else passed, current leader wins the trick
    if (this.state.consecutivePasses >= this.state.players.length - 1) {
      this.startNewTrick();
      return true; // New trick started
    }
    
    return false; // Normal pass, continue to next player
  }

  private startNewTrick(): void {
    // The last player to play becomes the new leader
    if (this.state.lastPlay) {
      this.state.currentLeader = this.state.lastPlay.player;
      const leaderIndex = this.state.players.findIndex(p => p.id === this.state.currentLeader);
      this.state.currentPlayerIndex = leaderIndex;
    }

    // Reset for new trick
    this.state.establishedMeldType = undefined;
    this.state.lastPlay = undefined;
    this.state.consecutivePasses = 0;
  }

  nextTurn(): void {
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
  }

  isLegalPlay(meld: Meld): boolean {
    // If no established meld type, any valid meld is legal
    if (!this.state.establishedMeldType) {
      return true;
    }

    // Bombs can always be played
    if (meld.type === 'fourOfKindBomb' || meld.type === 'straightFlushBomb') {
      // If there's a last play, bomb must beat it
      if (this.state.lastPlay) {
        return MeldDetector.canBeat(meld, this.state.lastPlay.meld);
      }
      return true;
    }

    // Otherwise, must match established meld type
    if (meld.type !== this.state.establishedMeldType) {
      return false;
    }

    // And must beat the last play
    if (this.state.lastPlay) {
      return MeldDetector.canBeat(meld, this.state.lastPlay.meld);
    }

    return true;
  }

  getLegalMoves(player: Player): Meld[] {
    const legalMoves: Meld[] = [];
    const hand = player.hand;

    // If player is leader and no established meld, can play anything
    if (player.id === this.state.currentLeader && !this.state.establishedMeldType) {
      // Try all possible combinations
      legalMoves.push(...this.findAllPossibleMelds(hand));
    } else if (this.state.establishedMeldType) {
      // Must play matching meld type or bomb
      legalMoves.push(...this.findMeldsOfType(hand, this.state.establishedMeldType));
      legalMoves.push(...this.findBombs(hand));
      
      // Filter to only those that beat last play
      if (this.state.lastPlay) {
        return legalMoves.filter(meld => 
          MeldDetector.canBeat(meld, this.state.lastPlay!.meld)
        );
      }
    }

    return legalMoves;
  }

  private findAllPossibleMelds(hand: Card[]): Meld[] {
    const melds: Meld[] = [];

    // Singles
    hand.forEach(card => {
      const meld = MeldDetector.createMeld([card]);
      if (meld) melds.push(meld);
    });

    // Pairs, triples, four of a kind
    const rankGroups = this.groupByRank(hand);
    for (const cards of Object.values(rankGroups)) {
      if (cards.length >= 2 && !cards[0].isJoker) {
        // Pairs
        for (let i = 0; i < cards.length - 1; i++) {
          for (let j = i + 1; j < cards.length; j++) {
            const meld = MeldDetector.createMeld([cards[i], cards[j]]);
            if (meld) melds.push(meld);
          }
        }
      }
      
      if (cards.length >= 3) {
        // Triples
        for (let i = 0; i < cards.length - 2; i++) {
          for (let j = i + 1; j < cards.length - 1; j++) {
            for (let k = j + 1; k < cards.length; k++) {
              const meld = MeldDetector.createMeld([cards[i], cards[j], cards[k]]);
              if (meld) melds.push(meld);
            }
          }
        }
      }

      if (cards.length === 4) {
        // Four of a kind bomb
        const meld = MeldDetector.createMeld(cards);
        if (meld) melds.push(meld);
      }
    }

    // Add more complex meld detection here (runs, sisters, full houses)
    // This is a simplified version - full implementation would be more comprehensive

    return melds;
  }

  private findMeldsOfType(hand: Card[], type: MeldType): Meld[] {
    // Simplified - would need full implementation for all meld types
    const allMelds = this.findAllPossibleMelds(hand);
    return allMelds.filter(meld => meld.type === type);
  }

  private findBombs(hand: Card[]): Meld[] {
    const bombs: Meld[] = [];
    
    // Four of a kind bombs
    const rankGroups = this.groupByRank(hand);
    for (const cards of Object.values(rankGroups)) {
      if (cards.length === 4) {
        const meld = MeldDetector.createMeld(cards);
        if (meld && meld.type === 'fourOfKindBomb') {
          bombs.push(meld);
        }
      }
    }

    // Straight flush bombs - simplified
    // Would need more complex logic to find all possible straight flushes

    return bombs;
  }

  private groupByRank(cards: Card[]): Record<string, Card[]> {
    const groups: Record<string, Card[]> = {};
    
    cards.forEach(card => {
      if (!groups[card.rank]) {
        groups[card.rank] = [];
      }
      groups[card.rank].push(card);
    });

    return groups;
  }

  checkRoundEnd(): Player | null {
    // Check if any player has no cards left
    const winner = this.state.players.find(player => player.hand.length === 0);
    
    if (winner) {
      // Update win/loss records
      this.state.players.forEach(player => {
        if (player instanceof PlayerModel) {
          if (player.id === winner.id) {
            player.recordWin();
          } else if (player.hand.length > 0) {
            // Only record loss if player still has cards
            player.recordLoss();
          }
        }
      });

      return winner;
    }

    return null;
  }

  getState(): GameState {
    return { ...this.state };
  }

  getPlayHistory(): Array<{ player: string; action: 'play' | 'pass'; meld?: Meld }> {
    return [...this.state.playHistory];
  }

  getRecentHistory(count: number = 5): Array<{ player: string; action: 'play' | 'pass'; meld?: Meld }> {
    return this.state.playHistory.slice(-count);
  }
}