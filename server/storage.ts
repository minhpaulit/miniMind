import { 
  User, InsertUser, 
  Connection, InsertConnection, 
  Feed, InsertFeed 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Connection operations
  getConnection(id: number): Promise<Connection | undefined>;
  getConnectionsByUserId(userId: number): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, connection: Partial<Connection>): Promise<Connection>;
  deleteConnection(id: number): Promise<void>;
  
  // Feed operations
  getFeed(id: number): Promise<Feed | undefined>;
  getFeedsByUserId(userId: number): Promise<Feed[]>;
  getFeedsByConnectionId(connectionId: number): Promise<Feed[]>;
  createFeed(feed: InsertFeed): Promise<Feed>;
  updateFeed(id: number, feed: Partial<Feed>): Promise<Feed>;
  deleteFeed(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private connections: Map<number, Connection>;
  private feeds: Map<number, Feed>;
  private userId: number;
  private connectionId: number;
  private feedId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.connections = new Map();
    this.feeds = new Map();
    this.userId = 1;
    this.connectionId = 1;
    this.feedId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin",
      email: "admin@minimind.com",
      name: "Admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      created_at: now 
    };
    this.users.set(id, user);
    return user;
  }

  // Connection operations
  async getConnection(id: number): Promise<Connection | undefined> {
    return this.connections.get(id);
  }

  async getConnectionsByUserId(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.user_id === userId
    );
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = this.connectionId++;
    const now = new Date();
    const connection: Connection = {
      ...insertConnection,
      id,
      created_at: now,
      updated_at: now
    };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnection(id: number, partialConnection: Partial<Connection>): Promise<Connection> {
    const existing = this.connections.get(id);
    if (!existing) {
      throw new Error(`Connection with id ${id} not found`);
    }

    const updated: Connection = {
      ...existing,
      ...partialConnection,
      id,
      updated_at: new Date()
    };
    this.connections.set(id, updated);
    return updated;
  }

  async deleteConnection(id: number): Promise<void> {
    // First, delete all feeds associated with this connection
    const feedsToDelete = await this.getFeedsByConnectionId(id);
    for (const feed of feedsToDelete) {
      await this.deleteFeed(feed.id);
    }
    
    this.connections.delete(id);
  }

  // Feed operations
  async getFeed(id: number): Promise<Feed | undefined> {
    return this.feeds.get(id);
  }

  async getFeedsByUserId(userId: number): Promise<Feed[]> {
    return Array.from(this.feeds.values()).filter(
      (feed) => feed.user_id === userId
    );
  }

  async getFeedsByConnectionId(connectionId: number): Promise<Feed[]> {
    return Array.from(this.feeds.values()).filter(
      (feed) => feed.connection_id === connectionId
    );
  }

  async createFeed(insertFeed: InsertFeed): Promise<Feed> {
    const id = this.feedId++;
    const now = new Date();
    const feed: Feed = {
      ...insertFeed,
      id,
      num_sent: 0,
      created_at: now,
      updated_at: now
    };
    this.feeds.set(id, feed);
    return feed;
  }

  async updateFeed(id: number, partialFeed: Partial<Feed>): Promise<Feed> {
    const existing = this.feeds.get(id);
    if (!existing) {
      throw new Error(`Feed with id ${id} not found`);
    }

    const updated: Feed = {
      ...existing,
      ...partialFeed,
      id,
      updated_at: new Date()
    };
    this.feeds.set(id, updated);
    return updated;
  }

  async deleteFeed(id: number): Promise<void> {
    this.feeds.delete(id);
  }
}

// Export the storage instance
export const storage = new MemStorage();
