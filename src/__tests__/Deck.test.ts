import { Deck } from '../models/Deck';

describe('Deck', () => {
  describe('initialization', () => {
    it('should create a deck with 54 cards including jokers', () => {
      const deck = new Deck(true);
      expect(deck.size()).toBe(54);
    });

    it('should create a deck with 52 cards without jokers', () => {
      const deck = new Deck(false);
      expect(deck.size()).toBe(52);
    });
  });

  describe('shuffle', () => {
    it('should shuffle the deck', () => {
      const deck1 = new Deck();
      const deck2 = new Deck();
      
      const originalOrder = deck1.getCards().map(c => c.notation);
      deck2.shuffle();
      const shuffledOrder = deck2.getCards().map(c => c.notation);
      
      expect(shuffledOrder.length).toBe(originalOrder.length);
      expect(shuffledOrder).not.toEqual(originalOrder);
    });
  });

  describe('dealToPlayers', () => {
    it('should deal cards evenly to players', () => {
      const deck = new Deck();
      deck.shuffle();
      
      const hands = deck.dealToPlayers(4);
      
      expect(hands.length).toBe(4);
      expect(hands[0].length).toBe(14); // 54 / 4 = 13.5, so first two get 14
      expect(hands[1].length).toBe(14);
      expect(hands[2].length).toBe(13);
      expect(hands[3].length).toBe(13);
      
      // Check no duplicate cards
      const allCards = hands.flat();
      const uniqueNotations = new Set(allCards.map(c => c.notation));
      expect(uniqueNotations.size).toBe(54);
    });
  });

  describe('createMultipleDecks', () => {
    it('should create multiple decks correctly', () => {
      const cards = Deck.createMultipleDecks(2, true);
      expect(cards.length).toBe(108); // 54 * 2
      
      // Should have 2 of each card
      const fiveHearts = cards.filter(c => c.notation === '5H');
      expect(fiveHearts.length).toBe(2);
    });
  });
});