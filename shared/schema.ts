import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";

export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  date: text("date").notNull(),
  distance: text("distance").notNull(),
  distanceLabel: text("distance_label").notNull().default(""),
  type: text("type").notNull(),
  team: text("team").notNull().default(""),
  url: text("url").notNull().default(""),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("active"),
  badgeClass: text("badge_class").notNull().default(""),
  dates: text("dates").notNull().default("[]"),  // JSON: [{date, status}]
  lat: text("lat"),
  lng: text("lng"),
});

export const favourites = pgTable("favourites", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull(),
  voterName: text("voter_name").notNull(),
});

export const exploreSites = pgTable("explore_sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull().default(""),
  category: text("category").notNull(),
  description: text("description").notNull(),
  bestMonths: text("best_months").notNull().default(""),
  url: text("url").notNull().default(""),
  emoji: text("emoji").notNull().default(""),
  lat: text("lat"),
  lng: text("lng"),
});

export type Race = typeof races.$inferSelect;
export type Favourite = typeof favourites.$inferSelect;
export type ExploreSite = typeof exploreSites.$inferSelect;
