import { InputParser } from '../cli/InputParser';
import { CardModel } from '../models/Card';
import { MeldDetector } from '../models/Meld';

describe('InputParser', () => {
  describe('parseCommand', () => {
    it('should parse play commands', () => {
      const result = InputParser.parseCommand('play 5H 5D');
      expect(result.type).toBe('play');
      expect(result.args.meld).toBeDefined();
      expect(result.args.meld.cards.length).toBe(2);
    });

    it('should parse move commands', () => {
      const result = InputParser.parseCommand('move 3');
      expect(result.type).toBe('move');
      expect(result.args.moveNumber).toBe(3);
    });

    it('should parse basic commands', () => {
      expect(InputParser.parseCommand('pass').type).toBe('pass');
      expect(InputParser.parseCommand('hand').type).toBe('hand');
      expect(InputParser.parseCommand('legal').type).toBe('legal');
      expect(InputParser.parseCommand('history').type).toBe('history');
      expect(InputParser.parseCommand('score').type).toBe('score');
      expect(InputParser.parseCommand('help').type).toBe('help');
    });

    it('should parse sort commands', () => {
      const rankSort = InputParser.parseCommand('sort rank');
      expect(rankSort.type).toBe('sort');
      expect(rankSort.args.sortType).toBe('rank');

      const suitSort = InputParser.parseCommand('sort suit');
      expect(suitSort.type).toBe('sort');
      expect(suitSort.args.sortType).toBe('suit');
    });

    it('should handle invalid commands', () => {
      const result = InputParser.parseCommand('invalid');
      expect(result.type).toBe('unknown');
    });

    it('should handle play command errors', () => {
      const result = InputParser.parseCommand('play XX YY');
      expect(result.type).toBe('unknown');
      expect(result.args.error).toContain('Invalid card notation');
    });
  });

  describe('card notation handling', () => {
    it('should normalize card notations', () => {
      // Test with a valid pair that uses normalization
      const result = InputParser.parseCommand('play 10h 10d');
      expect(result.type).toBe('play');
      if (result.args.meld) {
        const notations = result.args.meld.cards.map((c: any) => c.notation);
        expect(notations).toContain('TH');
        expect(notations).toContain('TD');
      }
    });

    it('should handle joker variations', () => {
      // Test single joker
      const jokerResult = InputParser.parseCommand('play joker');
      expect(jokerResult.type).toBe('play');
      if (jokerResult.args.meld) {
        const notations = jokerResult.args.meld.cards.map((c: any) => c.notation);
        expect(notations).toContain('jj');
      }
    });
  });

  describe('validation', () => {
    it('should validate meld against hand', () => {
      const hand = [
        CardModel.fromNotation('5H'),
        CardModel.fromNotation('5D'),
        CardModel.fromNotation('7C')
      ];
      
      const validMeld = MeldDetector.createMeld([hand[0], hand[1]])!;
      const invalidMeld = MeldDetector.createMeld([
        CardModel.fromNotation('3H'),
        CardModel.fromNotation('3D')
      ])!;
      
      expect(InputParser.validateMeldAgainstHand(validMeld, hand)).toBe(true);
      expect(InputParser.validateMeldAgainstHand(invalidMeld, hand)).toBe(false);
    });
  });

  describe('suggestions', () => {
    it('should suggest corrections for common mistakes', () => {
      expect(InputParser.suggestCardCorrection('10H')).toBe('TH');
      expect(InputParser.suggestCardCorrection('joker')).toBe('jj');
      expect(InputParser.suggestCardCorrection('J1')).toBe('jj');
      expect(InputParser.suggestCardCorrection('invalid')).toBeNull();
    });
  });
});