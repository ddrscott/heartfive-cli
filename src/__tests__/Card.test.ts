import { CardModel } from '../models/Card';

describe('CardModel', () => {
  describe('constructor', () => {
    it('should create a regular card correctly', () => {
      const card = new CardModel('5H');
      expect(card.rank).toBe('5');
      expect(card.suit).toBe('H');
      expect(card.notation).toBe('5H');
      expect(card.isJoker).toBe(false);
      expect(card.is5H).toBe(true);
    });

    it('should create a joker correctly', () => {
      const smallJoker = new CardModel('jj');
      expect(smallJoker.rank).toBe('jj');
      expect(smallJoker.suit).toBeUndefined();
      expect(smallJoker.isJoker).toBe(true);
      expect(smallJoker.is5H).toBe(false);

      const bigJoker = new CardModel('JJ');
      expect(bigJoker.rank).toBe('JJ');
      expect(bigJoker.isJoker).toBe(true);
    });
  });

  describe('getSingleRankValue', () => {
    it('should return correct values for single card ranking', () => {
      expect(CardModel.getSingleRankValue(new CardModel('3C'))).toBe(1);
      expect(CardModel.getSingleRankValue(new CardModel('2H'))).toBe(13);
      expect(CardModel.getSingleRankValue(new CardModel('jj'))).toBe(14);
      expect(CardModel.getSingleRankValue(new CardModel('JJ'))).toBe(15);
      expect(CardModel.getSingleRankValue(new CardModel('5H'))).toBe(16);
    });
  });

  describe('getRunRankValue', () => {
    it('should return correct values for run ranking', () => {
      expect(CardModel.getRunRankValue(new CardModel('AC'))).toBe(1);
      expect(CardModel.getRunRankValue(new CardModel('2D'))).toBe(2);
      expect(CardModel.getRunRankValue(new CardModel('KH'))).toBe(13);
    });

    it('should return -1 for jokers', () => {
      expect(CardModel.getRunRankValue(new CardModel('jj'))).toBe(-1);
      expect(CardModel.getRunRankValue(new CardModel('JJ'))).toBe(-1);
    });
  });

  describe('sorting', () => {
    it('should sort by single rank correctly', () => {
      const cards = [
        new CardModel('2H'),
        new CardModel('3C'),
        new CardModel('5H'),
        new CardModel('jj'),
        new CardModel('AS')
      ];

      const sorted = CardModel.sortBySingleRank(cards);
      const notations = sorted.map(c => c.notation);
      
      expect(notations).toEqual(['3C', 'AS', '2H', 'jj', '5H']);
    });

    it('should sort by suit correctly', () => {
      const cards = [
        new CardModel('5H'),
        new CardModel('5C'),
        new CardModel('5D'),
        new CardModel('5S'),
        new CardModel('jj')
      ];

      const sorted = CardModel.sortBySuit(cards);
      const notations = sorted.map(c => c.notation);
      
      expect(notations[0]).toBe('5C');
      expect(notations[1]).toBe('5D');
      expect(notations[2]).toBe('5H');
      expect(notations[3]).toBe('5S');
      expect(notations[4]).toBe('jj');
    });
  });

  describe('equals', () => {
    it('should correctly compare cards', () => {
      const card1 = new CardModel('5H');
      const card2 = new CardModel('5H');
      const card3 = new CardModel('5D');

      expect(card1.equals(card2)).toBe(true);
      expect(card1.equals(card3)).toBe(false);
    });
  });
});