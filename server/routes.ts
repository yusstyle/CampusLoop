import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated } from "./localAuth";
import { buildPaymentFormData, getPaymentPageUrl, generateTransactionRef, verifyTransaction } from "./interswitch";
import type { User } from "@shared/schema";
import { db } from "./db";
import { channels, channelMembers } from "@shared/schema";
import { eq, or } from "drizzle-orm";

async function autoJoinUserChannels(userId: string, universityId?: number | null, facultyId?: number | null, departmentId?: number | null) {
  try {
    const conditions: any[] = [eq(channels.type, "general")];
    if (universityId) conditions.push(eq(channels.universityId, universityId));
    if (facultyId) conditions.push(eq(channels.facultyId, facultyId));
    if (departmentId) conditions.push(eq(channels.departmentId, departmentId));
    const relevantChannels = await db.select().from(channels).where(or(...conditions));
    for (const ch of relevantChannels) {
      await db.insert(channelMembers).values({ channelId: ch.id, userId }).onConflictDoNothing();
    }
  } catch (err) {
    console.error("Auto-join error:", err);
  }
}

function getUserId(req: any): string {
  return (req.user as User).id;
}

function getUserRole(req: any): string {
  return (req.user as User).role || "student";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use('/api', (req, res, next) => {
    if (
      req.path.startsWith('/auth/') ||
      req.path === '/login' ||
      req.path === '/callback' ||
      req.path === '/logout'
    ) {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    const safe = users.map(({ password: _p, ...u }) => u);
    res.json(safe);
  });

  app.patch(api.users.updateProfile.path, async (req: any, res) => {
    try {
      const updates = api.users.updateProfile.input.parse(req.body);
      const user = await storage.updateUser(getUserId(req), updates);
      // Auto-join channels when university/faculty/department changes
      if (updates.universityId || updates.facultyId || updates.departmentId) {
        await autoJoinUserChannels(user.id, user.universityId, user.facultyId, user.departmentId);
      }
      const { password: _p, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Channels
  app.get(api.channels.list.path, async (req: any, res) => {
    const { universityId, facultyId, departmentId } = req.query;
    const channels = await storage.getChannels({
      universityId: universityId ? Number(universityId) : undefined,
      facultyId: facultyId ? Number(facultyId) : undefined,
      departmentId: departmentId ? Number(departmentId) : undefined,
    });
    res.json(channels);
  });

  app.post(api.channels.create.path, async (req: any, res) => {
    try {
      const input = api.channels.create.input.parse(req.body);
      const channel = await storage.createChannel({ ...input, createdBy: getUserId(req) });
      res.status(201).json(channel);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.channels.get.path, async (req, res) => {
    const channel = await storage.getChannel(Number(req.params.id));
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    res.json(channel);
  });

  app.post(api.channels.join.path, async (req: any, res) => {
    await storage.joinChannel(Number(req.params.id), getUserId(req));
    res.json({ success: true });
  });

  // Messages
  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.channelId));
    const safe = messages.map(({ user, ...m }) => {
      const { password: _p, ...safeUser } = user;
      return { ...m, user: safeUser };
    });
    res.json(safe);
  });

  app.post(api.messages.create.path, async (req: any, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage({ ...input, channelId: Number(req.params.channelId), userId: getUserId(req) });
      const { user, ...m } = message;
      const { password: _p, ...safeUser } = user;
      res.status(201).json({ ...m, user: safeUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Posts
  app.get(api.posts.list.path, async (req: any, res) => {
    const userId = getUserId(req);
    const posts = await storage.getPosts();
    const safe = await Promise.all(posts.map(async ({ user, comments, ...p }) => {
      const { password: _pu, ...safeUser } = user;
      const likesCount = await storage.getLikesCount(p.id);
      const isLiked = await storage.isPostLiked(userId, p.id);
      return {
        ...p, user: safeUser, likesCount, isLiked,
        comments: comments.map(({ user: cu, ...c }) => {
          const { password: _pc, ...safeCU } = cu;
          return { ...c, user: safeCU };
        })
      };
    }));
    res.json(safe);
  });

  app.post(api.posts.create.path, async (req: any, res) => {
    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createPost({ ...input, userId: getUserId(req) });
      const { user, ...p } = post;
      const { password: _p, ...safeUser } = user;
      res.status(201).json({ ...p, user: safeUser, comments: [], likesCount: 0, isLiked: false });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Post Likes
  app.post("/api/posts/:postId/like", async (req: any, res) => {
    const postId = Number(req.params.postId);
    const userId = getUserId(req);
    const isLiked = await storage.isPostLiked(userId, postId);
    if (isLiked) {
      await storage.unlikePost(userId, postId);
    } else {
      await storage.likePost(userId, postId);
    }
    const likesCount = await storage.getLikesCount(postId);
    res.json({ isLiked: !isLiked, likesCount });
  });

  // Comments
  app.get(api.comments.list.path, async (req, res) => {
    const comments = await storage.getComments(Number(req.params.postId));
    const safe = comments.map(({ user, ...c }) => {
      const { password: _p, ...safeUser } = user;
      return { ...c, user: safeUser };
    });
    res.json(safe);
  });

  app.post(api.comments.create.path, async (req: any, res) => {
    try {
      const input = api.comments.create.input.parse(req.body);
      const comment = await storage.createComment({ ...input, postId: Number(req.params.postId), userId: getUserId(req) });
      const { user, ...c } = comment;
      const { password: _p, ...safeUser } = user;
      res.status(201).json({ ...c, user: safeUser });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Materials
  app.get(api.materials.list.path, async (req: any, res) => {
    let channelId = req.query.channelId ? Number(req.query.channelId) : undefined;
    const materialList = await storage.getMaterials(channelId);
    const unlockedIds = await storage.getUnlockedMaterials(getUserId(req));
    const currentUser = req.user as User;

    const safe = materialList.map(({ uploader, ...m }) => {
      const { password: _p, ...safeUploader } = uploader;
      const isUnlocked = !m.isPremium || currentUser.isPremium || unlockedIds.includes(m.id);
      return { ...m, uploader: safeUploader, isUnlocked };
    });
    res.json(safe);
  });

  app.post(api.materials.create.path, async (req: any, res) => {
    try {
      const input = api.materials.create.input.parse(req.body);
      const material = await storage.createMaterial({ ...input, uploaderId: getUserId(req) });
      const { uploader, ...m } = material;
      const { password: _p, ...safeUploader } = uploader;
      res.status(201).json({ ...m, uploader: safeUploader });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment Routes
  app.post("/api/payments/initiate", async (req: any, res) => {
    try {
      const { materialId } = req.body;
      const userId = getUserId(req);
      const currentUser = req.user as User;

      let material = null;
      let amount = 100000; // Default premium subscription: 1000 NGN in kobo

      if (materialId) {
        material = await storage.getMaterial(Number(materialId));
        if (!material) return res.status(404).json({ message: "Material not found" });
        if (!material.isPremium) return res.status(400).json({ message: "Material is not premium" });
        const alreadyUnlocked = await storage.isUnlocked(userId, material.id);
        if (alreadyUnlocked) return res.status(400).json({ message: "Material already unlocked" });
        amount = material.price && material.price > 0 ? material.price : 100000;
      }

      const txnref = generateTransactionRef();
      // Use x-forwarded headers for correct public URL behind Replit proxy
      const proto = req.get("x-forwarded-proto") || req.protocol || "https";
      const host = req.get("x-forwarded-host") || req.get("host") || "";
      const redirectUrl = `${proto}://${host}/api/payments/callback`;

      await storage.createTransaction({
        transactionRef: txnref,
        userId,
        materialId: material?.id,
        amount,
      });

      const formData = buildPaymentFormData({
        txnref,
        amount,
        customerEmail: currentUser.email || "",
        customerName: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim(),
        redirectUrl,
        payItemName: material ? material.title : "CampusLoop Premium",
      });

      console.log("[Payment] Initiating payment:", {
        txnref,
        amount,
        redirectUrl,
        merchantcode: formData.merchantcode,
        payItemID: formData.payItemID,
        paymentUrl: getPaymentPageUrl(),
      });

      res.json({
        paymentUrl: getPaymentPageUrl(),
        formData,
        txnref,
      });
    } catch (err) {
      console.error("Payment initiation error:", err);
      res.status(500).json({ message: "Failed to initiate payment" });
    }
  });

  app.get("/api/payments/callback", async (req: any, res) => {
    const { txnref, paymentReference } = req.query as any;

    if (!txnref) {
      return res.redirect("/?payment=failed&reason=no_ref");
    }

    try {
      const txn = await storage.getTransaction(txnref);
      if (!txn) return res.redirect("/?payment=failed&reason=not_found");

      const verification = await verifyTransaction(txnref, txn.amount);

      if (verification.status === "success") {
        await storage.updateTransactionStatus(txnref, "success");
        if (txn.materialId) {
          await storage.unlockMaterial(txn.userId, txn.materialId);
        } else {
          await storage.upgradeToPremium(txn.userId);
        }
        return res.redirect("/materials?payment=success");
      } else if (verification.status === "pending") {
        return res.redirect("/materials?payment=pending");
      } else {
        await storage.updateTransactionStatus(txnref, "failed");
        return res.redirect("/materials?payment=failed");
      }
    } catch (err) {
      console.error("Payment callback error:", err);
      return res.redirect("/?payment=error");
    }
  });

  app.post("/api/payments/verify", async (req: any, res) => {
    const { txnref } = req.body;
    if (!txnref) return res.status(400).json({ message: "No transaction reference" });

    try {
      const txn = await storage.getTransaction(txnref);
      if (!txn) return res.status(404).json({ message: "Transaction not found" });
      if (txn.userId !== getUserId(req)) return res.status(403).json({ message: "Forbidden" });
      res.json({ status: txn.status });
    } catch (err) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Admin Routes
  app.get(api.admin.universities.path, async (req: any, res) => {
    const unis = await storage.getUniversities();
    res.json(unis);
  });

  app.post(api.admin.createUniversity.path, async (req: any, res) => {
    if (getUserRole(req) !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const input = api.admin.createUniversity.input.parse(req.body);
      const uni = await storage.createUniversity(input);
      res.status(201).json(uni);
    } catch (err) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.get(api.admin.faculties.path, async (req: any, res) => {
    const universityId = Number(req.params.universityId);
    const faculties = await storage.getFaculties(universityId);
    res.json(faculties);
  });

  app.post(api.admin.createFaculty.path, async (req: any, res) => {
    if (getUserRole(req) !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const input = api.admin.createFaculty.input.parse(req.body);
      const fac = await storage.createFaculty(input);
      res.status(201).json(fac);
    } catch (err) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.get(api.admin.departments.path, async (req: any, res) => {
    const facultyId = Number(req.params.facultyId);
    const departments = await storage.getDepartments(facultyId);
    res.json(departments);
  });

  app.post(api.admin.createDepartment.path, async (req: any, res) => {
    if (getUserRole(req) !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const input = api.admin.createDepartment.input.parse(req.body);
      const dept = await storage.createDepartment(input);
      res.status(201).json(dept);
    } catch (err) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Friend Request Routes
  app.post(api.friends.send.path, async (req: any, res) => {
    try {
      const receiverId = req.params.userId;
      const req_data = await storage.sendFriendRequest(getUserId(req), receiverId);
      res.status(201).json(req_data);
    } catch (err) {
      res.status(400).json({ message: 'Failed to send request' });
    }
  });

  app.get(api.friends.getPending.path, async (req: any, res) => {
    const requests = await storage.getFriendRequests(getUserId(req), 'pending');
    res.json(requests);
  });

  app.post(api.friends.accept.path, async (req: any, res) => {
    try {
      const requestId = Number(req.params.requestId);
      const req_data = await storage.acceptFriendRequest(requestId);
      res.json(req_data);
    } catch (err) {
      res.status(400).json({ message: 'Failed to accept request' });
    }
  });

  app.post(api.friends.reject.path, async (req: any, res) => {
    try {
      const requestId = Number(req.params.requestId);
      await storage.rejectFriendRequest(requestId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: 'Failed to reject request' });
    }
  });

  return httpServer;
}
