import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Connections schema
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  token: text("token").notNull(),
  status: text("status").notNull(),
  user_id: integer("user_id").notNull().references(() => users.id),
  icon: text("icon").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  projects: text("projects"),
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  name: true,
  url: true,
  token: true,
  status: true,
  user_id: true,
  icon: true,
  projects: true,
});

// Feeds schema
export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  full_text: text("full_text").notNull(),
  contents: text("contents").array().notNull(),
  completed_contents: text("completed_contents").array().notNull(),
  separator: text("separator").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  user_id: integer("user_id").notNull().references(() => users.id),
  connection_id: integer("connection_id").notNull().references(() => connections.id),
  num_sent: integer("num_sent").notNull().default(0),
  frequency: text("frequency").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertFeedSchema = createInsertSchema(feeds).pick({
  name: true,
  description: true,
  full_text: true,
  contents: true,
  completed_contents: true,
  separator: true,
  user_id: true,
  connection_id: true,
  frequency: true,
  active: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Feed = typeof feeds.$inferSelect;
export type InsertFeed = z.infer<typeof insertFeedSchema>;
