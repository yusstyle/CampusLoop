import { db } from "../server/db";
import { universities, faculties, departments } from "@shared/schema";
import { eq } from "drizzle-orm";

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

async function seedFacultiesForUni(uniId: number, uniName: string) {
  const existing = await db.select().from(faculties).where(eq(faculties.universityId, uniId));
  if (existing.length > 0) {
    console.log(`  Skipping ${uniName} — already has ${existing.length} faculties`);
    return;
  }

  console.log(`  Seeding ${uniName}...`);
  for (const fac of FACULTIES_BY_TYPE) {
    const [faculty] = await db.insert(faculties).values({
      name: fac.name,
      description: fac.description,
      universityId: uniId,
    }).returning();

    const deptNames = DEPARTMENTS_BY_FACULTY[fac.name] || [];
    for (const deptName of deptNames) {
      await db.insert(departments).values({ name: deptName, facultyId: faculty.id });
    }
  }
}

async function main() {
  console.log("\n=== Seeding faculties for all universities ===\n");

  const allUnis = await db.select().from(universities);
  console.log(`Found ${allUnis.length} universities\n`);

  for (const uni of allUnis) {
    await seedFacultiesForUni(uni.id, uni.name);
  }

  console.log("\n=== Done! All universities now have faculties and departments ===\n");
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
