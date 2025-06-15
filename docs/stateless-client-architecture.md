# Achieving Firestore-like Stateless Clients with Colyseus

## Overview

Colyseus can provide a very similar developer experience to Firestore's
document subscriptions, where clients remain largely stateless and
automatically sync with server state changes.

## Colyseus State Synchronization

### 1. Schema-based State Sync (Recommended)

```typescript
// Server-side: Define your state schema
import { Schema, type, ArraySchema, MapSchema } from '@colyseus/schema';

class Card extends Schema {
  @type("string") suit: string;
  @type("string") rank: string;
  @type("string") notation: string;
  @type("boolean") isJoker: boolean;
}

class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type([Card]) hand = new ArraySchema<Card>();
  @type("number") wins: number = 0;
  @type("number") losses: number = 0;
  @type("boolean") isConnected: boolean = true;
}

class Trick extends Schema {
  @type("string") leadPlayer: string;
  @type([Card]) cards = new ArraySchema<Card>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
}

class GameState extends Schema {
  @type("string") gameId: string;
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("number") currentPlayerIndex: number = 0;
  @type("string") currentLeader: string;
  @type(Trick) currentTrick: Trick;
  @type("number") round: number = 1;
  @type("string") phase: 'waiting' | 'playing' | 'trick_end' | 'round_end' = 'waiting';
  @type([Card]) deck = new ArraySchema<Card>();
}

// Room implementation
class HeartFiveRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setState(new GameState());

    // State is automatically synchronized to all clients
    // Clients receive only the changes, not full state
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name;

    // Adding to state automatically syncs to all clients
    this.state.players.set(client.sessionId, player);
  }

  onMessage(client: Client, type: string, message: any) {
    if (type === "play_meld") {
      // Validate and update state
      // Changes automatically propagate to all clients
      this.playMeld(client.sessionId, message.meld);
    }
  }
}
```

### 2. Client-side: Firestore-like Subscriptions

```typescript
// Client implementation with React hooks
import { Room } from 'colyseus.js';
import { useState, useEffect, useRef } from 'react';

// Custom hook that mimics Firestore's onSnapshot
function useColyseusState<T>(
  room: Room<T> | null,
  path?: string
): [T | undefined, boolean] {
  const [state, setState] = useState<T>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!room) return;

    // Initial state
    setState(path ? getNestedValue(room.state, path) : room.state);
    setLoading(false);

    // Listen for all state changes
    const listeners: any[] = [];

    if (path) {
      // Listen to specific path changes
      const pathParts = path.split('.');
      let target = room.state;

      for (const part of pathParts) {
        target = target[part];
      }

      if (target.onChange) {
        listeners.push(
          target.onChange(() => {
            setState(getNestedValue(room.state, path));
          })
        );
      }
    } else {
      // Listen to all state changes
      listeners.push(
        room.state.onChange(() => {
          setState({ ...room.state });
        })
      );
    }

    return () => {
      listeners.forEach(listener => listener());
    };
  }, [room, path]);

  return [state, loading];
}

// Usage - Exactly like Firestore!
function GameComponent() {
  const room = useColyseusRoom('heart-five', { name: 'Player1' });

  // Subscribe to entire game state
  const [gameState, loading] = useColyseusState(room);

  // Subscribe to specific player
  const [myPlayer] = useColyseusState(room, `players.${room?.sessionId}`);

  // Subscribe to current trick
  const [currentTrick] = useColyseusState(room, 'currentTrick');

  if (loading) return <div>Loading...</div>;

  // Component automatically re-renders when state changes
  return (
    <div>
      <h1>Round {gameState.round}</h1>
      <div>My hand: {myPlayer?.hand.map(card => card.notation).join(', ')}</div>
      <div>Current trick: {currentTrick?.cards.length} cards played</div>
    </div>
  );
}
```

### 3. Granular Subscriptions (Like Firestore Collections)

```typescript
// Create collection-like subscriptions
class ColyseusSubscription<T> {
  private callbacks: ((data: T) => void)[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor(
    private room: Room,
    private path: string,
    private filter?: (item: T) => boolean
  ) {
    this.initialize();
  }

  private initialize() {
    const target = this.getTarget();

    if (target instanceof ArraySchema) {
      // Array-like subscription
      this.unsubscribe = target.onChange = (item: T, key: number) => {
        if (!this.filter || this.filter(item)) {
          this.callbacks.forEach(cb => cb(item));
        }
      };
    } else if (target instanceof MapSchema) {
      // Map-like subscription
      const changeHandler = (item: T, key: string) => {
        if (!this.filter || this.filter(item)) {
          this.callbacks.forEach(cb => cb(item));
        }
      };

      target.onAdd = changeHandler;
      target.onChange = changeHandler;
      target.onRemove = (item: T, key: string) => {
        this.callbacks.forEach(cb => cb(null)); // Signal removal
      };
    }
  }

  onSnapshot(callback: (data: T) => void) {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
      if (this.callbacks.length === 0 && this.unsubscribe) {
        this.unsubscribe();
      }
    };
  }

  private getTarget() {
    const parts = this.path.split('.');
    let target = this.room.state;

    for (const part of parts) {
      target = target[part];
    }

    return target;
  }
}

// Usage - Exactly like Firestore!
const room = await client.joinOrCreate<GameState>('heart-five');

// Subscribe to all players
const playersRef = new ColyseusSubscription(room, 'players');
const unsubscribe = playersRef.onSnapshot((players) => {
  console.log('Players updated:', players);
});

// Subscribe to specific player's hand with filter
const myHandRef = new ColyseusSubscription(
  room,
  `players.${myId}.hand`,
  (card) => card.suit === 'H' // Only hearts
);

myHandRef.onSnapshot((hearts) => {
  console.log('Hearts in my hand:', hearts);
});
```

