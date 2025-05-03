
import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb'; // Adjust path relative to script location
import Invoice from '../src/models/invoice'; // Adjust path relative to script location
import type { InvoiceFormData } from '../src/components/invoice-form'; // Adjust path relative to script location

// Define the structure, omitting calculated fields
type DummyInvoiceInput = Omit<InvoiceFormData, 'totalAmount' | 'totalDue'>;

const dummyInvoices: DummyInvoiceInput[] = [
  {
    customerName: 'Alice Wonderland',
    customerEmail: 'alice@example.com',
    customerAddress: '123 Rabbit Hole Ln, Wonderland',
    invoiceNumber: 'INV-001',
    invoiceDate: '2024-07-15', // Use YYYY-MM-DD format
    dueDate: '2024-08-14',     // Use YYYY-MM-DD format
    items: [
      { description: 'Tea Party Catering', quantity: 1, price: 150.00 },
      { description: 'Croquet Set Rental', quantity: 2, price: 25.50 },
    ],
    notes: 'Payment due upon receipt.',
    paidAmount: 50.00,
    status: 'Pending',
  },
  {
    customerName: 'Bob The Builder',
    customerEmail: 'bob@build.it',
    invoiceNumber: 'INV-002',
    invoiceDate: '2024-07-18',
    dueDate: '2024-08-17',
    items: [
      { description: 'Construction Consultation', quantity: 5, price: 100.00 },
    ],
    paidAmount: 500.00,
    status: 'Completed',
  },
  {
    customerName: 'Charlie Chaplin',
    customerEmail: 'charlie@silentfilms.com',
    customerAddress: '456 Tramp Ave, Hollywood',
    invoiceNumber: 'INV-003',
    invoiceDate: '2024-07-20',
    dueDate: '2024-08-19',
    items: [
      { description: 'Comedy Routine Design', quantity: 1, price: 750.00 },
      { description: 'Bowler Hat Prop', quantity: 3, price: 30.00 },
    ],
    paidAmount: 0,
    status: 'In Process',
  },
   {
    customerName: 'Diana Prince',
    customerEmail: 'diana@themyscira.net',
    invoiceNumber: 'INV-004',
    invoiceDate: '2024-06-01',
    dueDate: '2024-06-15',
    items: [
      { description: 'Lasso of Truth Polish', quantity: 1, price: 50.00 },
    ],
    paidAmount: 50.00,
    status: 'Completed',
  },
   {
    customerName: 'Ethan Hunt',
    customerAddress: 'IMF Headquarters, Langley',
    invoiceNumber: 'INV-005',
    invoiceDate: '2024-07-25',
    dueDate: '2024-08-01',
    items: [
      { description: 'Impossible Mission Briefing', quantity: 1, price: 10000.00 },
       { description: 'Exploding Gum', quantity: 5, price: 150.00 },
    ],
    notes: 'This message will self-destruct.',
    paidAmount: 0,
    status: 'Cancelled',
  },
  {
    customerName: 'Fiona Shrek',
    customerEmail: 'fiona@swamp.ogre',
    invoiceNumber: 'INV-006',
    invoiceDate: '2024-07-28',
    dueDate: '2024-08-27',
    items: [
      { description: 'Ogre Strength Training', quantity: 10, price: 20.00 },
      { description: 'Swamp Mud Mask', quantity: 5, price: 15.00 },
    ],
    paidAmount: 100.00,
    status: 'Hold',
  },
  {
    customerName: 'Gollum',
    customerAddress: 'Misty Mountains Cave',
    invoiceNumber: 'INV-007',
    invoiceDate: '2024-08-01',
    dueDate: '2024-08-15',
    items: [
      { description: 'Precious Ring Polishing', quantity: 1, price: 5.00 },
    ],
    notes: 'My precious!',
    paidAmount: 0.00,
    status: 'Pending',
  },
  {
    customerName: 'Harry Potter',
    customerEmail: 'harry@hogwarts.wiz',
    customerAddress: 'Number 4, Privet Drive',
    invoiceNumber: 'INV-008',
    invoiceDate: '2024-08-05',
    dueDate: '2024-09-04',
    items: [
      { description: 'Broomstick Servicing', quantity: 1, price: 75.00 },
      { description: 'Spell Book Restoration', quantity: 3, price: 40.00 },
    ],
    paidAmount: 195.00,
    status: 'Completed',
  },
  {
    customerName: 'Indiana Jones',
    invoiceNumber: 'INV-009',
    invoiceDate: '2024-08-10',
    dueDate: '2024-08-24',
    items: [
      { description: 'Ark of the Covenant Location Fee', quantity: 1, price: 5000.00 },
      { description: 'Whip Repair', quantity: 1, price: 50.00 },
    ],
    notes: 'Snakes... why did it have to be snakes?',
    paidAmount: 1000.00,
    status: 'In Process',
  },
];

async function seedDatabase() {
  console.log('Attempting to connect to database...');
  try {
      await connectDB();
      console.log('Database connected successfully.');
  } catch (dbError: any) {
      console.error('!!! Failed to connect to the database:', dbError.message);
      console.error('Ensure MONGODB_URI is correctly set in your .env.local file and the database server is running and accessible.');
      // Optional: Exit if connection fails fundamentally
      // process.exit(1);
      return; // Stop execution if DB connection fails
  }


  try {
    console.log('Clearing existing invoices...');
    const deleteResult = await Invoice.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing invoices.`);

    console.log('Inserting dummy invoices...');
    // Convert date strings to Date objects for Mongoose before inserting
    const invoicesToInsert = dummyInvoices.map(invoice => ({
        ...invoice,
        // Ensure consistent date parsing, assuming YYYY-MM-DD input
        // Append time and Z to signify UTC for consistency
        invoiceDate: new Date(invoice.invoiceDate + 'T00:00:00Z'),
        dueDate: new Date(invoice.dueDate + 'T00:00:00Z'),
    }));

    const insertedInvoices = await Invoice.insertMany(invoicesToInsert);
    console.log(`Successfully inserted ${insertedInvoices.length} dummy invoices.`);

  } catch (error: any) {
    console.error('!!! Error during seeding process:', error.message);
    if (error instanceof mongoose.Error.ValidationError) {
        console.error("Validation Errors:", error.errors);
    } else if (error.code === 11000) { // Handle duplicate key errors (e.g., invoiceNumber)
        console.error("Duplicate Key Error:", error.keyValue);
    }
  } finally {
    console.log('Disconnecting from database...');
    try {
        await mongoose.disconnect();
        console.log('Database disconnected.');
    } catch (disconnectError: any) {
        console.error('Error disconnecting from database:', disconnectError.message);
    }
  }
}

// Execute the seeding function
seedDatabase();
