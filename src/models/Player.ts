import { Player, Card } from '../types';
import { CardModel } from './Card';

export class PlayerModel implements Player {
  id: string;
  name: string;
  hand: Card[];
  wins: number;
  losses: number;
  isBot: boolean;

  constructor(id: string, name: string, isBot: boolean = false) {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.wins = 0;
    this.losses = 0;
    this.isBot = isBot;
  }

  addCards(cards: Card[]): void {
    this.hand.push(...cards);
    this.sortHand();
  }

  removeCards(cards: Card[]): boolean {
    const notations = cards.map(c => c.notation);
    const originalLength = this.hand.length;
    
    this.hand = this.hand.filter(card => 
      !notations.includes(card.notation)
    );
    
    return this.hand.length === originalLength - cards.length;
  }

  hasCards(cards: Card[]): boolean {
    const handNotations = this.hand.map(c => c.notation);
    return cards.every(card => handNotations.includes(card.notation));
  }

  sortHand(byRank: boolean = true): void {
    if (byRank) {
      this.hand = CardModel.sortBySingleRank(this.hand);
    } else {
      this.hand = CardModel.sortBySuit(this.hand);
    }
  }

  getHandSize(): number {
    return this.hand.length;
  }

  hasCard(notation: string): boolean {
    return this.hand.some(card => card.notation === notation);
  }

  findStartingPlayer(): boolean {
    return this.hasCard('3H');
  }

  recordWin(): void {
    this.wins++;
  }

  recordLoss(): void {
    this.losses++;
  }

  getWinRate(): number {
    const total = this.wins + this.losses;
    return total === 0 ? 0 : this.wins / total;
  }

  clearHand(): void {
    this.hand = [];
  }

  getHandNotations(): string[] {
    return this.hand.map(c => c.notation);
  }

  static createHumanPlayer(name: string = 'You'): PlayerModel {
    return new PlayerModel('human', name, false);
  }

  static createBotPlayer(id: string, name: string): PlayerModel {
    return new PlayerModel(id, name, true);
  }
}