### 4. State Persistence & Reconnection

```typescript
// Server-side: Enable state persistence
class PersistentHeartFiveRoom extends Room<GameState> {
  async onCreate(options: any) {
    this.setState(new GameState());

    // Enable automatic state saving
    this.setPatchRate(1000); // Send patches every second
    this.setSimulationInterval(() => this.update());

    // Restore state if this is a reconnection
    if (options.gameId) {
      const savedState = await this.presence.get(`game:${options.gameId}`);
      if (savedState) {
        this.setState(new GameState(savedState));
      }
    }
  }

  async onDispose() {
    // Save state for reconnection
    await this.presence.setex(
      `game:${this.state.gameId}`,
      this.state.toJSON(),
      3600 // 1 hour TTL
    );
  }

  async onLeave(client: Client, consented: boolean) {
    // Mark player as disconnected but keep their state
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isConnected = false;
    }

    // Allow reconnection within 5 minutes
    if (!consented) {
      await this.allowReconnection(client, 300);
    }
  }

  onReconnect(client: Client) {
    // Player reconnects - state is automatically synchronized
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.isConnected = true;
    }
  }
}

// Client-side: Automatic reconnection
class ResilientClient {
  private room: Room<GameState> | null = null;
  private reconnectToken: string | null = null;

  async connect(roomName: string, options: any) {
    try {
      // Try to reconnect with saved token
      if (this.reconnectToken) {
        this.room = await client.reconnect(this.reconnectToken);
      } else {
        this.room = await client.joinOrCreate(roomName, options);
        this.reconnectToken = this.room.reconnectionToken;

        // Save token for page refreshes
        localStorage.setItem('reconnectToken', this.reconnectToken);
      }

      // State is automatically synchronized!
      console.log('Connected, current state:', this.room.state);

    } catch (error) {
      console.error('Connection failed:', error);
      // Clear invalid token
      this.reconnectToken = null;
      localStorage.removeItem('reconnectToken');
    }
  }
}
```

### 5. Offline Support & Optimistic Updates

```typescript
// Optimistic updates with rollback
class OptimisticGameClient {
  private optimisticState: GameState | null = null;
  private pendingActions: Action[] = [];

  async playCard(meld: Meld) {
    // Optimistically update local state
    this.optimisticState = this.applyAction(this.room.state, {
      type: 'play_meld',
      meld,
      timestamp: Date.now()
    });

    // Track pending action
    const actionId = uuid();
    this.pendingActions.push({ id: actionId, meld });

    try {
      // Send to server
      await this.room.send('play_meld', { meld, actionId });

    } catch (error) {
      // Rollback on error
      this.rollbackAction(actionId);
      throw error;
    }
  }

  private setupStateSync() {
    this.room.state.onChange(() => {
      // Server state changed - reconcile with optimistic state
      this.reconcileState();
    });

    this.room.onMessage('action_confirmed', (actionId: string) => {
      // Remove from pending once confirmed
      this.pendingActions = this.pendingActions.filter(a => a.id !== actionId);
    });

    this.room.onMessage('action_rejected', (actionId: string) => {
      // Rollback rejected action
      this.rollbackAction(actionId);
    });
  }
}
```

## Comparison with Firestore

### Firestore
```typescript
// Firestore subscription
const unsubscribe = firestore
  .collection('games')
  .doc(gameId)
  .onSnapshot((doc) => {
    setGameState(doc.data());
  });

// Write
await firestore.collection('games').doc(gameId).update({
  'currentTrick.cards': firebase.firestore.FieldValue.arrayUnion(card)
});
```

### Colyseus (with helpers)
```typescript
// Colyseus subscription
const [gameState] = useColyseusState(room);

// Write (server validates and broadcasts)
room.send('play_card', { card });
```

## Key Advantages of Colyseus Approach

1. **Binary Protocol**: 10x smaller than JSON
2. **Delta Updates**: Only changes are sent, not full documents
3. **Type Safety**: Full TypeScript support with decorators
4. **No Cold Starts**: Instant message processing
5. **Conflict-Free**: Server authoritatively resolves all conflicts
6. **Cheaper at Scale**: Fixed server costs vs per-operation billing

## Best Practices for Stateless Clients

1. **Never Store Game State Locally**
   ```typescript
   // Bad
   const [hand, setHand] = useState([]);

   // Good
   const [player] = useColyseusState(room, `players.${myId}`);
   const hand = player?.hand || [];
   ```

2. **Always Derive UI State from Server State**
   ```typescript
   // All UI state is computed from server state
   const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;
   const canPlay = isMyTurn && !gameState.waitingForAnimation;
   const legalMoves = useMemo(() =>
     calculateLegalMoves(hand, gameState.currentTrick),
     [hand, gameState.currentTrick]
   );
   ```

3. **Use Optimistic Updates Sparingly**
   ```typescript
   // Only for UI feedback, not state changes
   const [isPlaying, setIsPlaying] = useState(false);

   const playCard = async (card) => {
     setIsPlaying(true); // Optimistic UI
     try {
       await room.send('play_card', { card });
     } finally {
       setIsPlaying(false);
     }
   };
   ```

## Conclusion

Colyseus provides all the benefits of Firestore's stateless client model while maintaining the performance and control of a custom game server. The key is using:

1. Schema-based automatic synchronization
2. React hooks for subscription management
3. Server authoritative state
4. Binary delta updates
5. Built-in reconnection support

This gives you the best of both worlds: Firestore-like developer experience with game-specific performance and cost efficiency.
