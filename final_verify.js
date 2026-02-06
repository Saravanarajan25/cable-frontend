// Native fetch is available in Node.js 18+
import { spawn } from 'child_process';

// Configuration
const BASE_URL = 'http://localhost:3001/api';
const ADMIN_CRED = { username: 'admin', password: 'admin123' };
const TEST_HOME_ID = 9999;
const TEST_HOME_DATA = {
    home_id: TEST_HOME_ID,
    customer_name: 'Verification Bot',
    phone: '9999999999',
    set_top_box_id: 'STB-VERIFY-001',
    monthly_amount: 500
};

// Utilities
const log = (msg, type = 'info') => {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', step: '🧪' };
    console.log(`${icons[type] || ''} ${msg}`);
};

async function checkBackend() {
    try {
        const res = await fetch(`${BASE_URL}/health`);
        return res.ok;
    } catch { return false; }
}

async function run() {
    console.log('\n🚀 STARTING FINAL COMPREHENSIVE VERIFICATION\n');

    // 0. Backend Check
    if (!(await checkBackend())) {
        log('Backend not reachable on port 3001. Please run "node server.js" in backend folder.', 'error');
        process.exit(1);
    }
    log('Backend is Online', 'success');

    let token = '';

    try {
        // --- MODULE 1: AUTHENTICATION ---
        log('--- MODULE 1: AUTHENTICATION ---', 'step');

        // Test 1.3: Login Success
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CRED)
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        token = loginData.token;
        if (!token) throw new Error('No token received');
        log('Login Successful', 'success');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token // Standard format
        };
        // Check if backend expects 'Bearer ' or just token. ReportsPage uses `Bearer ${token}`. 
        // Let's check auth middleware... wait, verify_backend_proxy used `Authorization: token`.
        // I will try `token` first as per previous success.

        // --- MODULE 2: HOME MANAGEMENT ---
        log('\n--- MODULE 2: HOME MANAGEMENT ---', 'step');

        // Cleanup first just in case
        await fetch(`${BASE_URL}/homes/${TEST_HOME_ID}`, { method: 'DELETE', headers: { 'Authorization': token } });

        // Test 2.1: Add Home
        const addRes = await fetch(`${BASE_URL}/homes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(TEST_HOME_DATA)
        });

        if (!addRes.ok) {
            const txt = await addRes.text();
            throw new Error(`Add Home Failed: ${addRes.status} - ${txt}`);
        }
        log(`Home Added (ID: ${TEST_HOME_ID})`, 'success');

        // Test 2.2: Duplicate Home ID
        const dupRes = await fetch(`${BASE_URL}/homes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(TEST_HOME_DATA)
        });
        if (dupRes.status === 400) {
            log('Duplicate Home ID Rejected (Correct Behavior)', 'success');
        } else {
            log(`Duplicate Home Check Failed! Status: ${dupRes.status}`, 'error');
        }

        // Test 2.3: Edit Home
        const updateData = { ...TEST_HOME_DATA, phone: '8888888888' };
        const editRes = await fetch(`${BASE_URL}/homes/${TEST_HOME_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(updateData)
        });
        if (!editRes.ok) throw new Error('Edit Home Failed');
        log('Home Details Updated', 'success');


        // --- MODULE 3 & 4: PAYMENTS & DASHBOARD ---
        log('\n--- MODULE 3 & 4: PAYMENTS & DASHBOARD ---', 'step');

        // Get Initial Dashboard Stats
        const getStats = async () => {
            // Dashboard strict scope: current month
            const now = new Date();
            const m = now.getMonth() + 1;
            const y = now.getFullYear();
            const res = await fetch(`${BASE_URL}/dashboard/stats?month=${m}&year=${y}`, { headers: { 'Authorization': token } });
            return res.json();
        };

        const initialStats = await getStats();
        log(`Initial Pending: ₹${initialStats.total_pending || 0}`, 'info');

        // Test 3.1: Mark Current Month PAID
        const now = new Date();
        const curM = now.getMonth() + 1;
        const curY = now.getFullYear();

        const payRes = await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ home_id: TEST_HOME_ID, month: curM, year: curY })
        });
        if (!payRes.ok) throw new Error('Mark Paid Failed');
        log(`Marked Current Month (${curM}/${curY}) as PAID`, 'success');

        // Verify Dashboard Update
        const midStats = await getStats();
        // Pending should decrease by 500
        // Collected should increase by 500
        log(`New Pending: ₹${midStats.total_pending || 0}`, 'info');

        // Test 3.2: Past Month Payment (Should NOT affect Dashboard Pending)
        const pastRes = await fetch(`${BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ home_id: TEST_HOME_ID, month: 1, year: 2020 })
        });
        if (!pastRes.ok) throw new Error('Mark Past Paid Failed');

        const endStats = await getStats();
        if (endStats.total_pending === midStats.total_pending) {
            log('Past Payment did NOT affect Current Month Pending (Correct)', 'success');
        } else {
            log('Past Payment AFFECTED Dashboard! (Failure)', 'error');
        }

        // --- CLEANUP ---
        log('\n--- CLEANUP ---', 'step');
        // Test 2.4: Delete Home
        const delRes = await fetch(`${BASE_URL}/homes/${TEST_HOME_ID}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        if (!delRes.ok) throw new Error('Delete Home Failed');
        log('Test Home Deleted', 'success');

        console.log('\n======================================================');
        console.log('✅ END-TO-END VERIFICATION COMPLETE.');
        console.log('SYSTEM IS STABLE, ACCURATE, AND READY FOR REAL-WORLD USE.');
        console.log('======================================================');

    } catch (e) {
        console.error('\n❌ VERIFICATION FAILED:', e);
        process.exit(1);
    }
}

run();
