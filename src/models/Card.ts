import { Card, CardNotation, Rank, Suit, JokerType } from '../types';

export class CardModel implements Card {
  rank: Rank | JokerType;
  suit?: Suit;
  notation: CardNotation;
  isJoker: boolean;
  is5H: boolean;

  constructor(notation: CardNotation) {
    this.notation = notation;
    this.isJoker = notation === 'J1' || notation === 'J2';
    this.is5H = notation === '5H';

    if (this.isJoker) {
      this.rank = notation as JokerType;
    } else {
      this.rank = notation[0] as Rank;
      this.suit = notation[1] as Suit;
    }
  }

  static fromNotation(notation: CardNotation): CardModel {
    return new CardModel(notation);
  }

  static getSingleRankValue(card: Card): number {
    const singleRanks = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2', 'J1', 'J2'];
    
    if (card.is5H) {
      return 16; // Highest value
    }
    
    const index = singleRanks.indexOf(card.rank);
    return index >= 0 ? index + 1 : 0;
  }

  static getRunRankValue(card: Card): number {
    if (card.isJoker) {
      return -1; // Jokers can't be in runs
    }
    
    // impossible to have a rank starting at 'A' in a run
    // 'A' is the highest rank in runs
    const runRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const index = runRanks.indexOf(card.rank as Rank);
    return index >= 0 ? index + 1 : 0;
  }

  static compare(a: Card, b: Card): number {
    return CardModel.getSingleRankValue(a) - CardModel.getSingleRankValue(b);
  }

  static sortBySingleRank(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => CardModel.compare(a, b));
  }

  static sortBySuit(cards: Card[]): Card[] {
    const suitOrder = ['C', 'D', 'H', 'S'];
    return [...cards].sort((a, b) => {
      if (a.isJoker && b.isJoker) {
        return a.rank === 'J1' ? -1 : 1;
      }
      if (a.isJoker) return 1;
      if (b.isJoker) return -1;
      
      const suitDiff = suitOrder.indexOf(a.suit!) - suitOrder.indexOf(b.suit!);
      if (suitDiff !== 0) return suitDiff;
      
      return CardModel.compare(a, b);
    });
  }

  equals(other: Card): boolean {
    return this.notation === other.notation;
  }

  toString(): string {
    return this.notation;
  }
}
