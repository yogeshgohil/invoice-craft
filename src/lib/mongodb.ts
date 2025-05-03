
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI environment variable is not defined.');
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
} else {
    // Basic validation of the URI format (optional but helpful)
    if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
        console.warn(`Warning: MONGODB_URI does not look like a standard MongoDB connection string: ${MONGODB_URI.substring(0, 20)}...`);
    }
    console.log('MONGODB_URI environment variable found.');
}


/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Extend the NodeJS global type to include mongoose property
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}


let cached = global.mongoose;

if (!cached) {
  console.log('Initializing MongoDB connection cache.');
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    // Check connection state before returning
    const currentState = mongoose.connection.readyState;
    if (currentState === 1) { // 1 === connected
        console.log('=> Using existing and connected MongoDB connection (state: %s)', currentState);
        return cached.conn;
    } else {
        console.warn('=> Existing connection found, but not connected (state: %s). Will attempt to reconnect.', currentState);
        // Reset cache to force reconnection attempt
        cached.conn = null;
        cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Recommended for production
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // Add other options here if needed, like dbName
      // dbName: 'invoice', // Specify your database name if not in the URI
    };

    console.log('=> Creating new MongoDB connection promise.');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
       console.log('=> MongoDB connect() promise resolved successfully!');
      return mongooseInstance;
    }).catch(error => {
        // Log the specific error
        console.error('!!! MongoDB connect() promise failed:', error.message);
        // It's helpful to see the stack trace sometimes: console.error(error);
        cached.promise = null; // Reset promise on error
        throw error; // Re-throw error to indicate connection failure upstream
    });
  } else {
     console.log('=> Waiting for existing MongoDB connection promise to resolve.');
  }

  try {
    console.log('=> Awaiting MongoDB connection promise...');
    cached.conn = await cached.promise;
     // Double check connection state after promise resolves
     const currentState = mongoose.connection.readyState;
     if (currentState !== 1) {
        console.error(`!!! MongoDB connected via promise, but state is not 'connected' (state: ${currentState}). Invalidating connection.`);
        cached.conn = null; // Invalidate connection
        cached.promise = null; // Reset promise
        throw new Error(`MongoDB connection failed post-promise resolution. State: ${currentState}`);
     }
     console.log('=> MongoDB connection promise awaited successfully. Connection state: %s', currentState);
  } catch (e: any) {
     console.error('!!! Failed to establish MongoDB connection during await:', e.message);
     // It's helpful to see the stack trace sometimes: console.error(e);
     cached.promise = null; // Reset promise if connection fails during await
     // Make sure conn is also null if we error out here
     cached.conn = null;
     throw e; // Rethrow error
  }

  // Log final state before returning
  console.log('=> Returning MongoDB connection. State: %s', mongoose.connection.readyState);
  return cached.conn;
}

// --- Event Listeners ---
// Clear listeners before attaching new ones to prevent duplicates during hot reloads
mongoose.connection.removeAllListeners('connected');
mongoose.connection.removeAllListeners('error');
mongoose.connection.removeAllListeners('disconnected');
mongoose.connection.removeAllListeners('reconnected');
mongoose.connection.removeAllListeners('close');

mongoose.connection.on('connected', () => {
  console.log('[Mongoose Event] Connected to DB. State:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
  console.error('[Mongoose Event] Connection error:', err.message);
  // Invalidate cache on major errors
  if (cached) {
      cached.conn = null;
      cached.promise = null;
  }
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Mongoose Event] Disconnected from DB. State:', mongoose.connection.readyState);
  // Optionally invalidate the cache here if strict connection is needed
  // if (cached) {
  //     cached.conn = null;
  //     cached.promise = null;
  // }
});

mongoose.connection.on('reconnected', () => {
    console.log('[Mongoose Event] Reconnected to DB. State:', mongoose.connection.readyState);
});

mongoose.connection.on('close', () => {
    console.log('[Mongoose Event] Connection closed. State:', mongoose.connection.readyState);
     // Invalidate cache on close
    if (cached) {
        cached.conn = null;
        cached.promise = null;
    }
});


export default connectDB;
