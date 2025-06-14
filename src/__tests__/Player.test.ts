import { PlayerModel } from '../models/Player';
import { CardModel } from '../models/Card';

describe('PlayerModel', () => {
  let player: PlayerModel;

  beforeEach(() => {
    player = new PlayerModel('test', 'Test Player', false);
  });

  describe('card management', () => {
    it('should add cards to hand and sort them', () => {
      const cards = [
        CardModel.fromNotation('KH'),
        CardModel.fromNotation('3C'),
        CardModel.fromNotation('AS')
      ];

      player.addCards(cards);
      
      expect(player.getHandSize()).toBe(3);
      // Should be sorted by rank
      expect(player.hand[0].notation).toBe('3C');
      expect(player.hand[1].notation).toBe('KH');
      expect(player.hand[2].notation).toBe('AS');
    });

    it('should remove cards from hand', () => {
      const cards = [
        CardModel.fromNotation('5H'),
        CardModel.fromNotation('5D'),
        CardModel.fromNotation('7C')
      ];

      player.addCards(cards);
      
      const toRemove = [cards[0], cards[2]];
      const result = player.removeCards(toRemove);
      
      expect(result).toBe(true);
      expect(player.getHandSize()).toBe(1);
      expect(player.hand[0].notation).toBe('5D');
    });

    it('should check if player has specific cards', () => {
      const cards = [
        CardModel.fromNotation('5H'),
        CardModel.fromNotation('5D')
      ];

      player.addCards(cards);
      
      expect(player.hasCards(cards)).toBe(true);
      expect(player.hasCards([CardModel.fromNotation('3C')])).toBe(false);
    });
  });

  describe('game mechanics', () => {
    it('should find starting player with 3H', () => {
      player.addCards([CardModel.fromNotation('3H')]);
      expect(player.findStartingPlayer()).toBe(true);

      const player2 = new PlayerModel('test2', 'Test 2');
      player2.addCards([CardModel.fromNotation('3C')]);
      expect(player2.findStartingPlayer()).toBe(false);
    });

    it('should track wins and losses', () => {
      expect(player.wins).toBe(0);
      expect(player.losses).toBe(0);
      
      player.recordWin();
      player.recordWin();
      player.recordLoss();
      
      expect(player.wins).toBe(2);
      expect(player.losses).toBe(1);
      expect(player.getWinRate()).toBeCloseTo(0.667, 3);
    });
  });

  describe('sorting', () => {
    it('should sort by suit', () => {
      const cards = [
        CardModel.fromNotation('5H'),
        CardModel.fromNotation('5C'),
        CardModel.fromNotation('5S'),
        CardModel.fromNotation('5D')
      ];

      player.addCards(cards);
      player.sortHand(false); // Sort by suit
      
      const notations = player.getHandNotations();
      expect(notations).toEqual(['5C', '5D', '5H', '5S']);
    });
  });

  describe('factory methods', () => {
    it('should create human player', () => {
      const human = PlayerModel.createHumanPlayer('John');
      expect(human.id).toBe('human');
      expect(human.name).toBe('John');
      expect(human.isBot).toBe(false);
    });

    it('should create bot player', () => {
      const bot = PlayerModel.createBotPlayer('bot1', 'Alice');
      expect(bot.id).toBe('bot1');
      expect(bot.name).toBe('Alice');
      expect(bot.isBot).toBe(true);
    });
  });
});