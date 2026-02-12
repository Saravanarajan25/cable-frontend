
// Native fetch used (Node.js 18+)
const BASE_URL = 'http://localhost:3001/api';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// Global State
let TOKEN = '';
let HOMES = [];

const log = (msg, type = 'INFO') => console.log(`[${type}] ${msg}`);
const fail = (msg) => { console.error(`[FAIL] ${msg}`); process.exit(1); };

async function runTests() {
    log('Starting E2E API Validation...', 'INIT');

    // 1. Authentication
    log('Testing Authentication (POST /api/login)...');
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (loginRes.status !== 200) {
        const text = await loginRes.text();
        console.log(`Login Status: ${loginRes.status}`);
        console.log(`Login Response: ${text}`);
        fail('Login failed');
    }

    const loginData = await loginRes.json();
    if (!loginData.token) fail('No token received');
    TOKEN = loginData.token;
    log('Authentication Successful. Token received.', 'PASS');

    // 2. Fetch Homes via Payments Endpoint (Current Month)
    log('Testing Fetch Homes via Payments Endpoint...');
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Route: /api/payments?month=X&year=Y
    const homesRes = await fetch(`${BASE_URL}/payments?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (homesRes.status !== 200) {
        const txt = await homesRes.text();
        fail(`Fetch payments failed: ${homesRes.status} ${txt}`);
    }

    HOMES = await homesRes.json();
    log(`Fetched ${HOMES.length} homes/payments.`, 'PASS');

    if (HOMES.length === 0) {
        log('Warning: No homes found. Seeding might be needed.', 'WARN');
        // We can't proceed deep testing without homes
        // But we can verify stats are 0
    }

    // 3. Test Dashboard Stats
    log('Testing Dashboard Stats...');

    const statsRes = await fetch(`${BASE_URL}/dashboard/stats?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (statsRes.status !== 200) fail('Stats fetch failed');
    const stats = await statsRes.json();

    // Verify Logic
    // API returns { total, paid, unpaid, total_collected, total_pending }
    if (stats.total !== HOMES.length) fail(`Stats Total (${stats.total}) != Homes Count (${HOMES.length})`);

    // Filter manually to verify
    const paidCount = HOMES.filter(h => h.payment_status === 'paid').length;
    const unpaidCount = HOMES.filter(h => h.payment_status === 'unpaid').length;

    if (stats.paid !== paidCount) fail(`Stats Paid (${stats.paid}) != Calculated (${paidCount})`);
    if (stats.unpaid !== unpaidCount) fail(`Stats Unpaid (${stats.unpaid}) != Calculated (${unpaidCount})`);

    log('Dashboard Stats Logic Verified.', 'PASS');

    // 4. Test Payments Logic
    if (HOMES.length > 0) {
        // Pick a home to toggle payment
        const testHome = HOMES[0]; // Pick first home
        const testHomeId = testHome.home_id;

        log(`Testing Payment Toggle for Home ID: ${testHomeId}...`);

        // Ensure it's unpaid first (PUT /api/payments/mark-unpaid)
        await fetch(`${BASE_URL}/payments/mark-unpaid`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ home_id: testHomeId, month, year })
        });

        // Mark Paid (POST /api/payments/mark-paid)
        const payRes = await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ home_id: testHomeId, month, year })
        });

        if (payRes.status !== 200) {
            const txt = await payRes.text();
            fail(`Mark Paid Failed: ${payRes.status} ${txt}`);
        }

        // Verify Status Update via Fetch
        const verifyRes = await fetch(`${BASE_URL}/payments?month=${month}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const updatedHomes = await verifyRes.json();
        const updatedHome = updatedHomes.find(h => h.home_id === testHomeId);

        // Check property name: is it 'payment_status' or 'status'?
        // Based on usePayments hook types (Step 17), it expects 'payment_status'.
        // Backend /payments route likely returns joined data.
        // We will check both or print keys if failed.

        const status = updatedHome.payment_status || updatedHome.status;
        if (status !== 'paid') {
            console.log('Updated Home Record:', updatedHome);
            fail(`Payment Status is '${status}', expected 'paid'`);
        }
        log('Payment Status Update Verified.', 'PASS');

        // 5. Verify Stats Update matches
        log('Verifying Stats Update after Payment...');
        const newStatsRes = await fetch(`${BASE_URL}/dashboard/stats?month=${month}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const newStats = await newStatsRes.json();

        // Recalculate expectation
        const newPaidCount = updatedHomes.filter(h => (h.payment_status || h.status) === 'paid').length;
        if (newStats.paid !== newPaidCount) fail(`Stats Paid Count Mismatch after update. Stats: ${newStats.paid}, Actual: ${newPaidCount}`);
        log('Stats Update Verified.', 'PASS');
    } else {
        log('Skipping Payment Toggle (No homes available)', 'WARN');
    }

    // 6. Excel Export
    log('Testing Excel Export...');
    const exportRes = await fetch(`${BASE_URL}/export/excel?month=${month}&year=${year}&status=all`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (exportRes.status !== 200) fail('Export failed');
    const buffer = await exportRes.arrayBuffer();
    if (buffer.byteLength < 100) fail('Export file too small (likely empty or error)');
    log('Excel Export Download Verified.', 'PASS');

    log('\nALL API TESTS PASSED SUCCESSFULLY! ✅', 'SUCCESS');
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
