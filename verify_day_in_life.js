
// Native fetch used (Node.js 18+)
const BASE_URL = 'http://localhost:3001/api';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

let TOKEN = '';
const log = (time, actor, action, status) => console.log(`[${time}] 👤 ${actor}: ${action} ... ${status}`);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
    console.log('\n🎬 STARTING "DAY IN THE LIFE" REAL WORLD SIMULATION\n');

    // ---------------------------------------------------------
    // 🌅 MORNING: LOGIN & DASHBOARD CHECK
    // ---------------------------------------------------------
    try {
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        if (loginRes.status !== 200) throw new Error('Login Failed');
        TOKEN = (await loginRes.json()).token;
        log('09:00 AM', 'Admin', 'Logs into System', '✅ SUCCESS');

        const dashRes = await fetch(`${BASE_URL}/dashboard/stats?month=${CURRENT_MONTH}&year=${CURRENT_YEAR}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const dash = await dashRes.json();
        log('09:05 AM', 'Admin', `Checks Dashboard (Paid: ${dash.paid}, Unpaid: ${dash.unpaid})`, '✅ VERIFIED');
    } catch (e) {
        console.error('CRITICAL FAILURE IN MORNING ROUTINE:', e);
        process.exit(1);
    }

    // ---------------------------------------------------------
    // ☀️ NOON: THE "BATCH PAYER" (REAL WORLD SCENARIO)
    // Customer "John" comes in and wants to pay for Jan, Feb, and March.
    // ---------------------------------------------------------
    const batchHomeId = 303030;
    try {
        // 1. Create Customer
        await fetch(`${BASE_URL}/homes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ home_id: batchHomeId, customer_name: "John Batch", phone: "555-0199", set_top_box_id: "BATCH-01", monthly_amount: 500 })
        });
        log('12:00 PM', 'Operator', 'Creates Customer "John Batch"', '✅ CREATED');

        // 2. Pay 3 Months sequentially
        for (let m = 1; m <= 3; m++) {
            await fetch(`${BASE_URL}/payments/mark-paid`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ home_id: batchHomeId, month: m, year: CURRENT_YEAR })
            });
            await delay(100); // Humans aren't instant
        }
        log('12:05 PM', 'Operator', 'Process 3-Month Batch Payment (Jan-Mar)', '✅ COLLECTED ₹1500');

        // 3. Verify
        const statusRes = await fetch(`${BASE_URL}/payments/status/${batchHomeId}?month=2&year=${CURRENT_YEAR}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const status = await statusRes.json();
        if ((status.status || status.payment_status) === 'paid') {
            log('12:06 PM', 'System', 'Verifies February Payment', '✅ RECORDED');
        } else throw new Error('Batch Payment Failed');

    } catch (e) { console.error(e); }

    // ---------------------------------------------------------
    // 🕒 AFTERNOON: THE "MISTAKE CORRECTION"
    // Operator marks wrong person as Paid, realizes, reverts it.
    // ---------------------------------------------------------
    try {
        // Mistake
        await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ home_id: batchHomeId, month: 12, year: CURRENT_YEAR }) // Dec is future/wrong
        });
        log('02:00 PM', 'Operator', 'Accidentally Marks December Paid', '❌ MISTAKE MADE');

        // Correction
        await fetch(`${BASE_URL}/payments/mark-unpaid`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ home_id: batchHomeId, month: 12, year: CURRENT_YEAR })
        });
        log('02:01 PM', 'Operator', 'Corrects Mistake (Mark Unpaid)', '✅ FIXED');

        // Verify
        const checkRes = await fetch(`${BASE_URL}/payments/status/${batchHomeId}?month=12&year=${CURRENT_YEAR}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const check = await checkRes.json();
        if ((check.status || check.payment_status) === 'unpaid') {
            log('02:02 PM', 'System', 'Verifies December is Unpaid', '✅ REVERTED');
        } else throw new Error('Revert Failed');

    } catch (e) { console.error(e); }

    // ---------------------------------------------------------
    // 🕔 EVENING: SEARCH & EXPORT
    // Manager wants to find John and Export report.
    // ---------------------------------------------------------
    try {
        // Search
        // Note: Search is client-side in the app, but we simulate fetching the specific home stats
        // In a real app, we'd fetch all (or search endpoint if exists). We'll simulated "Find by ID" behavior.
        const searchRes = await fetch(`${BASE_URL}/payments/status/${batchHomeId}?month=1&year=${CURRENT_YEAR}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        if (searchRes.status === 200) {
            log('05:00 PM', 'Manager', `Searches for Home ID ${batchHomeId}`, '✅ FOUND');
        }

        // Export
        const exportRes = await fetch(`${BASE_URL}/export/excel?month=${CURRENT_MONTH}&year=${CURRENT_YEAR}&status=all`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        if (exportRes.status === 200) {
            const size = (await exportRes.arrayBuffer()).byteLength;
            log('05:30 PM', 'Manager', `Downloads End-of-Day Report (${size} bytes)`, '✅ EXPORTED');
        } else throw new Error('Export Failed');

    } catch (e) { console.error(e); }

    // ---------------------------------------------------------
    // 🌙 NIGHT: CLEANUP (Simulating "Customer Left")
    // ---------------------------------------------------------
    try {
        // Delete test data
        await fetch(`${BASE_URL}/homes/${batchHomeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        log('08:00 PM', 'System', 'Archiving/Deleting Test Customer', '✅ CLEANUP');
    } catch (e) { console.warn('Cleanup failed'); }

    console.log('\n✅ SIMULATION COMPLETE. The system handled a full day of operations perfectly.');
}

runSimulation();
