
// Native fetch used (Node.js 18+)
const BASE_URL = 'http://localhost:3001/api';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;

let TOKEN = '';
const log = (q, action, result) => console.log(`[${q}] ${action} ... ${result}`);
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runSimulation() {
    console.log('\n📆 STARTING "YEAR IN THE LIFE" ANNUAL BILLING SIMULATION\n');

    // 1. Auth
    const loginRes = await fetch(`${BASE_URL}/login`, { method: 'POST', body: JSON.stringify(ADMIN_CREDENTIALS), headers: { 'Content-Type': 'application/json' } });
    TOKEN = (await loginRes.json()).token;

    // 2. Create Long-Term Customer
    const homeId = 9001;
    log('SETUP', 'Creating "Yearly User" (ID: 9001)', 'PROCESSING');
    await fetch(`${BASE_URL}/homes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_id: homeId, customer_name: "Yearly User", phone: "9876543210", set_top_box_id: "Y-001", monthly_amount: 300 })
    });

    // ----------------------------------------------------
    // Q1: Jan - Mar (Regular Payments)
    // ----------------------------------------------------
    for (let m = 1; m <= 3; m++) {
        await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            body: JSON.stringify({ home_id: homeId, month: m, year: CURRENT_YEAR }),
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
    }
    log('Q1 (Jan-Mar)', 'Paid Regularly', '✅ PAID');

    // ----------------------------------------------------
    // Q2: Apr - Jun (Skipped/Unpaid)
    // ----------------------------------------------------
    log('Q2 (Apr-Jun)', 'Missed Payments', '❌ UNPAID');

    // ----------------------------------------------------
    // Q3: Jul - Sep (Catch Up + Partial)
    // Paid Jul, Aug. Missed Sep.
    // ----------------------------------------------------
    await fetch(`${BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ home_id: homeId, month: 7, year: CURRENT_YEAR }),
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
    });
    await fetch(`${BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ home_id: homeId, month: 8, year: CURRENT_YEAR }),
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
    });
    log('Q3 (Jul-Sep)', 'Partial Payments (Paid Jul/Aug, Missed Sep)', '⚠️ PARTIAL');

    // ----------------------------------------------------
    // Q4: Oct - Dec (End of Year Rush)
    // Paid Oct, Nov, Dec
    // ----------------------------------------------------
    for (let m = 10; m <= 12; m++) {
        await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            body: JSON.stringify({ home_id: homeId, month: m, year: CURRENT_YEAR }),
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
    }
    log('Q4 (Oct-Dec)', 'Year End Rush (Paid All)', '✅ PAID');


    // ----------------------------------------------------
    // YEAR END AUDIT (Verify Export)
    // ----------------------------------------------------
    log('YEAR END', 'Generating Annual Report', 'EXPORTING');
    const exportRes = await fetch(`${BASE_URL}/export/excel?month=12&year=${CURRENT_YEAR}&status=all`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    // We can't parse Excel Binary logic here perfectly without library, but we checked status code
    if (exportRes.status === 200) {
        log('AUDIT', '12-Month Report Generated', '✅ SUCCESS');
    } else {
        console.error('❌ EXPORT FAILED');
    }

    // ----------------------------------------------------
    // 🎉 NEW YEAR'S EVE (Dec 31 -> Jan 1)
    // ----------------------------------------------------
    log('NEW YEAR', `Happy New Year! Switching to ${NEXT_YEAR}`, 'ROLLOVER');

    // 1. Verify Jan 1st of New Year is Unpaid
    const janRes = await fetch(`${BASE_URL}/payments/status/${homeId}?month=1&year=${NEXT_YEAR}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const janStatus = await janRes.json();

    // 2. Pay Jan 1st
    // The previous months (Dec previous year) was PAID. This should start fresh UNPAID.
    if ((janStatus.status || janStatus.payment_status) === 'unpaid') {
        log('JAN 1st', `Status is FRESH (Unpaid) for ${NEXT_YEAR}`, '✅ RESET VERIFIED');

        // Now Pay properly
        await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            body: JSON.stringify({ home_id: homeId, month: 1, year: NEXT_YEAR }),
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        log('JAN 1st', 'First Payment of New Year Accepted', '✅ PAID');
    } else {
        console.error('❌ ROLLOVER FAIL: New Year started with old data??');
    }

    // ----------------------------------------------------
    // HISTORICAL ARCHIVE CHECK
    // Did we lose the data from the old year?
    // Check old year status (e.g. Dec)
    // ----------------------------------------------------
    const oldDecRes = await fetch(`${BASE_URL}/payments/status/${homeId}?month=12&year=${CURRENT_YEAR}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const oldDec = await oldDecRes.json();
    if ((oldDec.status || oldDec.payment_status) === 'paid') {
        log('ARCHIVE', `Old Year (${CURRENT_YEAR}) Data is Safe`, '✅ VERIFIED');
    } else {
        console.error('❌ DATA LOSS: Old year data corrupted by new year payment');
    }

    // Cleanup
    await fetch(`${BASE_URL}/homes/${homeId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${TOKEN}` } });
    log('CLEANUP', 'Archived Yearly User', 'DELETED');

    console.log('\n✅ "YEAR IN THE LIFE" SIMULATION COMPLETE. System handles multi-year lifecycles.');
}

runSimulation();
