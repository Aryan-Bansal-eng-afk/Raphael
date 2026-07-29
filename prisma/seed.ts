import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve('./dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath })

// @ts-ignore - Prisma 7 adapter
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.lostEvent.deleteMany()
  await prisma.diaryEntry.deleteMany()
  await prisma.taskLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.person.deleteMany()
  await prisma.guardianPatientLink.deleteMany()
  await prisma.patientProfile.deleteMany()
  await prisma.user.deleteMany()

  // Create guardian
  const guardianPassword = await bcrypt.hash('guardian123', 10)
  const guardian = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'guardian@memory.app',
      password: guardianPassword,
      role: 'guardian',
      phone: '+91-9876543210',
    },
  })

  // Create patient user
  const patientPassword = await bcrypt.hash('patient123', 10)
  const patientUser = await prisma.user.create({
    data: {
      name: 'Ramesh Kumar',
      email: 'patient@memory.app',
      password: patientPassword,
      role: 'patient',
      phone: '+91-9123456789',
    },
  })

  // Create patient profile
  const patient = await prisma.patientProfile.create({
    data: {
      userId: patientUser.id,
      fullName: 'Ramesh Kumar',
      preferredName: 'Ramesh',
      dateOfBirth: '1948-03-15',
      diagnosis: "Alzheimer's Disease (Early Stage)",
      language: 'en',
    },
  })

  // Link guardian to patient
  await prisma.guardianPatientLink.create({
    data: {
      guardianId: guardian.id,
      patientId: patient.id,
      relationshipLabel: 'Daughter',
      isPrimary: true,
    },
  })

  // Create people in the registry
  await prisma.person.createMany({
    data: [
      {
        patientId: patient.id,
        name: 'Priya Sharma',
        nickname: 'Priya',
        relationshipLabel: 'Daughter',
        phone: '+91-9876543210',
        address: 'Mumbai, Maharashtra',
        keyFacts: JSON.stringify([
          'She calls every evening at 6 PM',
          'She lives in Mumbai',
          'She is a doctor',
          'She has two children — your grandchildren Aarav and Diya',
        ]),
      },
      {
        patientId: patient.id,
        name: 'Arjun Sharma',
        nickname: 'Arjun',
        relationshipLabel: 'Grandson',
        phone: '+91-9765432100',
        address: 'Mumbai, Maharashtra',
        keyFacts: JSON.stringify([
          'He is 12 years old',
          'He loves cricket',
          'He visits every Sunday',
          "He is Priya's son",
        ]),
      },
      {
        patientId: patient.id,
        name: 'Diya Sharma',
        nickname: 'Diya',
        relationshipLabel: 'Granddaughter',
        address: 'Mumbai, Maharashtra',
        keyFacts: JSON.stringify([
          'She is 9 years old',
          'She loves painting',
          'She visits every Sunday with Arjun',
          "She is Priya's daughter",
        ]),
      },
      {
        patientId: patient.id,
        name: 'Dr. Mehta',
        nickname: 'Doctor Mehta',
        relationshipLabel: 'Doctor',
        phone: '+91-9811223344',
        address: 'City Hospital, Delhi',
        keyFacts: JSON.stringify([
          'He is your neurologist',
          'Appointment every first Monday of the month',
          'His clinic is at City Hospital',
        ]),
      },
      {
        patientId: patient.id,
        name: 'Suresh Kumar',
        nickname: 'Suresh',
        relationshipLabel: 'Son',
        phone: '+91-9988776655',
        address: 'Delhi, India',
        keyFacts: JSON.stringify([
          'He lives nearby in Delhi',
          'He works as an engineer',
          'He visits on weekends sometimes',
        ]),
      },
    ],
  })

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        patientId: patient.id,
        title: 'Take Blood Pressure Medicine',
        description: 'One white tablet with a glass of water',
        scheduledTime: '08:00',
        recurrence: 'daily',
        category: 'medicine',
        difficulty: 'easy',
      },
      {
        patientId: patient.id,
        title: 'Morning Walk',
        description: '20 minutes walk in the park',
        scheduledTime: '07:00',
        recurrence: 'daily',
        category: 'exercise',
        difficulty: 'easy',
      },
      {
        patientId: patient.id,
        title: 'Lunch',
        description: 'Have your lunch — dal and rice is ready',
        scheduledTime: '13:00',
        recurrence: 'daily',
        category: 'meal',
        difficulty: 'easy',
      },
      {
        patientId: patient.id,
        title: 'Priya Calls at 6 PM',
        description: 'Your daughter Priya calls every evening',
        scheduledTime: '18:00',
        recurrence: 'daily',
        category: 'family',
        difficulty: 'easy',
      },
      {
        patientId: patient.id,
        title: 'Evening Medicine',
        description: 'One blue tablet after dinner',
        scheduledTime: '20:00',
        recurrence: 'daily',
        category: 'medicine',
        difficulty: 'easy',
      },
    ],
  })

  // Create sample diary entries
  await prisma.diaryEntry.createMany({
    data: [
      {
        patientId: patient.id,
        rawText:
          'Arjun visited today. He helped me water the plants in the garden. We had tea together and he told me about his cricket match. He won! I felt very proud. Priya also called in the evening.',
        moodLabel: 'happy',
        peopleMentioned: JSON.stringify(['Arjun', 'Priya']),
        placesMentioned: JSON.stringify(['garden']),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        patientId: patient.id,
        rawText:
          'Took my morning medicine. Felt a bit confused in the afternoon, could not remember where I kept my glasses. Found them on the dining table later. Watched some television. Priya called and we talked for a long time.',
        moodLabel: 'confused',
        peopleMentioned: JSON.stringify(['Priya']),
        placesMentioned: JSON.stringify(['dining table']),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        patientId: patient.id,
        rawText:
          'Good morning. Had a lovely walk in the park. The weather was nice and cool. Suresh came in the afternoon and we had lunch together. He brought sweets from the market.',
        moodLabel: 'calm',
        peopleMentioned: JSON.stringify(['Suresh']),
        placesMentioned: JSON.stringify(['park', 'market']),
        createdAt: new Date(),
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('  Guardian: guardian@memory.app / guardian123')
  console.log('  Patient:  patient@memory.app  / patient123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
