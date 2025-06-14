export type Suit = 'C' | 'D' | 'H' | 'S';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A' | '2';
export type JokerType = 'jj' | 'JJ';
export type CardNotation = `${Rank}${Suit}` | JokerType;

export interface Card {
  rank: Rank | JokerType;
  suit?: Suit;
  notation: CardNotation;
  isJoker: boolean;
  is5H: boolean;
}

export type MeldType = 
  | 'single'
  | 'pair'
  | 'triple'
  | 'fullHouse'
  | 'sisters'
  | 'run'
  | 'fourOfKindBomb'
  | 'straightFlushBomb';

export interface Meld {
  type: MeldType;
  cards: Card[];
  strength: number;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  wins: number;
  losses: number;
  isBot: boolean;
}

export interface GameState {
  round: number;
  players: Player[];
  currentPlayerIndex: number;
  currentLeader: string;
  establishedMeldType?: MeldType;
  lastPlay?: {
    player: string;
    meld: Meld;
  };
  consecutivePasses: number;
  deck: Card[];
  playHistory: Array<{
    player: string;
    action: 'play' | 'pass';
    meld?: Meld;
  }>;
}

export interface GameConfig {
  gameInfo: {
    name: string;
    players: {
      min: number;
      max: number;
      optimal: number;
    };
    deck: string;
  };
  cardRanking: {
    singleRanks: string[];
    runRanks: string[];
    suits: string[];
  };
  specialCards: {
    gameStarter: string;
    strongestSingle: string;
    smallJoker: string;
    bigJoker: string;
  };
}