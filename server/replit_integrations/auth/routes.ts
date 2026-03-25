import type { Express } from "express";
import passport from "passport";
import { isAuthenticated, hashPassword } from "../../localAuth";
import { db } from "../../db";
import { users, channels, channelMembers } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { signupSchema } from "@shared/schema";
import { z } from "zod";

async function autoJoinUserChannels(
  userId: string,
  universityId?: number | null,
  facultyId?: number | null,
  departmentId?: number | null
) {
  try {
    // Build conditions for relevant channels
    const conditions: any[] = [eq(channels.type, "general")];
    if (universityId) conditions.push(eq(channels.universityId, universityId));
    if (facultyId) conditions.push(eq(channels.facultyId, facultyId));
    if (departmentId) conditions.push(eq(channels.departmentId, departmentId));

    const relevantChannels = await db.select().from(channels).where(or(...conditions));
    for (const ch of relevantChannels) {
      await db.insert(channelMembers).values({ channelId: ch.id, userId }).onConflictDoNothing();
    }
  } catch (err) {
    console.error("Auto-join channels error:", err);
  }
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      const existing = await db.select().from(users).where(eq(users.email, data.email.toLowerCase()));
      if (existing.length > 0) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      const hashed = await hashPassword(data.password);
      const [user] = await db
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          password: hashed,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          universityId: data.universityId ?? null,
          facultyId: data.facultyId ?? null,
          departmentId: data.departmentId ?? null,
          matricNumber: data.matricNumber ?? null,
          staffId: data.staffId ?? null,
        })
        .returning();

      // Auto-join relevant channels based on university/faculty/department
      await autoJoinUserChannels(user.id, user.universityId, user.facultyId, user.departmentId);

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login after signup failed" });
        const { password: _p, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Signup error:", err);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        // Auto-join channels in case they were missed
        await autoJoinUserChannels(user.id, user.universityId, user.facultyId, user.departmentId);
        const { password: _p, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _p, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Auto-join endpoint — called after onboarding profile update
  app.post("/api/auth/auto-join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ message: "User not found" });
      await autoJoinUserChannels(userId, user.universityId, user.facultyId, user.departmentId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Auto-join failed" });
    }
  });
}
