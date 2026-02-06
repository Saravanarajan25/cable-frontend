
const AUTH_URL = 'http://localhost:3001/api/login';
const DASHBOARD_URL = 'http://localhost:3001/api/dashboard/stats';
const PAYMENT_URL = 'http://localhost:3001/api/payments/mark-paid';

async function verify() {
    console.log('🚀 Starting Backend Verification from Proxy...');

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const { token } = await loginRes.json();
        console.log('✅ Login successful. Token received.');

        // 2. Dashboard Stats (Scope Check)
        // Request stats for Jan 2020. Should return stats for CURRENT CURRENT MONTH (Server time)
        console.log('📊 Verifying Dashboard Scope...');
        const dashboardRes = await fetch(`${DASHBOARD_URL}?month=1&year=2020`, {
            headers: { 'Authorization': token }
        });

        const stats = await dashboardRes.json();
        console.log('   Stats Received:', JSON.stringify(stats));

        if (stats.total_pending === undefined) {
            console.error('❌ FAILED: Pending Amount (total_pending) missing!');
        } else {
            console.log(`✅ Passed: total_pending is present: ${stats.total_pending}`);
        }

        // 3. Mark Paid (Multi-Month Check)
        // Try to mark Jan 2024 as paid
        console.log('💳 Verifying Past Month Payment...');
        const paymentRes = await fetch(PAYMENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ home_id: 101, month: 1, year: 2024 })
        });

        if (paymentRes.ok) {
            const payment = await paymentRes.json();
            if (payment.status === 'paid' && payment.month === 1 && payment.year === 2024) {
                console.log('✅ Passed: Past month payment recorded successfully.');
            } else {
                console.error('❌ Failed: Payment response incorrect', payment);
            }
        } else {
            console.error(`❌ Failed: Payment API returned ${paymentRes.status}`);
        }

        // 4. Future Month Payment
        console.log('🔮 Verifying Future Month Payment...');
        const futureRes = await fetch(PAYMENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ home_id: 101, month: 1, year: 2030 })
        });

        if (futureRes.ok) {
            console.log('✅ Passed: Future month payment recorded successfully.');
        } else {
            console.error('❌ Failed: Future payment failed.');
        }

        console.log('\n🏁 Verification Complete.');

    } catch (error) {
        console.error('🚨 Verification Failed:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

verify();
