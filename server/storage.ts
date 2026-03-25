import { db } from "./db";
import { 
  channels, channelMembers, messages, posts, comments, materials, users,
  universities, faculties, departments, friendRequests, userMaterials, transactions, postLikes,
  type InsertChannel, type InsertMessage, type InsertPost, type InsertComment, type InsertMaterial,
  type Channel, type Message, type Post, type Comment, type Material, type User, type UpdateUserRequest,
  type University, type Faculty, type Department, type FriendRequest, type UserMaterial, type Transaction, type PostLike
} from "@shared/schema";
import { eq, desc, and, inArray, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: UpdateUserRequest): Promise<User>;

  // Institutions
  getUniversities(): Promise<University[]>;
  createUniversity(data: { name: string; description?: string }): Promise<University>;
  getFaculties(universityId: number): Promise<Faculty[]>;
  createFaculty(data: { universityId: number; name: string; description?: string }): Promise<Faculty>;
  getDepartments(facultyId: number): Promise<Department[]>;
  createDepartment(data: { facultyId: number; name: string; description?: string }): Promise<Department>;

  // Friend Requests
  sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest>;
  getFriendRequests(userId: string, status?: string): Promise<(FriendRequest & { sender: User, receiver: User })[]>;
  acceptFriendRequest(requestId: number): Promise<FriendRequest>;
  rejectFriendRequest(requestId: number): Promise<void>;

  // Channels
  getChannels(filters?: { universityId?: number; facultyId?: number; departmentId?: number }): Promise<Channel[]>;
  getChannel(id: number): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel & { createdBy: string }): Promise<Channel>;
  joinChannel(channelId: number, userId: string): Promise<void>;

  // Messages
  getMessages(channelId: number): Promise<(Message & { user: User })[]>;
  createMessage(message: InsertMessage & { userId: string }): Promise<Message & { user: User }>;

  // Posts
  getPosts(premiumOnly?: boolean): Promise<(Post & { user: User, comments: (Comment & { user: User })[] })[]>;
  createPost(post: InsertPost & { userId: string }): Promise<Post & { user: User }>;

  // Comments
  getComments(postId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment & { userId: string }): Promise<Comment & { user: User }>;

  // Materials
  getMaterials(channelId?: number): Promise<(Material & { uploader: User })[]>;
  createMaterial(material: InsertMaterial & { uploaderId: string }): Promise<Material & { uploader: User }>;
  getMaterial(id: number): Promise<Material | undefined>;

  // Likes
  likePost(userId: string, postId: number): Promise<void>;
  unlikePost(userId: string, postId: number): Promise<void>;
  getLikesCount(postId: number): Promise<number>;
  isPostLiked(userId: string, postId: number): Promise<boolean>;

  // Payments & Premium
  isUnlocked(userId: string, materialId: number): Promise<boolean>;
  getUnlockedMaterials(userId: string): Promise<number[]>;
  unlockMaterial(userId: string, materialId: number): Promise<UserMaterial>;
  createTransaction(data: { transactionRef: string; userId: string; materialId?: number; amount: number }): Promise<Transaction>;
  getTransaction(ref: string): Promise<Transaction | undefined>;
  updateTransactionStatus(ref: string, status: string): Promise<Transaction>;
  upgradeToPremium(userId: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Institutions
  async getUniversities(): Promise<University[]> {
    return await db.select().from(universities).orderBy(universities.name);
  }

  async createUniversity(data: { name: string; description?: string }): Promise<University> {
    const [uni] = await db.insert(universities).values(data).returning();
    return uni;
  }

  async getFaculties(universityId: number): Promise<Faculty[]> {
    return await db.select().from(faculties).where(eq(faculties.universityId, universityId));
  }

  async createFaculty(data: { universityId: number; name: string; description?: string }): Promise<Faculty> {
    const [fac] = await db.insert(faculties).values(data).returning();
    return fac;
  }

  async getDepartments(facultyId: number): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.facultyId, facultyId));
  }

  async createDepartment(data: { facultyId: number; name: string; description?: string }): Promise<Department> {
    const [dept] = await db.insert(departments).values(data).returning();
    return dept;
  }

  // Friend Requests
  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    const [req] = await db.insert(friendRequests)
      .values({ senderId, receiverId, status: 'pending' })
      .onConflictDoNothing()
      .returning();
    return req;
  }

  async getFriendRequests(userId: string, status?: string): Promise<(FriendRequest & { sender: User, receiver: User })[]> {
    let query = db.select({
      request: friendRequests,
      sender: users
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.senderId, users.id));

    if (status) {
      query = query.where(and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, status)
      )) as any;
    } else {
      query = query.where(eq(friendRequests.receiverId, userId)) as any;
    }

    const results = await query.orderBy(desc(friendRequests.createdAt));
    return results.map(({ request, sender }) => ({ ...request, sender, receiver: sender }));
  }

  async acceptFriendRequest(requestId: number): Promise<FriendRequest> {
    const [req] = await db.update(friendRequests)
      .set({ status: 'accepted' })
      .where(eq(friendRequests.id, requestId))
      .returning();
    return req;
  }

  async rejectFriendRequest(requestId: number): Promise<void> {
    await db.update(friendRequests)
      .set({ status: 'rejected' })
      .where(eq(friendRequests.id, requestId));
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.availableForSocial, true));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upgradeToPremium(userId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ isPremium: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Channels
  async getChannels(filters?: { universityId?: number; facultyId?: number; departmentId?: number }): Promise<Channel[]> {
    let query = db.select().from(channels) as any;
    if (filters?.departmentId) {
      query = query.where(eq(channels.departmentId, filters.departmentId));
    } else if (filters?.facultyId) {
      query = query.where(eq(channels.facultyId, filters.facultyId));
    } else if (filters?.universityId) {
      query = query.where(eq(channels.universityId, filters.universityId));
    }
    return await query;
  }

  async getChannel(id: number): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async createChannel(channel: InsertChannel & { createdBy: string }): Promise<Channel> {
    const [newChannel] = await db.insert(channels).values(channel).returning();
    return newChannel;
  }

  async joinChannel(channelId: number, userId: string): Promise<void> {
    await db.insert(channelMembers).values({ channelId, userId }).onConflictDoNothing();
  }

  // Messages
  async getMessages(channelId: number): Promise<(Message & { user: User })[]> {
    const msgs = await db.select({
      message: messages,
      user: users
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.channelId, channelId))
    .orderBy(messages.createdAt);

    return msgs.map(({ message, user }) => ({ ...message, user }));
  }

  async createMessage(message: InsertMessage & { userId: string }): Promise<Message & { user: User }> {
    const [newMsg] = await db.insert(messages).values(message).returning();
    const user = await this.getUser(message.userId);
    return { ...newMsg, user: user! };
  }

  // Posts
  async getPosts(): Promise<(Post & { user: User, comments: (Comment & { user: User })[] })[]> {
    const allPosts = await db.select({
      post: posts,
      user: users
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt));

    const result = [];
    for (const { post, user } of allPosts) {
      const postComments = await this.getComments(post.id);
      result.push({ ...post, user, comments: postComments });
    }
    return result;
  }

  async createPost(post: InsertPost & { userId: string }): Promise<Post & { user: User }> {
    const [newPost] = await db.insert(posts).values(post).returning();
    const user = await this.getUser(post.userId);
    return { ...newPost, user: user! };
  }

  // Comments
  async getComments(postId: number): Promise<(Comment & { user: User })[]> {
    const comms = await db.select({
      comment: comments,
      user: users
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);

    return comms.map(({ comment, user }) => ({ ...comment, user }));
  }

  async createComment(comment: InsertComment & { userId: string }): Promise<Comment & { user: User }> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    const user = await this.getUser(comment.userId);
    return { ...newComment, user: user! };
  }

  // Materials
  async getMaterials(channelId?: number): Promise<(Material & { uploader: User })[]> {
    let query = db.select({
      material: materials,
      user: users
    })
    .from(materials)
    .innerJoin(users, eq(materials.uploaderId, users.id));

    if (channelId) {
      query = query.where(eq(materials.channelId, channelId)) as any;
    }

    const res = await query.orderBy(desc(materials.createdAt));
    return res.map(({ material, user }) => ({ ...material, uploader: user }));
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async createMaterial(material: InsertMaterial & { uploaderId: string }): Promise<Material & { uploader: User }> {
    const [newMaterial] = await db.insert(materials).values(material).returning();
    const user = await this.getUser(material.uploaderId);
    return { ...newMaterial, uploader: user! };
  }

  // Likes
  async likePost(userId: string, postId: number): Promise<void> {
    await db.insert(postLikes).values({ userId, postId }).onConflictDoNothing();
  }

  async unlikePost(userId: string, postId: number): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
  }

  async getLikesCount(postId: number): Promise<number> {
    const [row] = await db.select({ count: count() }).from(postLikes).where(eq(postLikes.postId, postId));
    return row?.count ?? 0;
  }

  async isPostLiked(userId: string, postId: number): Promise<boolean> {
    const [row] = await db.select().from(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
    return !!row;
  }

  // Payments & Premium
  async isUnlocked(userId: string, materialId: number): Promise<boolean> {
    const [row] = await db.select()
      .from(userMaterials)
      .where(and(eq(userMaterials.userId, userId), eq(userMaterials.materialId, materialId)));
    return !!row;
  }

  async getUnlockedMaterials(userId: string): Promise<number[]> {
    const rows = await db.select({ materialId: userMaterials.materialId })
      .from(userMaterials)
      .where(eq(userMaterials.userId, userId));
    return rows.map(r => r.materialId);
  }

  async unlockMaterial(userId: string, materialId: number): Promise<UserMaterial> {
    const [row] = await db.insert(userMaterials)
      .values({ userId, materialId })
      .onConflictDoNothing()
      .returning();
    return row;
  }

  async createTransaction(data: { transactionRef: string; userId: string; materialId?: number; amount: number }): Promise<Transaction> {
    const [txn] = await db.insert(transactions).values({
      transactionRef: data.transactionRef,
      userId: data.userId,
      materialId: data.materialId ?? null,
      amount: data.amount,
      status: "pending",
    }).returning();
    return txn;
  }

  async getTransaction(ref: string): Promise<Transaction | undefined> {
    const [txn] = await db.select().from(transactions).where(eq(transactions.transactionRef, ref));
    return txn;
  }

  async updateTransactionStatus(ref: string, status: string): Promise<Transaction> {
    const [txn] = await db.update(transactions)
      .set({ status })
      .where(eq(transactions.transactionRef, ref))
      .returning();
    return txn;
  }
}

export const storage = new DatabaseStorage();
