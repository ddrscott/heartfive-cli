import { Card, Meld, MeldType } from '../types';
import { CardModel } from './Card';

export class MeldDetector {
  static detectMeldType(cards: Card[]): MeldType | null {
    if (!cards || cards.length === 0) return null;

    // Check for single card
    if (cards.length === 1) {
      return 'single';
    }

    // Check for pair
    if (cards.length === 2 && this.isPair(cards)) {
      return 'pair';
    }

    // Check for triple
    if (cards.length === 3 && this.isTriple(cards)) {
      return 'triple';
    }

    // Check for four of a kind bomb
    if (cards.length === 4 && this.isFourOfKind(cards)) {
      return 'fourOfKindBomb';
    }

    // Check for full house
    if (cards.length === 5 && this.isFullHouse(cards)) {
      return 'fullHouse';
    }

    // Check for sisters (consecutive pairs or triples)
    if (this.isSisters(cards)) {
      return 'sisters';
    }

    // Check for straight flush bomb
    if (cards.length >= 5 && this.isStraightFlush(cards)) {
      return 'straightFlushBomb';
    }

    // Check for run
    if (cards.length >= 5 && this.isRun(cards)) {
      return 'run';
    }

    return null;
  }

  static isPair(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    if (cards[0].isJoker || cards[1].isJoker) return false; // No jokers in pairs
    return cards[0].rank === cards[1].rank;
  }

  static isTriple(cards: Card[]): boolean {
    if (cards.length !== 3) return false;
    return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
  }

  static isFourOfKind(cards: Card[]): boolean {
    if (cards.length !== 4) return false;
    return cards.every(card => card.rank === cards[0].rank);
  }

  static isFullHouse(cards: Card[]): boolean {
    if (cards.length !== 5) return false;
    
    const rankCounts = this.getRankCounts(cards);
    const counts = Object.values(rankCounts);
    
    return counts.includes(3) && counts.includes(2);
  }

  static isSisters(cards: Card[]): boolean {
    // Check for triple sisters first (must be multiple of 3 and at least 6 cards)
    if (cards.length >= 6 && cards.length % 3 === 0) {
      if (this.isTripleSisters(cards)) {
        return true;
      }
    }
    
    // Check for pair sisters (must be multiple of 2 and at least 4 cards)
    if (cards.length >= 4 && cards.length % 2 === 0) {
      return this.isPairSisters(cards);
    }

    return false;
  }

  private static isPairSisters(cards: Card[]): boolean {
    if (cards.length % 2 !== 0) return false;

    const sortedCards = CardModel.sortBySingleRank(cards);
    const rankGroups: Record<string, Card[]> = {};
    
    // Group cards by rank
    for (const card of sortedCards) {
      if (!rankGroups[card.rank]) {
        rankGroups[card.rank] = [];
      }
      rankGroups[card.rank].push(card);
    }
    
    // Check all groups are pairs
    const ranks = Object.keys(rankGroups);
    for (const rank of ranks) {
      if (rankGroups[rank].length !== 2) {
        return false;
      }
    }
    
    // Sort ranks by value
    const sortedRanks = ranks.sort((a, b) => {
      const aCard = rankGroups[a][0];
      const bCard = rankGroups[b][0];
      return CardModel.getSingleRankValue(aCard) - CardModel.getSingleRankValue(bCard);
    });

    // Check if pairs are consecutive
    for (let i = 1; i < sortedRanks.length; i++) {
      const prevRankValue = CardModel.getSingleRankValue(rankGroups[sortedRanks[i - 1]][0]);
      const currRankValue = CardModel.getSingleRankValue(rankGroups[sortedRanks[i]][0]);
      
      if (currRankValue - prevRankValue !== 1) {
        return false;
      }
    }

    return true;
  }

  private static isTripleSisters(cards: Card[]): boolean {
    if (cards.length % 3 !== 0) return false;

    const sortedCards = CardModel.sortBySingleRank(cards);
    const rankGroups: Record<string, Card[]> = {};
    
    // Group cards by rank
    for (const card of sortedCards) {
      if (!rankGroups[card.rank]) {
        rankGroups[card.rank] = [];
      }
      rankGroups[card.rank].push(card);
    }
    
    // Check all groups are triples
    const ranks = Object.keys(rankGroups);
    for (const rank of ranks) {
      if (rankGroups[rank].length !== 3) {
        return false;
      }
    }
    
    // Sort ranks by value
    const sortedRanks = ranks.sort((a, b) => {
      const aCard = rankGroups[a][0];
      const bCard = rankGroups[b][0];
      return CardModel.getSingleRankValue(aCard) - CardModel.getSingleRankValue(bCard);
    });

    // Check if triples are consecutive
    for (let i = 1; i < sortedRanks.length; i++) {
      const prevRankValue = CardModel.getSingleRankValue(rankGroups[sortedRanks[i - 1]][0]);
      const currRankValue = CardModel.getSingleRankValue(rankGroups[sortedRanks[i]][0]);
      
      if (currRankValue - prevRankValue !== 1) {
        return false;
      }
    }

    return true;
  }

