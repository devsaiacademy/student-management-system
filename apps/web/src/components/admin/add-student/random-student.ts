import type { CreateStudentInput } from "@student-management-system/api/schemas/student";

// Dev-only test helper: produces random but schema-valid Student Information so
// the Add Student form can be populated in one click. Only the personal-detail
// fields are generated — enrollment/payment fields are left untouched so they
// can be set per test scenario.

const FIRST_NAMES = [
  "Aarav",
  "Diya",
  "Vivaan",
  "Ananya",
  "Aditya",
  "Ishita",
  "Kabir",
  "Meera",
  "Rohan",
  "Saanvi",
  "Arjun",
  "Tara",
  "Dev",
  "Kiara",
  "Nikhil",
  "Riya",
];

const LAST_NAMES = [
  "Sharma",
  "Patel",
  "Reddy",
  "Nair",
  "Iyer",
  "Gupta",
  "Mehta",
  "Rao",
  "Verma",
  "Kapoor",
  "Menon",
  "Pillai",
];

const SCHOOLS = [
  "Greenwood High",
  "St. Joseph's",
  "Delhi Public School",
  "Vidya Niketan",
  "National Academy",
  "Sunrise International",
];

const OCCUPATIONS = [
  "Engineer",
  "Teacher",
  "Doctor",
  "Homemaker",
  "Accountant",
  "Business Owner",
  "Designer",
  "Lawyer",
  "Nurse",
  "Architect",
];

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)] as T;

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// 10-digit Indian-style number starting 6–9.
const randomPhone = (): string => {
  let digits = String(randomInt(6, 9));
  for (let i = 0; i < 9; i++) {
    digits += String(randomInt(0, 9));
  }
  return digits;
};

export function generateRandomStudentInfo(): Partial<CreateStudentInput> {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const motherFirst = pick(FIRST_NAMES);
  const fatherFirst = pick(FIRST_NAMES);
  // Suffix keeps roll number and email unique across repeated clicks.
  const suffix = randomInt(1000, 999_999);
  const startYear = randomInt(2023, 2026);

  return {
    name: `${first} ${last}`,
    rollNumber: `OTM-RND-${suffix}`,
    age: randomInt(5, 18),
    phoneNumber: randomPhone(),
    email: `${first}.${last}.${suffix}`.toLowerCase() + "@example.com",
    schoolName: pick(SCHOOLS),
    standard: String(randomInt(1, 12)),
    academicYear: `${startYear}-${startYear + 1}`,
    motherName: `${motherFirst} ${last}`,
    motherOccupation: pick(OCCUPATIONS),
    fatherName: `${fatherFirst} ${last}`,
    fatherOccupation: pick(OCCUPATIONS),
  };
}
