import { Card, Meld } from '../types';
import { CardModel } from '../models/Card';
import { MeldDetector } from '../models/Meld';

export interface ParsedCommand {
  type: 'play' | 'move' | 'pass' | 'hand' | 'legal' | 'history' | 'score' | 'sort' | 'help' | 'unknown';
  args?: any;
}

export class InputParser {
  static parseCommand(input: string): ParsedCommand {
    const trimmed = input.trim().toLowerCase();
    const parts = trimmed.split(/\s+/);
    const command = parts[0];

    switch (command) {
      case 'play':
        return this.parsePlayCommand(parts.slice(1));
      
      case 'move':
        return this.parseMoveCommand(parts.slice(1));
      
      case 'pass':
        return { type: 'pass' };
      
      case 'hand':
        return { type: 'hand' };
      
      case 'legal':
        return { type: 'legal' };
      
      case 'history':
        return { type: 'history' };
      
      case 'score':
        return { type: 'score' };
      
      case 'sort':
        return this.parseSortCommand(parts.slice(1));
      
      case 'help':
        return { type: 'help' };
      
      default:
        return { type: 'unknown', args: { input } };
    }
  }

  private static parsePlayCommand(args: string[]): ParsedCommand {
    if (args.length === 0) {
      return { type: 'unknown', args: { error: 'No cards specified' } };
    }

    try {
      const cards = this.parseCardNotations(args);
      const meld = MeldDetector.createMeld(cards);
      
      if (!meld) {
        return { type: 'unknown', args: { error: 'Invalid card combination' } };
      }

      return { type: 'play', args: { meld } };
    } catch (error) {
      return { type: 'unknown', args: { error: (error as Error).message } };
    }
  }

  private static parseMoveCommand(args: string[]): ParsedCommand {
    if (args.length === 0) {
      return { type: 'unknown', args: { error: 'No move number specified' } };
    }

    const moveNumber = parseInt(args[0]);
    if (isNaN(moveNumber) || moveNumber < 1) {
      return { type: 'unknown', args: { error: 'Invalid move number' } };
    }

    return { type: 'move', args: { moveNumber } };
  }

  private static parseSortCommand(args: string[]): ParsedCommand {
    if (args.length === 0) {
      return { type: 'unknown', args: { error: 'Specify "rank" or "suit"' } };
    }

    const sortType = args[0];
    if (sortType !== 'rank' && sortType !== 'suit') {
      return { type: 'unknown', args: { error: 'Sort by "rank" or "suit"' } };
    }

    return { type: 'sort', args: { sortType } };
  }

  private static parseCardNotations(notations: string[]): Card[] {
    const cards: Card[] = [];

    for (const notation of notations) {
      const normalizedNotation = this.normalizeCardNotation(notation);
      
      if (!this.isValidCardNotation(normalizedNotation)) {
        throw new Error(`Invalid card notation: ${notation}`);
      }

      cards.push(CardModel.fromNotation(normalizedNotation as any));
    }

    return cards;
  }

  private static normalizeCardNotation(notation: string): string {
    // Convert to uppercase
    let normalized = notation.toUpperCase();

    // Handle Ten as T (must come before other replacements)
    normalized = normalized.replace(/10/g, 'T');

    // Handle jokers
    if (normalized === 'JOKER' || normalized === 'J1') {
      return 'jj';
    }
    if (normalized === 'JOKER2' || normalized === 'J2' || normalized === 'BIG') {
      return 'JJ';
    }

    return normalized;
  }

  private static isValidCardNotation(notation: string): boolean {
    // Check jokers
    if (notation === 'jj' || notation === 'JJ') {
      return true;
    }

    // Check regular cards
    if (notation.length !== 2) {
      return false;
    }

    const rank = notation[0];
    const suit = notation[1];

    const validRanks = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2'];
    const validSuits = ['C', 'D', 'H', 'S'];

    return validRanks.includes(rank) && validSuits.includes(suit);
  }

  static formatCardNotations(cards: Card[]): string[] {
    return cards.map(card => card.notation);
  }

  static validateMeldAgainstHand(meld: Meld, hand: Card[]): boolean {
    const handNotations = hand.map(c => c.notation);
    return meld.cards.every(card => handNotations.includes(card.notation));
  }

  static suggestCardCorrection(input: string): string | null {
    const normalized = input.toUpperCase();
    
    // Common mistakes
    const corrections: Record<string, string> = {
      '10H': 'TH', '10D': 'TD', '10C': 'TC', '10S': 'TS',
      'JOK': 'jj', 'JOKER': 'jj', 'J1': 'jj',
      'JOKER2': 'JJ', 'J2': 'JJ', 'BIG': 'JJ'
    };

    return corrections[normalized] || null;
  }
}