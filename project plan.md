Phase 1: Frontend & UI Shell (Mostly Complete)
We have already drafted the core of this phase. The goal here is a fast, mobile-optimized experience for volunteers handling the bags.

Next.js & Tailwind Setup: Initialized the project for speed and clean styling.

Check-In Interface: The thumb-friendly form with a bag stepper to quickly log a mahatma's details.

Records Interface: The live, searchable list to find and return bags.

State Management: Using standard React hooks to handle the active UI tabs.

Phase 2: Database & API (Next Step)
This phase moves the app from a static UI to a functional, secure application where data is shared across all volunteers' phones.

MySQL Schema Design: Writing the CREATE TABLE query to store token IDs, names, mobile numbers, bag counts, and timestamps.

Database Connection: Setting up the mysql2 pool in Next.js to securely talk to your Hostinger database (or a cloud alternative).

Write API (Check-In): Creating the POST /api/checkin route to save new bags and generate the official Token ID.

Read/Update API (Records): Creating the GET /api/records route to fetch the live list, and a PUT /api/records route to mark a bag as 'RETURNED'.

Phase 3: Hardware & Printing Integration
This is where we connect the web app to the physical world using the RawBT bridge.

Intent Generation: Formatting the data from the Next.js API into the specific URL scheme that triggers the RawBT Android app.

Label Formatting: Designing the physical layout of the receipt and the sticky bag tags using plain text or basic ESC/POS commands (to make the Token ID print in large, bold font).

Optional Addition: Injecting a QR code or Barcode into the RawBT print string so volunteers can scan tags during check-out instead of typing numbers.

Phase 4: Admin & Reporting
Crucial for the end of the day to ensure no luggage is left behind or misplaced.

End-of-Day CSV Export: Adding a button to download the day's database records into an Excel-friendly format.

Summary Dashboard (Optional): A small counter at the top of the Records page showing "Active Bags: 45 | Returned Today: 120".

Phase 5: Deployment & Field Testing
Moving the code from your local machine to the live internet so the volunteer team can access it.

Frontend Hosting: Deploying the Next.js repository to Vercel for fast, free hosting.

Database Whitelisting: Ensuring your database accepts connections from the Vercel app.

The Dry Run: Connecting a phone to the Bluetooth printer, opening the live Vercel URL, and running 10 test bags through the entire check-in to check-out process.


------------------------

CREATE TABLE checkins (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(15) NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    bag_count INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'STORED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Set the starting Token ID to 1001 for a better look on the printed tags
ALTER TABLE checkins AUTO_INCREMENT = 1001;

-- Create an index on the status and mobile columns to make searches lightning fast
CREATE INDEX idx_status ON checkins(status);
CREATE INDEX idx_mobile ON checkins(mobile);

---------------------

TODO:
- first print bag token and then mahatma token
- on checkout scan cursor should get back on focus area to scan input again