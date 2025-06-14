import { MeldDetector } from '../models/Meld';
import { CardModel } from '../models/Card';
import { Card } from '../types';

describe('MeldDetector', () => {
  const createCards = (notations: string[]): Card[] => {
    return notations.map(n => CardModel.fromNotation(n as any));
  };

  describe('detectMeldType', () => {
    it('should detect single cards', () => {
      const cards = createCards(['5H']);
      expect(MeldDetector.detectMeldType(cards)).toBe('single');
    });

    it('should detect pairs', () => {
      const cards = createCards(['5H', '5D']);
      expect(MeldDetector.detectMeldType(cards)).toBe('pair');
    });

    it('should not allow jokers in pairs', () => {
      const cards = createCards(['jj', '5H']);
      expect(MeldDetector.detectMeldType(cards)).toBeNull();
    });

    it('should detect triples', () => {
      const cards = createCards(['5H', '5D', '5C']);
      expect(MeldDetector.detectMeldType(cards)).toBe('triple');
    });

    it('should detect four of a kind bombs', () => {
      const cards = createCards(['5H', '5D', '5C', '5S']);
      expect(MeldDetector.detectMeldType(cards)).toBe('fourOfKindBomb');
    });

    it('should detect full houses', () => {
      const cards = createCards(['5H', '5D', '5C', '7H', '7D']);
      expect(MeldDetector.detectMeldType(cards)).toBe('fullHouse');
    });

    it('should detect pair sisters', () => {
      const cards = createCards(['3H', '3D', '4H', '4C']);
      expect(MeldDetector.detectMeldType(cards)).toBe('sisters');
    });

    it('should detect triple sisters', () => {
      const cards = createCards(['3H', '3D', '3C', '4H', '4D', '4C']);
      expect(MeldDetector.detectMeldType(cards)).toBe('sisters');
    });

    it('should detect runs', () => {
      const cards = createCards(['3H', '4D', '5C', '6H', '7S']);
      expect(MeldDetector.detectMeldType(cards)).toBe('run');
    });

    it('should detect straight flush bombs', () => {
      const cards = createCards(['3H', '4H', '5H', '6H', '7H']);
      expect(MeldDetector.detectMeldType(cards)).toBe('straightFlushBomb');
    });

    it('should allow A-2-3-4-5 run', () => {
      const cards = createCards(['AH', '2D', '3C', '4H', '5S']);
      expect(MeldDetector.detectMeldType(cards)).toBe('run');
    });

    it('should allow J-Q-K-A run', () => {
      const cards = createCards(['JH', 'QD', 'KC', 'AH']);
      expect(MeldDetector.detectMeldType(cards)).toBe(null); // Not 5 cards
      
      const validRun = createCards(['TH', 'JD', 'QC', 'KH', 'AS']);
      expect(MeldDetector.detectMeldType(validRun)).toBe('run');
    });
  });

  describe('getMeldStrength', () => {
    it('should calculate single card strength correctly', () => {
      const meld = MeldDetector.createMeld(createCards(['5H']))!;
      expect(meld.strength).toBe(16); // 5H is strongest

      const meld2 = MeldDetector.createMeld(createCards(['3C']))!;
      expect(meld2.strength).toBe(1); // 3 is weakest
    });

    it('should calculate full house strength by triple', () => {
      const meld = MeldDetector.createMeld(createCards(['5H', '5D', '5C', '7H', '7D']))!;
      expect(meld.strength).toBe(16); // Strength of 5H (strongest single)
      
      const meld2 = MeldDetector.createMeld(createCards(['3H', '3D', '3C', '7H', '7D']))!;
      expect(meld2.strength).toBe(1); // Strength of 3s
    });

    it('should calculate sisters strength by highest pair', () => {
      const meld = MeldDetector.createMeld(createCards(['3H', '3D', '4H', '4C']))!;
      expect(meld.strength).toBe(2); // Strength of 4s
    });
  });

  describe('canBeat', () => {
    it('should allow bombs to beat non-bombs', () => {
      const triple = MeldDetector.createMeld(createCards(['AH', 'AD', 'AC']))!;
      const bomb = MeldDetector.createMeld(createCards(['3H', '3D', '3C', '3S']))!;
      
      expect(MeldDetector.canBeat(bomb, triple)).toBe(true);
    });

    it('should allow straight flush bombs to beat four of a kind bombs', () => {
      const fourOfKind = MeldDetector.createMeld(createCards(['KH', 'KD', 'KC', 'KS']))!;
      const straightFlush = MeldDetector.createMeld(createCards(['3H', '4H', '5H', '6H', '7H']))!;
      
      expect(MeldDetector.canBeat(straightFlush, fourOfKind)).toBe(true);
    });

    it('should require matching meld types for non-bombs', () => {
      const pair = MeldDetector.createMeld(createCards(['5H', '5D']))!;
      const triple = MeldDetector.createMeld(createCards(['3H', '3D', '3C']))!;
      
      expect(MeldDetector.canBeat(triple, pair)).toBe(false);
    });

    it('should require matching run lengths', () => {
      const run5 = MeldDetector.createMeld(createCards(['3H', '4D', '5C', '6H', '7S']))!;
      const run6 = MeldDetector.createMeld(createCards(['4H', '5D', '6C', '7H', '8S', '9H']))!;
      
      expect(MeldDetector.canBeat(run6, run5)).toBe(false);
    });

    it('should compare strengths for same meld types', () => {
      const lowPair = MeldDetector.createMeld(createCards(['3H', '3D']))!;
      const highPair = MeldDetector.createMeld(createCards(['KH', 'KD']))!;
      
      expect(MeldDetector.canBeat(highPair, lowPair)).toBe(true);
      expect(MeldDetector.canBeat(lowPair, highPair)).toBe(false);
    });
  });
});