  static isRun(cards: Card[]): boolean {
    if (cards.length < 5) return false;
    if (cards.some(card => card.isJoker)) return false;

    // First check if all run rank values are valid
    const runValues = cards.map(c => CardModel.getRunRankValue(c));
    if (runValues.some(v => v <= 0)) return false;

    const sortedCards = [...cards].sort((a, b) => 
      CardModel.getRunRankValue(a) - CardModel.getRunRankValue(b)
    );

    // Check for special case: T-J-Q-K-A
    if (sortedCards.length >= 5 &&
        sortedCards[0].rank === 'A' &&
        sortedCards[sortedCards.length - 1].rank === 'K') {
      // Check if we have T-J-Q-K after A
      const withoutA = sortedCards.slice(1);
      let isConsecutive = true;
      
      for (let i = 1; i < withoutA.length; i++) {
        const prevValue = CardModel.getRunRankValue(withoutA[i - 1]);
        const currValue = CardModel.getRunRankValue(withoutA[i]);
        
        if (currValue - prevValue !== 1) {
          isConsecutive = false;
          break;
        }
      }
      
      // If cards after A are consecutive and start with T, it's valid
      if (isConsecutive && withoutA[0].rank === 'T') {
        return true;
      }
    }

    // Normal consecutive check
    for (let i = 1; i < sortedCards.length; i++) {
      const prevValue = CardModel.getRunRankValue(sortedCards[i - 1]);
      const currValue = CardModel.getRunRankValue(sortedCards[i]);
      
      if (currValue - prevValue !== 1) {
        return false;
      }
    }

    return true;
  }

  static isStraightFlush(cards: Card[]): boolean {
    if (!this.isRun(cards)) return false;
    
    // All cards must have the same suit
    const suit = cards[0].suit;
    return cards.every(card => card.suit === suit);
  }

  static getMeldStrength(meld: Meld): number {
    switch (meld.type) {
      case 'single':
        return CardModel.getSingleRankValue(meld.cards[0]);
      
      case 'pair':
      case 'triple':
        return CardModel.getSingleRankValue(meld.cards[0]);
      
      case 'fullHouse':
        // Strength determined by the triple
        const rankCounts = this.getRankCounts(meld.cards);
        for (const [rank, count] of Object.entries(rankCounts)) {
          if (count === 3) {
            // For 5H in the triple, return 16, otherwise return normal rank value
            const card = meld.cards.find(c => c.rank === rank)!;
            if (card.notation === '5H' && meld.cards.filter(c => c.notation === '5H').length > 0) {
              // Only if one of the 5s is actually the 5H
              const fiveCards = meld.cards.filter(c => c.rank === '5');
              if (fiveCards.some(c => c.is5H)) {
                return 16;
              }
            }
            return CardModel.getSingleRankValue(card);
          }
        }
        return 0;
      
      case 'sisters':
        // Strength determined by highest pair/triple
        const sortedCards = CardModel.sortBySingleRank(meld.cards);
        return CardModel.getSingleRankValue(sortedCards[sortedCards.length - 1]);
      
      case 'run':
      case 'straightFlushBomb':
        // Strength determined by highest card in run ranking
        const runSorted = [...meld.cards].sort((a, b) => 
          CardModel.getRunRankValue(a) - CardModel.getRunRankValue(b)
        );
        return CardModel.getRunRankValue(runSorted[runSorted.length - 1]);
      
      case 'fourOfKindBomb':
        return CardModel.getSingleRankValue(meld.cards[0]);
      
      default:
        return 0;
    }
  }

  static canBeat(currentMeld: Meld, previousMeld: Meld): boolean {
    // Bombs can beat any non-bomb meld
    if (this.isBomb(currentMeld.type) && !this.isBomb(previousMeld.type)) {
      return true;
    }

    // Straight flush bomb beats four of a kind bomb
    if (currentMeld.type === 'straightFlushBomb' && previousMeld.type === 'fourOfKindBomb') {
      return true;
    }

    // Must match meld type (except bombs)
    if (currentMeld.type !== previousMeld.type) {
      return false;
    }

    // For runs and straight flushes, also check length
    if (currentMeld.type === 'run' || currentMeld.type === 'straightFlushBomb') {
      if (currentMeld.cards.length !== previousMeld.cards.length) {
        return false;
      }
    }

    // Compare strengths
    return this.getMeldStrength(currentMeld) > this.getMeldStrength(previousMeld);
  }

  private static isBomb(meldType: MeldType): boolean {
    return meldType === 'fourOfKindBomb' || meldType === 'straightFlushBomb';
  }

  private static getRankCounts(cards: Card[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const card of cards) {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    
    return counts;
  }

  static createMeld(cards: Card[]): Meld | null {
    const type = this.detectMeldType(cards);
    if (!type) return null;

    return {
      type,
      cards: [...cards],
      strength: this.getMeldStrength({ type, cards, strength: 0 })
    };
  }
}