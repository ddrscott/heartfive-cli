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

    // Handle single dash as pass
    if (trimmed === '-') {
      return { type: 'pass' };
    }

    switch (command) {
      case 'play':
        return this.parsePlayCommand(parts.slice(1));
      
      case 'move':
        return this.parseMoveCommand(parts.slice(1));
      
      case 'pass':
      case '-':
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
        // If it starts with a card notation, assume it's a play command
        if (this.looksLikeCardNotation(command)) {
          return this.parsePlayCommand(parts);
        }
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
    // Handle jokers first (before uppercase conversion)
    const upper = notation.toUpperCase();
    
    if (upper === 'J1' || upper === 'JOKER' || upper === 'JOKER1' || notation.toLowerCase() === 'jj') {
      return 'J1';
    }
    if (upper === 'J2' || upper === 'JOKER2' || upper === 'BIG' || notation.toUpperCase() === 'JJ') {
      return 'J2';
    }

    // Convert to uppercase for other cards
    let normalized = notation.toUpperCase();

    // Handle Ten as T
    normalized = normalized.replace(/10/g, 'T');

    return normalized;
  }

  private static isValidCardNotation(notation: string): boolean {
    // Check jokers
    if (notation === 'J1' || notation === 'J2') {
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
      'JOK': 'J1', 'JOKER': 'J1', 'JOKER1': 'J1',
      'JOKER2': 'J2', 'BIG': 'J2'
    };

    return corrections[normalized] || null;
  }

  private static looksLikeCardNotation(text: string): boolean {
    const upper = text.toUpperCase();
    
    // Check jokers
    if (upper === 'J1' || upper === 'J2' || upper === 'JOKER' || upper === 'BIG' || 
        text.toLowerCase() === 'jj' || upper === 'JJ') {
      return true;
    }
    
    // Check if it starts with a rank
    if (text.length >= 2) {
      const firstChar = upper[0];
      const validFirstChars = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2', '1']; // '1' for '10'
      return validFirstChars.includes(firstChar);
    }
    
    return false;
  }
}