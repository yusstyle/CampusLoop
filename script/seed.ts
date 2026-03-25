import { db } from "../server/db";
import { users, channels, posts, materials, messages, comments } from "@shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding database with rich data...");

  // 1. Create some Mock Users
  const mockUsers = [
    {
      id: "mock-user-1",
      email: "prof.smith@university.edu",
      firstName: "Dr. Robert",
      lastName: "Smith",
      role: "lecturer",
      department: "Computer Science",
      bio: "Head of AI Research. Passionate about machine learning and teaching the next generation of engineers.",
      availableForSocial: true,
    },
    {
      id: "mock-user-2",
      email: "sarah.j@student.edu",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "student",
      department: "Engineering",
      bio: "Student Union President. Always down for a coffee and talk about campus improvements!",
      availableForSocial: true,
    },
    {
      id: "mock-user-3",
      email: "hod.physics@university.edu",
      firstName: "Prof. Maria",
      lastName: "Garcia",
      role: "faculty",
      department: "Physics",
      bio: "HOD Physics Department. Dedicated to academic excellence.",
      availableForSocial: false,
    },
    {
      id: "mock-user-4",
      email: "alex.w@student.edu",
      firstName: "Alex",
      lastName: "Wong",
      role: "student",
      department: "Mathematics",
      bio: "Math enthusiast. Looking for study partners for Advanced Calculus.",
      availableForSocial: true,
    }
  ];

  for (const user of mockUsers) {
    await db.insert(users).values(user).onConflictDoNothing();
  }
  console.log("Mock users created.");

  // 2. Insert Channels
  const channelData = [
    { name: "General", description: "General campus discussion", type: "general" },
    { name: "CS 101", description: "Introduction to Computing", type: "class" },
    { name: "Robotics Club", description: "Build and program robots together", type: "club" },
    { name: "Engineering Dept", description: "Official announcements for Engineering students", type: "department" },
    { name: "Faculty Lounge", description: "Private space for faculty and staff", type: "faculty" },
  ];

  const insertedChannels = await db.insert(channels).values(channelData).onConflictDoUpdate({
    target: channels.id,
    set: { name: sql`EXCLUDED.name` }
  }).returning();
  
  console.log(`Channels set up.`);

  // 3. Create some Posts
  const postData = [
    {
      userId: "mock-user-2",
      content: "Just finished the mid-term project for CS 101! 🚀 It was tough but rewarding. Anyone else still working on it?",
    },
    {
      userId: "mock-user-1",
      content: "Reminder to all students: The AI guest lecture is happening tomorrow at 2 PM in Hall B. Don't miss out on hearing from industry leaders!",
    },
    {
      userId: "mock-user-4",
      content: "Does anyone have the past papers for Linear Algebra? I'm struggling with the vector space concepts.",
    }
  ];

  const insertedPosts = await db.insert(posts).values(postData).returning();
  console.log("Sample posts created.");

  // 4. Add some Comments
  if (insertedPosts.length > 0) {
    await db.insert(comments).values([
      { postId: insertedPosts[0].id, userId: "mock-user-4", content: "Congrats Sarah! I'm almost done, just debugging the last part." },
      { postId: insertedPosts[0].id, userId: "mock-user-1", content: "Great work Sarah. Looking forward to seeing the final result." },
      { postId: insertedPosts[2].id, userId: "mock-user-2", content: "I have them! I'll upload them to the Mathematics channel materials section now." },
    ]);
  }

  // 5. Add some Materials
  await db.insert(materials).values([
    {
      title: "Introduction to React Hooks",
      description: "A comprehensive guide to useState, useEffect, and custom hooks.",
      url: "https://react.dev",
      uploaderId: "mock-user-1",
      channelId: insertedChannels[1].id
    },
    {
      title: "Physics Lab Manual 2026",
      description: "Required reading for all sophomore physics students.",
      url: "https://university.edu/physics/manual",
      uploaderId: "mock-user-3",
      channelId: insertedChannels[4].id
    },
    {
      title: "Robotics 101 - Building your first bot",
      description: "Starter kit documentation and assembly guide.",
      url: "https://arduino.cc",
      uploaderId: "mock-user-2",
      channelId: insertedChannels[2].id
    }
  ]);
  console.log("Sample materials created.");

  // 6. Add some Messages
  await db.insert(messages).values([
    { channelId: insertedChannels[0].id, userId: "mock-user-2", content: "Hey everyone! Hope you're having a great week." },
    { channelId: insertedChannels[0].id, userId: "mock-user-4", content: "You too Sarah! Ready for the weekend socials?" },
    { channelId: insertedChannels[1].id, userId: "mock-user-1", content: "Assignment 3 is now posted on the portal. Please submit by Friday." },
  ]);

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
