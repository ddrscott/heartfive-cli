import { Player, Meld, Card, GameState } from '../types';
import { MeldDetector } from '../models/Meld';
import { CardModel } from '../models/Card';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface BotDecision {
  action: 'play' | 'pass';
  meld?: Meld;
}

export abstract class BotStrategy {
  protected difficulty: Difficulty;

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  abstract makeDecision(
    player: Player,
    gameState: GameState,
    legalMoves: Meld[]
  ): BotDecision;

  protected hasBombInHand(hand: Card[]): boolean {
    const rankGroups = this.groupByRank(hand);
    
    // Check for four of a kind
    for (const cards of Object.values(rankGroups)) {
      if (cards.length === 4) {
        return true;
      }
    }

    // TODO: Check for straight flush bombs
    return false;
  }

  protected has5HInHand(hand: Card[]): boolean {
    return hand.some(card => card.is5H);
  }

  protected groupByRank(cards: Card[]): Record<string, Card[]> {
    const groups: Record<string, Card[]> = {};
    
    cards.forEach(card => {
      if (!groups[card.rank]) {
        groups[card.rank] = [];
      }
      groups[card.rank].push(card);
    });

    return groups;
  }

  protected evaluateHandStrength(hand: Card[]): number {
    let strength = 0;
    
    // High singles
    hand.forEach(card => {
      const value = CardModel.getSingleRankValue(card);
      if (value >= 13) { // A or higher
        strength += value;
      }
    });

    // Bombs
    if (this.hasBombInHand(hand)) {
      strength += 100;
    }

    // 5H
    if (this.has5HInHand(hand)) {
      strength += 50;
    }

    return strength;
  }
}

export class BeginnerBot extends BotStrategy {
  constructor() {
    super('beginner');
  }

  makeDecision(
    player: Player,
    gameState: GameState,
    legalMoves: Meld[]
  ): BotDecision {
    // Beginner bot: plays randomly from legal moves
    if (legalMoves.length === 0) {
      return { action: 'pass' };
    }

    // 70% chance to play, 30% to pass (if not leader)
    if (player.id !== gameState.currentLeader && Math.random() < 0.3) {
      return { action: 'pass' };
    }

    // Play random legal move
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return {
      action: 'play',
      meld: legalMoves[randomIndex]
    };
  }
}

export class IntermediateBot extends BotStrategy {
  constructor() {
    super('intermediate');
  }

  makeDecision(
    player: Player,
    gameState: GameState,
    legalMoves: Meld[]
  ): BotDecision {
    if (legalMoves.length === 0) {
      return { action: 'pass' };
    }

    // Sort moves by strength (weakest first)
    const sortedMoves = [...legalMoves].sort((a, b) => 
      MeldDetector.getMeldStrength(a) - MeldDetector.getMeldStrength(b)
    );

    // If leader, prefer to play smaller melds to save big cards
    if (player.id === gameState.currentLeader) {
      // Play weakest legal move
      return {
        action: 'play',
        meld: sortedMoves[0]
      };
    }

    // If not leader, consider hand strength
    const handStrength = this.evaluateHandStrength(player.hand);
    const cardsRemaining = player.hand.length;

    // If we have few cards left, be more aggressive
    if (cardsRemaining <= 5) {
      // Play strongest move to try to win tricks
      return {
        action: 'play',
        meld: sortedMoves[sortedMoves.length - 1]
      };
    }

    // If we have strong hand, save bombs for later
    if (handStrength > 150 && !this.isBomb(sortedMoves[0])) {
      // Play weakest non-bomb
      const nonBombs = sortedMoves.filter(m => !this.isBomb(m));
      if (nonBombs.length > 0) {
        return {
          action: 'play',
          meld: nonBombs[0]
        };
      }
    }

    // Default: play weakest move
    return {
      action: 'play',
      meld: sortedMoves[0]
    };
  }

  private isBomb(meld: Meld): boolean {
    return meld.type === 'fourOfKindBomb' || meld.type === 'straightFlushBomb';
  }
}

export class AdvancedBot extends BotStrategy {
  constructor() {
    super('advanced');
  }

