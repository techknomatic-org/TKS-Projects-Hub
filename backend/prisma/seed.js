import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const admins = [
  'aniruddha.potdar@techknomatic.com',
  'rahul@techknomatic.com',
  'prakash@techknomatic.com',
  'aniruddha.telang@techknomatic.com',
  'dhananjay.nalawade@techknomatic.com',
  'lokesh.shukla@techknomatic.com',
  'Abhijeet.moon@techknomatic.com'
];

const employees = [
  'akash.awad@techknomatic.com',
  'bhavesh.bhadane@techknomatic.com',
  'khushi.gurave@techknomatic.com',
  'Prathamesh.jadhav@techknomatic.com',
  'prem.sagar@techknomatic.com',
  'vinod.tambe@techknomatic.com',
  'vaibhav.jagtap@techknomatic.com',
  'utkarsha.shukla@techknomatic.com',
  'sushant.naik@techknomatic.com',
  'siddhant.thombare@techknomatic.com',
  'sanjeet.sharma@techknomatic.com',
  'payal.borde@techknomatic.com',
  'pooja.khalekar@techknomatic.com',
  'mohini.mishra@techknomatic.com'
];

const bothAdminsDevs = [
  'krishna.shelar@techknomatic.com'
];

function getNameFromEmail(email) {
  const localPart = email.split('@')[0];
  const parts = localPart.split('.');
  return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

async function main() {
  console.log('Seeding approved users...');

  // De-duplicate lists
  const uniqueAdmins = Array.from(new Set(admins.map(e => e.toLowerCase().trim())));
  const uniqueEmployees = Array.from(new Set(employees.map(e => e.toLowerCase().trim())));

  // Store users in map to reference their IDs later
  const seededUsers = {};

  // Seed Admins
  for (const email of uniqueAdmins) {
    const name = getNameFromEmail(email);
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`Seeded Admin: ${name} (${email})`);
    } else {
      console.log(`Admin already exists, skipping create: ${email}`);
    }
    seededUsers[email] = user;
  }

  // Seed Employees
  for (const email of uniqueEmployees) {
    const name = getNameFromEmail(email);
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'EMPLOYEE',
          isActive: true,
        },
      });
      console.log(`Seeded Employee: ${name} (${email})`);
    } else {
      console.log(`Employee already exists, skipping create: ${email}`);
    }
    seededUsers[email] = user;
  }

  // Seed Admin & Devs (BOTH)
  const uniqueBoth = Array.from(new Set(bothAdminsDevs.map(e => e.toLowerCase().trim())));
  for (const email of uniqueBoth) {
    const name = getNameFromEmail(email);
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'BOTH',
          isActive: true,
        },
      });
      console.log(`Seeded Admin & Dev (BOTH): ${name} (${email})`);
    } else {
      console.log(`Admin & Dev (BOTH) already exists, skipping create: ${email}`);
    }
    seededUsers[email] = user;
  }

  console.log('Clearing old default database items selectively...');
  // Custom products, features, user stories, mappings, and functional requirements are kept safe.
  
  console.log('Seeding products...');
  const products = [
    { name: 'Nexora', description: 'Next-generation AI assistant for enterprise analytics.' },
    { name: 'InsightSM', description: 'Enterprise service management platform.' },
    { name: 'DataPulse IQ', description: 'Real-time data visualization and operational intelligence.' },
    { name: 'TicketIQ', description: 'Internal support desk and ticketing system.' },
    { name: 'MaintainIQ', description: 'Facility maintenance and tracking portal.' },
    { name: 'Oman Skill Portal', description: 'Skills tracking and employee development platform for Oman region.' },
    { name: 'Replica of RenderIQ', description: 'High-performance cloud rendering replication server.' }
  ];

  const dbProducts = {};
  for (const prod of products) {
    let dbProd = await prisma.product.findFirst({
      where: { name: prod.name }
    });
    if (!dbProd) {
      dbProd = await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description
        }
      });
      console.log(`Seeded Product: ${prod.name}`);
    } else {
      console.log(`Product already exists, skipping create: ${prod.name}`);
    }
    dbProducts[prod.name] = dbProd;
  }

  const productDeveloperMapping = {
    'Nexora': [
      'krishna.shelar@techknomatic.com',
      'akash.awad@techknomatic.com',
      'bhavesh.bhadane@techknomatic.com',
      'khushi.gurave@techknomatic.com',
      'Prathamesh.jadhav@techknomatic.com',
      'prem.sagar@techknomatic.com'
    ],
    'InsightSM': [
      'vinod.tambe@techknomatic.com',
      'vaibhav.jagtap@techknomatic.com',
      'utkarsha.shukla@techknomatic.com'
    ],
    'DataPulse IQ': [
      'sushant.naik@techknomatic.com',
      'siddhant.thombare@techknomatic.com'
    ],
    'TicketIQ': [
      'sanjeet.sharma@techknomatic.com',
      'payal.borde@techknomatic.com'
    ],
    'MaintainIQ': [
      'pooja.khalekar@techknomatic.com'
    ],
    'Oman Skill Portal': [
      'mohini.mishra@techknomatic.com'
    ],
    'Replica of RenderIQ': [
      'akash.awad@techknomatic.com',
      'prem.sagar@techknomatic.com'
    ]
  };

  console.log('Tagging developers to products...');
  const usersSeededForProducts = new Set();

  for (const [productName, devEmails] of Object.entries(productDeveloperMapping)) {
    const product = dbProducts[productName];
    if (!product) continue;
    for (const email of devEmails) {
      const user = seededUsers[email.toLowerCase().trim()];
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { taggedProducts: true }
        });
        if (dbUser) {
          const hasTaggedProductsAlready = dbUser.taggedProducts.length > 0;
          const isSeededInThisRun = usersSeededForProducts.has(user.id);

          if (!hasTaggedProductsAlready || isSeededInThisRun) {
            const isAlreadyConnected = dbUser.taggedProducts.some(p => p.id === product.id);
            if (!isAlreadyConnected) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  taggedProducts: {
                    connect: { id: product.id }
                  }
                }
              });
              console.log(`Tagged user ${user.name} (${email}) to product ${productName}`);
            }
            usersSeededForProducts.add(user.id);
          } else {
            console.log(`User ${user.name} (${email}) already has tagged products, skipping default tagging.`);
          }
        }
      }
    }
  }


  console.log('Skipping mock card/task seeding...');
  const nexoraId = dbProducts['Nexora'].id;

  console.log('Skipping features seeding...');
  const featuresToSeed = [];

  const dbFeatures = {};
  for (const f of featuresToSeed) {
    const owner = seededUsers[f.ownerEmail] || seededUsers[employees[0]];
    const product = dbProducts[f.productName];
    if (product) {
      const dbFeature = await prisma.feature.create({
        data: {
          productId: product.id,
          title: f.title,
          description: f.description,
          status: f.status,
          priority: f.priority,
          ownerId: owner.id,
          releaseVersion: f.releaseVersion
        }
      });
      dbFeatures[`${f.productName}:${f.title}`] = dbFeature;
      console.log(`Seeded Feature: ${f.title} for ${f.productName}`);
    }
  }

  console.log('Skipping user stories seeding...');
  const userStoriesToSeed = [];

  for (const us of userStoriesToSeed) {
    const owner = seededUsers[us.ownerEmail] || seededUsers[employees[0]];
    const feature = dbFeatures[`${us.productName}:${us.featureTitle}`];
    if (feature) {
      await prisma.userStory.create({
        data: {
          featureId: feature.id,
          title: us.title,
          description: us.description,
          priority: us.priority,
          status: us.status,
          storyPoints: us.storyPoints,
          sprint: us.sprint,
          ownerId: owner.id
        }
      });
      console.log(`Seeded User Story: ${us.title} for feature ${us.featureTitle}`);
    } else {
      console.warn(`Could not seed User Story: ${us.title} because feature ${us.featureTitle} was not found.`);
    }
  }

  console.log('Seeding functional requirements...');
  // nexoraId is already declared in main scope

  const nexoraFRs = [
    { reqId: 'FR-001', title: 'Secure User Authentication', description: 'Enable multi-factor login and Azure AD integration.' },
    { reqId: 'FR-002', title: 'Real-time Analytics Dashboard', description: 'Display live status, features, and workload breakdown graphs.' },
    { reqId: 'FR-003', title: 'Traceability Matrix Reporting', description: 'Export requirements and user story mappings to Excel/PDF.' },
    { reqId: 'FR-004', title: 'Role-Based Authorization', description: 'Restrict sensitive configuration options to administrators.' },
    { reqId: 'FR-005', title: 'Notification Engine', description: 'Dispatch real-time web socket and email alerts.' }
  ];

  const dbFRs = {};
  for (const fr of nexoraFRs) {
    let dbFR = await prisma.functionalRequirement.findUnique({
      where: {
        productId_reqId: {
          productId: nexoraId,
          reqId: fr.reqId
        }
      }
    });
    if (!dbFR) {
      dbFR = await prisma.functionalRequirement.create({
        data: {
          productId: nexoraId,
          reqId: fr.reqId,
          title: fr.title,
          description: fr.description
        }
      });
      console.log(`Seeded FR: ${fr.reqId}`);
    } else {
      console.log(`FR already exists, skipping create: ${fr.reqId}`);
    }
    dbFRs[fr.reqId] = dbFR;
  }

  console.log('Skipping requirements mapping for Nexora (features/stories removed)...');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
