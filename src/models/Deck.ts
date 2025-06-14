import { Card, CardNotation, Rank, Suit } from '../types';
import { CardModel } from './Card';

export class Deck {
  private cards: Card[] = [];

  constructor(includeJokers: boolean = true) {
    this.initializeDeck(includeJokers);
  }

  private initializeDeck(includeJokers: boolean): void {
    const ranks: Rank[] = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2'];
    const suits: Suit[] = ['C', 'D', 'H', 'S'];

    // Add standard cards
    for (const rank of ranks) {
      for (const suit of suits) {
        const notation = `${rank}${suit}` as CardNotation;
        this.cards.push(CardModel.fromNotation(notation));
      }
    }

    // Add jokers
    if (includeJokers) {
      this.cards.push(CardModel.fromNotation('jj'));
      this.cards.push(CardModel.fromNotation('JJ'));
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  dealToPlayers(playerCount: number): Card[][] {
    const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
    
    this.cards.forEach((card, index) => {
      hands[index % playerCount].push(card);
    });

    return hands;
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  size(): number {
    return this.cards.length;
  }

  static createMultipleDecks(count: number, includeJokers: boolean = true): Card[] {
    const allCards: Card[] = [];
    
    for (let i = 0; i < count; i++) {
      const deck = new Deck(includeJokers);
      allCards.push(...deck.getCards());
    }
    
    return allCards;
  }
}