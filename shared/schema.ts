import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").references(() => universities.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").references(() => faculties.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"),
  bio: text("bio"),
  department: varchar("department"),
  universityId: integer("university_id").references(() => universities.id),
  facultyId: integer("faculty_id").references(() => faculties.id),
  departmentId: integer("department_id").references(() => departments.id),
  matricNumber: varchar("matric_number"),
  staffId: varchar("staff_id"),
  isPremium: boolean("is_premium").default(false),
  availableForSocial: boolean("available_for_social").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const friendRequests = pgTable("friend_requests", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(),
  universityId: integer("university_id").references(() => universities.id),
  facultyId: integer("faculty_id").references(() => faculties.id),
  departmentId: integer("department_id").references(() => departments.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const channelMembers = pgTable("channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  url: varchar("url").notNull(),
  channelId: integer("channel_id").references(() => channels.id),
  uploaderId: varchar("user_id").references(() => users.id).notNull(),
  isPremium: boolean("is_premium").default(false),
  price: integer("price").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userMaterials = pgTable("user_materials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  materialId: integer("material_id").references(() => materials.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionRef: varchar("transaction_ref").notNull().unique(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  materialId: integer("material_id").references(() => materials.id),
  amount: integer("amount").notNull(),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const universitiesRelations = relations(universities, ({ many }) => ({
  faculties: many(faculties),
  users: many(users),
  channels: many(channels),
}));

export const facultiesRelations = relations(faculties, ({ one, many }) => ({
  university: one(universities, {
    fields: [faculties.universityId],
    references: [universities.id],
  }),
  departments: many(departments),
  users: many(users),
  channels: many(channels),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [departments.facultyId],
    references: [faculties.id],
  }),
  users: many(users),
  channels: many(channels),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
  }),
  faculty: one(faculties, {
    fields: [users.facultyId],
    references: [faculties.id],
  }),
  departmentRef: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  channelMembers: many(channelMembers),
  messages: many(messages),
  posts: many(posts),
  comments: many(comments),
  materials: many(materials),
  sentFriendRequests: many(friendRequests, { relationName: "sender" }),
  receivedFriendRequests: many(friendRequests, { relationName: "receiver" }),
  unlockedMaterials: many(userMaterials),
  transactions: many(transactions),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, {
    fields: [friendRequests.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [friendRequests.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  university: one(universities, {
    fields: [channels.universityId],
    references: [universities.id],
  }),
  faculty: one(faculties, {
    fields: [channels.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [channels.departmentId],
    references: [departments.id],
  }),
  creator: one(users, {
    fields: [channels.createdBy],
    references: [users.id],
  }),
  members: many(channelMembers),
  messages: many(messages),
  materials: many(materials),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  channel: one(channels, {
    fields: [materials.channelId],
    references: [channels.id],
  }),
  uploader: one(users, {
    fields: [materials.uploaderId],
    references: [users.id],
  }),
  unlockedBy: many(userMaterials),
}));

export const userMaterialsRelations = relations(userMaterials, ({ one }) => ({
  user: one(users, {
    fields: [userMaterials.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [userMaterials.materialId],
    references: [materials.id],
  }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [transactions.materialId],
    references: [materials.id],
  }),
}));

// Base types
export type University = typeof universities.$inferSelect;
export type InsertUniversity = typeof universities.$inferInsert;

export type Faculty = typeof faculties.$inferSelect;
export type InsertFaculty = typeof faculties.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;

export type FriendRequest = typeof friendRequests.$inferSelect;
export type InsertFriendRequest = typeof friendRequests.$inferInsert;

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

export type ChannelMember = typeof channelMembers.$inferSelect;
export type InsertChannelMember = typeof channelMembers.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export type UserMaterial = typeof userMaterials.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

// API explicit types
export const insertChannelSchema = createInsertSchema(channels).omit({ id: true, createdAt: true, createdBy: true });
export type CreateChannelRequest = z.infer<typeof insertChannelSchema>;

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, userId: true });
export type CreateMessageRequest = z.infer<typeof insertMessageSchema>;

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, userId: true });
export type CreatePostRequest = z.infer<typeof insertPostSchema>;

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, userId: true });
export type CreateCommentRequest = z.infer<typeof insertCommentSchema>;

export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true, uploaderId: true });
export type CreateMaterialRequest = z.infer<typeof insertMaterialSchema>;

export const updateUserSchema = createInsertSchema(users).pick({
  bio: true,
  department: true,
  availableForSocial: true,
  role: true,
  universityId: true,
  facultyId: true,
  departmentId: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
}).partial();
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["student", "staff"]),
  universityId: z.number().optional(),
  facultyId: z.number().optional(),
  departmentId: z.number().optional(),
  matricNumber: z.string().optional(),
  staffId: z.string().optional(),
});
export type SignupRequest = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginSchema>;

export type UserResponse = Omit<User, "password">;
export type MessageResponse = Message & { user: UserResponse };
export type PostResponse = Post & { user: UserResponse; comments: CommentResponse[]; likesCount: number; isLiked: boolean };
export type CommentResponse = Comment & { user: UserResponse };
export type MaterialResponse = Material & { uploader: UserResponse; isUnlocked?: boolean };
export type ChannelResponse = Channel & { membersCount?: number };
