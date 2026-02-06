import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3001/api';
// Admin credentials
const CREDENTIALS = { username: 'admin', password: 'admin123' };

// Helpers
const log = (msg, type = 'info') => {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    console.log(`${icons[type] || ''} ${msg}`);
};

async function checkBackend() {
    try {
        const res = await fetch(`${BASE_URL}/health`);
        return res.ok;
    } catch { return false; }
}

async function run() {
    console.log('\n🔐 STARTING FINAL QUALITY GATE VERIFICATION\n');

    if (!(await checkBackend())) {
        log('Backend not reachable on port 3001. Please run "node server.js"', 'error');
        process.exit(1);
    }

    try {
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CREDENTIALS)
        });
        const { token } = await loginRes.json();
        if (!token) throw new Error('Login failed');
        log('Authenticated as Admin', 'success');

        const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

        // 2. Setup Test Home
        const TEST_ID = 8888;
        await fetch(`${BASE_URL}/homes/${TEST_ID}`, { method: 'DELETE', headers }); // Cleanup

        await fetch(`${BASE_URL}/homes`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                home_id: TEST_ID,
                customer_name: 'Quality Check Bot',
                phone: '1234567890',
                set_top_box_id: 'QC-001',
                monthly_amount: 300
            })
        });
        log(`Test Home ${TEST_ID} Created`, 'success');

        // 3. Verify Future Months are UNPAID
        const today = new Date();
        const futureMonth = (today.getMonth() + 2) % 12 || 12; // 2 months ahead
        const futureYear = today.getFullYear() + (today.getMonth() + 2 > 11 ? 1 : 0);

        const futureRes = await fetch(`${BASE_URL}/payments/status/${TEST_ID}?month=${futureMonth}&year=${futureYear}`, { headers });
        const futureData = await futureRes.json();

        if (futureData.status === 'unpaid') {
            log(`Future Month (${futureMonth}/${futureYear}) is UNPAID`, 'success');
        } else {
            throw new Error(`CRITICAL: Future Month (${futureMonth}/${futureYear}) is ${futureData.status}!`);
        }

        // 4. Verify Advance Payment Interaction
        // Pay for Next Month (Advance)
        const nextMonth = (today.getMonth() + 1) % 12 + 1;
        const nextYear = today.getFullYear() + (today.getMonth() + 1 > 11 ? 1 : 0);

        log(`Marking Advance Payment for ${nextMonth}/${nextYear}...`, 'info');
        await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ home_id: TEST_ID, month: nextMonth, year: nextYear })
        });

        // Check if Future Month (2 months ahead) is still UNPAID
        const futureCheckRes = await fetch(`${BASE_URL}/payments/status/${TEST_ID}?month=${futureMonth}&year=${futureYear}`, { headers });
        const futureCheckData = await futureCheckRes.json();

        if (futureCheckData.status === 'unpaid') {
            log(`Future Month (${futureMonth}/${futureYear}) remains UNPAID after advance payment`, 'success');
        } else {
            throw new Error(`CRITICAL: Future Month corrupted by advance payment! Is ${futureCheckData.status}`);
        }

        // 5. Cleanup
        await fetch(`${BASE_URL}/homes/${TEST_ID}`, { method: 'DELETE', headers });
        log('Test Home Cleanup Done', 'success');

        console.log('\n======================================================');
        console.log('✅ QUALITY GATE PASSED: FUTURE MONTH RULES ENFORCED');
        console.log('======================================================');

    } catch (e) {
        console.error('\n❌ QUALITY CHECK FAILED:', e.message);
        process.exit(1);
    }
}

run();
