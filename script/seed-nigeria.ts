import { db } from "../server/db";
import { users, universities, faculties, departments, channels, channelMembers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const NIGERIAN_UNIVERSITIES = [
  // Federal Universities
  { name: "University of Lagos (UNILAG)", description: "Federal university located in Lagos, established 1962." },
  { name: "University of Ibadan (UI)", description: "Nigeria's first university, established 1948." },
  { name: "Ahmadu Bello University (ABU)", description: "Federal university in Zaria, established 1962." },
  { name: "University of Nigeria, Nsukka (UNN)", description: "Federal university in Enugu State, established 1960." },
  { name: "Obafemi Awolowo University (OAU)", description: "Federal university in Ile-Ife, established 1961." },
  { name: "University of Benin (UNIBEN)", description: "Federal university in Benin City, established 1970." },
  { name: "University of Ilorin (UNILORIN)", description: "Federal university in Kwara State, established 1975." },
  { name: "University of Jos (UNIJOS)", description: "Federal university in Plateau State, established 1971." },
  { name: "University of Maiduguri (UNIMAID)", description: "Federal university in Borno State, established 1975." },
  { name: "University of Calabar (UNICAL)", description: "Federal university in Cross River State, established 1975." },
  { name: "University of Port Harcourt (UNIPORT)", description: "Federal university in Rivers State, established 1975." },
  { name: "University of Abuja (UNIABUJA)", description: "Federal university in the FCT, established 1988." },
  { name: "Bayero University Kano (BUK)", description: "Federal university in Kano State, established 1977." },
  { name: "Usman Dan Fodio University (UDUS)", description: "Federal university in Sokoto, established 1975." },
  { name: "Michael Okpara University of Agriculture, Umudike", description: "Federal agricultural university in Abia State." },
  { name: "Federal University of Technology, Akure (FUTA)", description: "Federal tech university in Ondo State." },
  { name: "Federal University of Technology, Minna (FUTMINNA)", description: "Federal tech university in Niger State." },
  { name: "Federal University of Technology, Owerri (FUTO)", description: "Federal tech university in Imo State." },
  { name: "Federal University, Otuoke (FUO)", description: "Federal university in Bayelsa State." },
  { name: "Federal University, Lafia (FULAFIA)", description: "Federal university in Nasarawa State." },
  { name: "Federal University, Lokoja (FULOKOJA)", description: "Federal university in Kogi State." },
  { name: "Federal University, Ndufu-Alike (FUNAI)", description: "Federal university in Ebonyi State." },
  { name: "Federal University, Oye-Ekiti (FUOYE)", description: "Federal university in Ekiti State." },
  { name: "Federal University, Kashere (FUKASHERE)", description: "Federal university in Gombe State." },
  { name: "Federal University, Dustin-Ma (FUDMA)", description: "Federal university in Katsina State." },
  { name: "Federal University, Birnin-Kebbi (FUBK)", description: "Federal university in Kebbi State." },
  { name: "Federal University, Gusau (FUGUS)", description: "Federal university in Zamfara State." },
  { name: "Federal University, Wukari (FUWUKARI)", description: "Federal university in Taraba State." },
  { name: "Modibbo Adama University of Technology (MAUTECH)", description: "Federal tech university in Yola, Adamawa State." },
  { name: "Nigerian Defence Academy (NDA)", description: "Federal military university in Kaduna." },

  // State Universities
  { name: "Lagos State University (LASU)", description: "State university in Lagos, established 1983." },
  { name: "Ambrose Alli University (AAU)", description: "State university in Ekpoma, Edo State." },
  { name: "Ekiti State University (EKSU)", description: "State university in Ekiti State." },
  { name: "Rivers State University (RSU)", description: "State university in Port Harcourt." },
  { name: "Delta State University (DELSU)", description: "State university in Delta State." },
  { name: "Imo State University (IMSU)", description: "State university in Imo State." },
  { name: "Adekunle Ajasin University (AAUA)", description: "State university in Ondo State." },
  { name: "Osun State University (UNIOSUN)", description: "State university in Osun State." },
  { name: "Kwara State University (KWASU)", description: "State university in Kwara State." },
  { name: "Adamawa State University (ADSU)", description: "State university in Adamawa State." },
  { name: "Kogi State University (KSU)", description: "State university in Kogi State." },
  { name: "Nassarawa State University (NSUK)", description: "State university in Nassarawa State." },
  { name: "Benue State University (BSU)", description: "State university in Benue State." },
  { name: "Abia State University (ABSU)", description: "State university in Abia State." },
  { name: "Enugu State University (ESUT)", description: "State university in Enugu State." },
  { name: "Anambra State University (ANSU)", description: "State university in Anambra State." },
  { name: "Cross River State University of Technology (CRUTECH)", description: "State tech university in Cross River." },
  { name: "Taraba State University (TSU)", description: "State university in Taraba State." },
  { name: "Plateau State University (PLASU)", description: "State university in Plateau State." },
  { name: "Kebbi State University (KSUSTA)", description: "State university in Kebbi State." },
  { name: "Gombe State University (GSU)", description: "State university in Gombe State." },
  { name: "Bauchi State University (BASU)", description: "State university in Bauchi State." },
  { name: "Yobe State University (YSU)", description: "State university in Yobe State." },
  { name: "Sokoto State University (SSU)", description: "State university in Sokoto State." },
  { name: "Zamfara State University (ZASU)", description: "State university in Zamfara State." },
  { name: "Kano State University (KASU)", description: "State university in Kano State." },
  { name: "Katsina State University", description: "State university in Katsina State." },
  { name: "Kaduna State University (KASU)", description: "State university in Kaduna." },
  { name: "Niger State University (NSUN)", description: "State university in Niger State." },
  { name: "Bayelsa State University", description: "State university in Bayelsa State." },
  { name: "Akwa Ibom State University (AKSU)", description: "State university in Akwa Ibom." },
  { name: "Cross River University of Technology", description: "State tech university in Cross River." },

  // Private Universities
  { name: "Covenant University", description: "Private Christian university in Ota, Ogun State." },
  { name: "Bowen University", description: "Private Baptist university in Iwo, Osun State." },
  { name: "Babcock University", description: "Private Seventh-Day Adventist university in Ogun State." },
  { name: "Redeemer's University", description: "Private university in Ede, Osun State." },
  { name: "Pan-Atlantic University (PAU)", description: "Private university in Lagos." },
  { name: "American University of Nigeria (AUN)", description: "Private university in Yola, Adamawa State." },
  { name: "Baze University", description: "Private university in Abuja, FCT." },
  { name: "Afe Babalola University (ABUAD)", description: "Private university in Ekiti State." },
  { name: "Al-Hikmah University", description: "Private Muslim university in Kwara State." },
  { name: "Chrisland University", description: "Private university in Ogun State." },
  { name: "Fountain University", description: "Private university in Osun State." },
  { name: "Gregory University", description: "Private university in Ebonyi State." },
  { name: "Godfrey Okoye University", description: "Private Catholic university in Enugu." },
  { name: "Igbinedion University", description: "Private university in Okada, Edo State." },
  { name: "Joseph Ayo Babalola University (JABU)", description: "Private university in Osun State." },
  { name: "Landmark University", description: "Private university in Kwara State." },
  { name: "Lead City University", description: "Private university in Ibadan." },
  { name: "Madonna University", description: "Private Catholic university in Anambra State." },
  { name: "McPherson University", description: "Private Methodist university in Ogun State." },
  { name: "Novena University", description: "Private university in Delta State." },
  { name: "Oduduwa University", description: "Private university in Osun State." },
  { name: "Paul University", description: "Private university in Anambra State." },
  { name: "Rhema University", description: "Private university in Rivers State." },
  { name: "Salem University", description: "Private university in Kogi State." },
  { name: "Tansian University", description: "Private university in Anambra State." },
  { name: "University of Mkar", description: "Private Christian university in Benue State." },
  { name: "Veritas University", description: "Private Catholic university in Abuja." },
  { name: "Western Delta University", description: "Private university in Delta State." },
  { name: "Wellspring University", description: "Private university in Edo State." },
  { name: "Wesley University", description: "Private Methodist university in Ondo State." },
];

const FACULTIES_BY_TYPE = [
  { name: "Faculty of Arts", description: "Language, literature, history, and humanities." },
  { name: "Faculty of Science", description: "Physics, chemistry, biology, and mathematics." },
  { name: "Faculty of Engineering", description: "Civil, mechanical, electrical, and computer engineering." },
  { name: "Faculty of Law", description: "Nigerian and international law studies." },
  { name: "Faculty of Medicine", description: "MBBS and medical sciences." },
  { name: "Faculty of Social Sciences", description: "Economics, sociology, political science, and psychology." },
  { name: "Faculty of Education", description: "Teacher training and educational management." },
  { name: "Faculty of Management Sciences", description: "Business administration, accounting, and marketing." },
  { name: "Faculty of Agriculture", description: "Crop science, animal science, and agronomy." },
  { name: "Faculty of Pharmacy", description: "Pharmaceutical sciences and clinical pharmacy." },
  { name: "Faculty of Environmental Sciences", description: "Architecture, estate management, and urban planning." },
  { name: "Faculty of Computing", description: "Computer science, information technology, and cybersecurity." },
];

const DEPARTMENTS_BY_FACULTY: Record<string, string[]> = {
  "Faculty of Arts": ["English Language", "History", "Philosophy", "Religious Studies", "Linguistics", "Theatre Arts", "Music", "French"],
  "Faculty of Science": ["Physics", "Chemistry", "Biology", "Mathematics", "Biochemistry", "Microbiology", "Geology", "Statistics"],
  "Faculty of Engineering": ["Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Computer Engineering", "Chemical Engineering", "Agricultural Engineering"],
  "Faculty of Law": ["Common Law", "Islamic Law", "International Law"],
  "Faculty of Medicine": ["Medicine & Surgery", "Nursing", "Medical Laboratory Science", "Physiotherapy", "Dentistry", "Anatomy", "Physiology"],
  "Faculty of Social Sciences": ["Economics", "Sociology", "Political Science", "Psychology", "Mass Communication", "Geography", "Social Work"],
  "Faculty of Education": ["Educational Management", "Curriculum Studies", "Educational Psychology", "Adult Education", "Physical Education"],
  "Faculty of Management Sciences": ["Business Administration", "Accounting", "Marketing", "Banking & Finance", "Public Administration", "Insurance"],
  "Faculty of Agriculture": ["Crop Science", "Animal Science", "Agronomy", "Fisheries", "Forestry", "Veterinary Medicine"],
  "Faculty of Pharmacy": ["Clinical Pharmacy", "Pharmaceutical Chemistry", "Pharmacology", "Pharmaceutics"],
  "Faculty of Environmental Sciences": ["Architecture", "Estate Management", "Urban & Regional Planning", "Quantity Surveying", "Building"],
  "Faculty of Computing": ["Computer Science", "Information Technology", "Cybersecurity", "Software Engineering", "Data Science"],
};

async function ensureOrCreate(table: any, where: any, insert: any) {
  const existing = await db.select().from(table).where(where);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(table).values(insert).returning();
  return created;
}

async function autoJoinChannel(userId: string, channelId: number) {
  await db.insert(channelMembers).values({ channelId, userId }).onConflictDoNothing();
}

async function createUniversityChannels(universityId: number, uniName: string) {
  // General university channel
  const uniChannel = await ensureOrCreate(
    channels,
    eq(channels.name, `${uniName} General`),
    { name: `${uniName} General`, description: `General discussion for ${uniName}`, type: "university", universityId }
  );
  return uniChannel;
}

async function createFacultyChannels(facultyId: number, universityId: number, facultyName: string) {
  const facChannel = await ensureOrCreate(
    channels,
    eq(channels.name, `${facultyName}`),
    { name: facultyName, description: `Faculty of channel`, type: "faculty", facultyId, universityId }
  );
  return facChannel;
}

async function createDepartmentChannels(departmentId: number, facultyId: number, universityId: number, deptName: string) {
  const deptChannel = await ensureOrCreate(
    channels,
    eq(channels.name, `${deptName} Dept`),
    { name: `${deptName} Dept`, description: `Department channel for ${deptName}`, type: "department", departmentId, facultyId, universityId }
  );
  return deptChannel;
}

async function seedUniversities() {
  console.log("Seeding Nigerian universities...");
  const results: Record<string, { id: number; name: string }> = {};

  for (const uni of NIGERIAN_UNIVERSITIES) {
    const existing = await db.select().from(universities).where(eq(universities.name, uni.name));
    if (existing.length > 0) {
      results[uni.name] = existing[0];
      continue;
    }
    const [created] = await db.insert(universities).values(uni).returning();
    results[uni.name] = created;
    console.log(`  Created university: ${uni.name}`);
  }

  return results;
}

async function seedFacultiesAndDepartments(uniId: number) {
  const facultyResults: Array<{ id: number; name: string }> = [];

  for (const fac of FACULTIES_BY_TYPE) {
    const existing = await db.select().from(faculties).where(eq(faculties.name, `${fac.name} (${uniId})`));
    
    const existing2 = await db.select().from(faculties)
      .where(eq(faculties.universityId, uniId));
    
    const existingFac = existing2.find(f => f.name === fac.name);
    
    let faculty: { id: number; name: string };
    if (existingFac) {
      faculty = existingFac;
    } else {
      const [created] = await db.insert(faculties).values({ name: fac.name, description: fac.description, universityId: uniId }).returning();
      faculty = created;
    }

    facultyResults.push(faculty);

    const deptNames = DEPARTMENTS_BY_FACULTY[fac.name] || [];
    for (const deptName of deptNames) {
      const existingDepts = await db.select().from(departments).where(eq(departments.facultyId, faculty.id));
      const existingDept = existingDepts.find(d => d.name === deptName);
      if (!existingDept) {
        await db.insert(departments).values({ name: deptName, facultyId: faculty.id }).returning();
      }
    }
  }
  return facultyResults;
}

async function createOrGetUser(
  email: string, password: string, firstName: string, lastName: string,
  role: string, isPremium: boolean, universityId?: number, facultyId?: number, departmentId?: number,
  matricNumber?: string, staffId?: string
) {
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    // Update to ensure premium/role is correct
    const [updated] = await db.update(users).set({ isPremium, role }).where(eq(users.email, email)).returning();
    return updated;
  }
  const hashed = await hashPassword(password);
  const [user] = await db.insert(users).values({
    email,
    password: hashed,
    firstName,
    lastName,
    role,
    isPremium,
    universityId: universityId ?? null,
    facultyId: facultyId ?? null,
    departmentId: departmentId ?? null,
    matricNumber: matricNumber ?? null,
    staffId: staffId ?? null,
    availableForSocial: true,
  }).returning();
  return user;
}

