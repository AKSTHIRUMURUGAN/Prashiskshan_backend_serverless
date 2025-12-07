import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@prashiskshan.edu';
const ADMIN_PASSWORD = 'SecurePass123!';

async function verifyAllCompanies() {
    console.log('🚀 Starting company verification process...');
    console.log(`Target API: ${API_URL}`);

    try {
        // 1. Login as Admin
        console.log(`\n🔑 Logging in as ${ADMIN_EMAIL}...`);
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        if (!loginRes.ok) {
            const err = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${err}`);
        }

        const loginData = await loginRes.json();
        // Handle wrapped response structure
        const data = loginData.data || loginData;
        const token = data.idToken || data.token || loginData.token;

        if (!token) {
            console.error('Login response:', JSON.stringify(loginData, null, 2));
            throw new Error('No token received in login response');
        }

        console.log('✅ Login successful!');

        // 2. Get Pending Companies
        console.log('\n🔍 Fetching pending companies...');
        const pendingRes = await fetch(`${API_URL}/api/admins/companies/pending`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!pendingRes.ok) {
            const err = await pendingRes.text();
            throw new Error(`Failed to fetch pending companies: ${pendingRes.status} ${err}`);
        }

        const pendingData = await pendingRes.json();
        const companies = pendingData.data || pendingData;

        if (!Array.isArray(companies) || companies.length === 0) {
            console.log('🎉 No pending companies found. All clear!');
            return;
        }

        console.log(`📋 Found ${companies.length} pending companies.`);

        // 3. Verify Each Company
        let successCount = 0;
        let failCount = 0;

        for (const company of companies) {
            const companyId = company.companyId;
            const name = company.companyName;

            console.log(`\nProcessing: ${name} (${companyId})...`);

            try {
                const verifyRes = await fetch(`${API_URL}/api/admins/companies/${companyId}/verify`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ comments: 'Auto-verified by script' }),
                });

                if (!verifyRes.ok) {
                    const err = await verifyRes.text();
                    throw new Error(`Verification failed: ${verifyRes.status} ${err}`);
                }

                console.log(`✅ Verified: ${name}`);
                successCount++;
            } catch (err) {
                console.error(`❌ Failed to verify ${name}: ${err.message}`);
                failCount++;
            }
        }

        console.log('\n==========================================');
        console.log('SUMMARY');
        console.log('==========================================');
        console.log(`Total Processed: ${companies.length}`);
        console.log(`Successful:      ${successCount}`);
        console.log(`Failed:          ${failCount}`);
        console.log('==========================================');

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        process.exit(1);
    }
}

verifyAllCompanies();