  makeDecision(
    player: Player,
    gameState: GameState,
    legalMoves: Meld[]
  ): BotDecision {
    if (legalMoves.length === 0) {
      return { action: 'pass' };
    }

    // Advanced strategy with multiple considerations
    const analysis = this.analyzeGameState(player, gameState);
    const sortedMoves = this.rankMoves(legalMoves, player, gameState, analysis);

    // Decision making based on analysis
    if (analysis.shouldPass) {
      return { action: 'pass' };
    }

    return {
      action: 'play',
      meld: sortedMoves[0]
    };
  }

  private analyzeGameState(player: Player, gameState: GameState): any {
    const cardsRemaining = player.hand.length;
    const isLeader = player.id === gameState.currentLeader;
    const opponentCardCounts = gameState.players
      .filter(p => p.id !== player.id)
      .map(p => p.hand.length);
    const minOpponentCards = Math.min(...opponentCardCounts);

    // Check if anyone is close to winning
    const someoneCloseToWinning = minOpponentCards <= 3;

    // Check our bomb availability
    const hasBomb = this.hasBombInHand(player.hand);
    const has5H = this.has5HInHand(player.hand);

    // Should we pass?
    let shouldPass = false;
    if (!isLeader && cardsRemaining > 10 && !someoneCloseToWinning) {
      // Consider passing to save good cards
      const lastPlayStrength = gameState.lastPlay 
        ? MeldDetector.getMeldStrength(gameState.lastPlay.meld)
        : 0;
      
      // Pass if last play is very strong and we're not in danger
      if (lastPlayStrength > 10 && Math.random() < 0.4) {
        shouldPass = true;
      }
    }

    return {
      cardsRemaining,
      isLeader,
      someoneCloseToWinning,
      hasBomb,
      has5H,
      shouldPass,
      minOpponentCards
    };
  }

  private rankMoves(
    moves: Meld[],
    player: Player,
    gameState: GameState,
    analysis: any
  ): Meld[] {
    return moves.sort((a, b) => {
      const scoreA = this.scoreMeld(a, player, gameState, analysis);
      const scoreB = this.scoreMeld(b, player, gameState, analysis);
      return scoreB - scoreA; // Higher score = better move
    });
  }

  private scoreMeld(
    meld: Meld,
    player: Player,
    _gameState: GameState,
    analysis: any
  ): number {
    let score = 0;
    const strength = MeldDetector.getMeldStrength(meld);
    const isBomb = meld.type === 'fourOfKindBomb' || meld.type === 'straightFlushBomb';

    // Base score from strength
    score += strength;

    // Adjust based on game situation
    if (analysis.isLeader) {
      // As leader, prefer smaller melds to maintain control
      score -= meld.cards.length * 2;
      
      // Prefer singles and pairs when we have many cards
      if (analysis.cardsRemaining > 10) {
        if (meld.type === 'single') score += 10;
        if (meld.type === 'pair') score += 8;
      }
    } else {
      // As follower, consider if we want to win this trick
      if (analysis.someoneCloseToWinning && !isBomb) {
        // Save bombs for critical moments
        score -= 20;
      }
    }

    // Bomb scoring
    if (isBomb) {
      if (analysis.someoneCloseToWinning || analysis.cardsRemaining <= 5) {
        // Use bombs when critical
        score += 50;
      } else {
        // Otherwise save them
        score -= 30;
      }
    }

    // 5H scoring
    if (meld.cards.some(c => c.is5H)) {
      if (analysis.cardsRemaining <= 3 || analysis.minOpponentCards <= 2) {
        // Use 5H to finish
        score += 100;
      } else {
        // Save 5H
        score -= 50;
      }
    }

    // Prefer to empty rank groups
    const rankGroups = this.groupByRank(player.hand);
    const ranksInMeld = new Set(meld.cards.map(c => c.rank));
    
    for (const rank of ranksInMeld) {
      if (rankGroups[rank] && rankGroups[rank].length === meld.cards.filter(c => c.rank === rank).length) {
        // This play empties a rank group
        score += 5;
      }
    }

    return score;
  }
}

export class BotManager {
  static createBot(difficulty: Difficulty): BotStrategy {
    switch (difficulty) {
      case 'beginner':
        return new BeginnerBot();
      case 'intermediate':
        return new IntermediateBot();
      case 'advanced':
        return new AdvancedBot();
      default:
        return new IntermediateBot();
    }
  }
}