async function main() {
  console.log("\n=== CampusLoop Nigeria Seed ===\n");

  // 1. Seed all Nigerian universities
  const uniMap = await seedUniversities();
  console.log(`\nSeeded ${Object.keys(uniMap).length} universities.`);

  // 2. Seed faculties/departments for first 8 major universities only (to keep startup fast)
  const majorUnis = [
    "University of Lagos (UNILAG)",
    "University of Ibadan (UI)",
    "Ahmadu Bello University (ABU)",
    "University of Nigeria, Nsukka (UNN)",
    "Obafemi Awolowo University (OAU)",
    "University of Benin (UNIBEN)",
    "Lagos State University (LASU)",
    "Covenant University",
    "Bayero University Kano (BUK)",
    "University of Port Harcourt (UNIPORT)",
    "University of Abuja (UNIABUJA)",
    "Federal University of Technology, Akure (FUTA)",
  ];

  for (const uniName of majorUnis) {
    const uni = uniMap[uniName];
    if (!uni) continue;
    console.log(`\nSeeding faculties for ${uniName}...`);
    await seedFacultiesAndDepartments(uni.id);
    await createUniversityChannels(uni.id, uni.name);
  }

  // 3. Get a reference university for special accounts
  const unilagId = uniMap["University of Lagos (UNILAG)"]?.id;
  
  // Get a faculty and department for UNILAG
  let unilagFacultyId: number | undefined;
  let unilagDeptId: number | undefined;
  
  if (unilagId) {
    const unilagFaculties = await db.select().from(faculties).where(eq(faculties.universityId, unilagId));
    const compFac = unilagFaculties.find(f => f.name === "Faculty of Computing") || unilagFaculties[0];
    if (compFac) {
      unilagFacultyId = compFac.id;
      const depts = await db.select().from(departments).where(eq(departments.facultyId, compFac.id));
      unilagDeptId = depts[0]?.id;
    }
  }

  // 4. Create admin accounts
  console.log("\nCreating admin accounts...");
  
  const admin1 = await createOrGetUser(
    "y@gmail.com", "00998877", "Admin", "Yusuf", 
    "admin", true, unilagId, unilagFacultyId, unilagDeptId, undefined, "ADMIN-001"
  );
  console.log(`  Admin 1: y@gmail.com (${admin1.id})`);

  const admin2 = await createOrGetUser(
    "u@gmail.com", "77889900", "Admin", "User",
    "admin", true, unilagId, unilagFacultyId, unilagDeptId, undefined, "ADMIN-002"
  );
  console.log(`  Admin 2: u@gmail.com (${admin2.id})`);

  // 5. Create free all-access account
  console.log("\nCreating free all-access account...");
  const freeUser = await createOrGetUser(
    "yusufhussaini0904@gmail.com", "098756", "Yusuf", "Hussaini",
    "student", true, unilagId, unilagFacultyId, unilagDeptId, "19/00001", undefined
  );
  console.log(`  Free account: yusufhussaini0904@gmail.com (${freeUser.id})`);

  // 6. Auto-join channels for special accounts
  if (unilagId) {
    const uniChannels = await db.select().from(channels).where(eq(channels.universityId, unilagId));
    for (const ch of uniChannels) {
      await autoJoinChannel(admin1.id, ch.id);
      await autoJoinChannel(admin2.id, ch.id);
      await autoJoinChannel(freeUser.id, ch.id);
    }
  }

  // 7. Create general platform channels
  console.log("\nCreating general platform channels...");
  const generalChan = await ensureOrCreate(
    channels,
    eq(channels.name, "CampusLoop General"),
    { name: "CampusLoop General", description: "General discussion for all CampusLoop users across Nigeria", type: "general" }
  );
  await autoJoinChannel(admin1.id, generalChan.id);
  await autoJoinChannel(admin2.id, generalChan.id);
  await autoJoinChannel(freeUser.id, generalChan.id);

  const announcementChan = await ensureOrCreate(
    channels,
    eq(channels.name, "Platform Announcements"),
    { name: "Platform Announcements", description: "Official CampusLoop announcements and updates", type: "general" }
  );
  await autoJoinChannel(admin1.id, announcementChan.id);
  await autoJoinChannel(admin2.id, announcementChan.id);
  await autoJoinChannel(freeUser.id, announcementChan.id);

  console.log("\n=== Seed Complete! ===\n");
  console.log("Admin accounts:");
  console.log("  y@gmail.com / 00998877 (admin)");
  console.log("  u@gmail.com / 77889900 (admin)");
  console.log("\nFree all-access account:");
  console.log("  yusufhussaini0904@gmail.com / 098756 (premium)");
  console.log("\nAll 90+ Nigerian universities added!");
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
