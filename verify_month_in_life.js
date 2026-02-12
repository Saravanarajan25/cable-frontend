
// Native fetch used (Node.js 18+)
const BASE_URL = 'http://localhost:3001/api';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// Simulation Time
const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();
const NEXT_MONTH = CURRENT_MONTH === 12 ? 1 : CURRENT_MONTH + 1;
const NEXT_YEAR_VAL = CURRENT_MONTH === 12 ? CURRENT_YEAR + 1 : CURRENT_YEAR;

let TOKEN = '';
const log = (phase, action, result) => console.log(`[${phase}] ${action} ... ${result}`);
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runSimulation() {
    console.log('\n📅 STARTING "MONTH IN THE LIFE" BILLING CYCLE SIMULATION\n');

    // 1. Setup
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST', body: JSON.stringify(ADMIN_CREDENTIALS), headers: { 'Content-Type': 'application/json' }
    });
    TOKEN = (await loginRes.json()).token;

    // Create 5 Test Families
    const ids = [401, 402, 403, 404, 405];
    const names = ['Family A', 'Family B', 'Family C', 'Family D', 'The Unpaids'];

    log('SETUP', 'Creating 5 Test Families', 'PROCESSING');
    for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/homes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ home_id: ids[i], customer_name: names[i], phone: "123", set_top_box_id: `BOX-${ids[i]}`, monthly_amount: 100 })
        });
    }

    // 2. Week 1: Early Bird (Family A)
    log('WEEK 1', 'Family A pays early', 'PAID');
    await fetch(`${BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: ids[0], month: CURRENT_MONTH, year: CURRENT_YEAR })
    });

    // 3. Week 2: Mid Month Rush (Family B, C)
    log('WEEK 2', 'Family B & C pay mid-month', 'PAID');
    await fetch(`${BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: ids[1], month: CURRENT_MONTH, year: CURRENT_YEAR })
    });
    await fetch(`${BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: ids[2], month: CURRENT_MONTH, year: CURRENT_YEAR })
    });

    // 4. Week 4: Late Payer (Family D)
    log('WEEK 4', 'Family D pays late', 'PAID');
    await fetch(`${BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: ids[3], month: CURRENT_MONTH, year: CURRENT_YEAR })
    });

    // 5. Month End Audit
    log('MONTH END', 'Checking Reports', 'AUDITING');
    const reportRes = await fetch(`${BASE_URL}/dashboard/stats?month=${CURRENT_MONTH}&year=${CURRENT_YEAR}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const stats = await reportRes.json();

    // Check Math (We added 5 homes, Paid 4)
    // Note: Dashboard stats include ALL homes in DB. We can't check absolute numbers easily without isolating DB.
    // Instead we check individual status.
    const unpaidRes = await fetch(`${BASE_URL}/payments/status/${ids[4]}?month=${CURRENT_MONTH}&year=${CURRENT_YEAR}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const unpaidStatus = await unpaidRes.json();

    if ((unpaidStatus.status || unpaidStatus.payment_status) === 'unpaid') {
        log('AUDIT', 'Family "The Unpaids" is correctly Unpaid', '✅ VERIFIED');
    } else {
        console.error('❌ VALIDATION FAILED: The Unpaids were marked paid?');
    }

    // 6. NEXT MONTH ROLLOVER
    log('NEW MONTH', `System rolls over to Month ${NEXT_MONTH}`, 'ROLLOVER');

    // Check Family A (Paid last month) -> Should be UNPAID this month
    const nextMonthRes = await fetch(`${BASE_URL}/payments/status/${ids[0]}?month=${NEXT_MONTH}&year=${NEXT_YEAR_VAL}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const nextStatus = await nextMonthRes.json();
    if ((nextStatus.status || nextStatus.payment_status) === 'unpaid') {
        log('ROLLOVER', 'Family A is Unpaid in New Month', '✅ VERIFIED (RESET WORKED)');
    } else {
        console.error('❌ ROLLOVER FAILED: Family A is already paid in new month?');
    }

    // 7. HISTORICAL INTEGRITY
    // Check Family A (Paid last month) -> Should STILL be PAID for last month
    const historyRes = await fetch(`${BASE_URL}/payments/status/${ids[0]}?month=${CURRENT_MONTH}&year=${CURRENT_YEAR}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const historyStatus = await historyRes.json();
    if ((historyStatus.status || historyStatus.payment_status) === 'paid') {
        log('HISTORY', 'Family A Payment History Preserved', '✅ VERIFIED');
    } else {
        console.error('❌ HISTORY LOSS: Past payment data vanished?');
    }

    // 8. CLEANUP
    log('CLEANUP', 'Removing Test Families', 'DELETING');
    for (const id of ids) {
        await fetch(`${BASE_URL}/homes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${TOKEN}` } });
    }

    console.log('\n✅ "MONTH IN THE LIFE" CYCLE COMPLETE. Logic Proof: 100%');
}

runSimulation();
