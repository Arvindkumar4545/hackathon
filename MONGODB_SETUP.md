# MongoDB setup

MongoDB is optional for starting FinPilot AI, but a database connection is required if accounts and transactions need to survive server restarts.

1. Create a MongoDB database and a database user with access limited to that database.
2. Allow the server’s IP address in the database network access rules. Avoid opening access to every IP unless required by your deployment.
3. Copy the application environment template and set a connection string in `.env`:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<database-user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
   JWT_SECRET=<a-long-random-private-secret>
   ```

4. Keep `.env` private and do not commit database credentials.
5. Start the app with `npm start`. The sidebar storage status and `GET /api/public/status` indicate whether MongoDB connected.

When MongoDB is not connected, FinPilot AI starts in temporary in-memory mode so the server remains available. Accounts and transaction changes made in this mode are not persistent and are cleared when the process stops. The application does not load sample accounts or financial records.

## Data collections

- `users`: account identity, password hash and optional monthly spending limit.
- `expenses`: user-owned income and expense transactions.
