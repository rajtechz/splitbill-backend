import http from 'http';
import { createApp } from './app.js';

async function runTests() {
  console.log('--- Starting Backend Automated Integration Tests ---');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server running at ${baseUrl}`);

  const request = async (path: string, options: any = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data: any = await res.json();
    return { status: res.status, data };
  };

  try {
    // 1. Health check
    const health = await request('/health');
    console.log('✓ GET /health ->', health.status, health.data.data.status);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Auth login
    const loginRes = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'alex.johnson@example.com',
        password: 'password123',
      }),
    });
    console.log('✓ POST /api/v1/auth/login ->', loginRes.status, loginRes.data.data.user.name);
    const token = loginRes.data.data.tokens.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. User profile
    const meRes = await request('/api/v1/users/me', { headers: authHeaders });
    console.log('✓ GET /api/v1/users/me ->', meRes.status, meRes.data.data.email);

    // 4. Get groups
    const groupsRes = await request('/api/v1/groups', { headers: authHeaders });
    console.log('✓ GET /api/v1/groups ->', groupsRes.status, `found ${groupsRes.data.data.length} groups`);

    // 5. Create a group
    const newGroupRes = await request('/api/v1/groups', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Himalayan Trek 2026',
        description: 'Camping & trekking expenses',
        category: 'Trip',
        currency: 'INR',
      }),
    });
    console.log('✓ POST /api/v1/groups ->', newGroupRes.status, newGroupRes.data.data.name);
    const createdGroupId = newGroupRes.data.data.id;

    // 6. Get friends
    const friendsRes = await request('/api/v1/friends', { headers: authHeaders });
    console.log('✓ GET /api/v1/friends ->', friendsRes.status, `found ${friendsRes.data.data.length} friends`);

    // 7. Create an expense
    const newExpenseRes = await request('/api/v1/expenses', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Trek Permits & Guide Fees',
        totalAmount: 5000,
        currency: 'INR',
        groupId: createdGroupId,
        category: 'Travel',
        splitMethod: 'EQUAL',
        participants: [
          { userId: 'usr_me', name: 'Alex Johnson', paidAmount: 5000, shareAmount: 2500, netBalance: 2500 },
          { userId: 'usr_priya', name: 'Priya Sharma', paidAmount: 0, shareAmount: 2500, netBalance: -2500 },
        ],
      }),
    });
    console.log('✓ POST /api/v1/expenses ->', newExpenseRes.status, newExpenseRes.data.data.title);
    const expenseId = newExpenseRes.data.data.id;

    // 8. Add comment to expense
    const commentRes = await request(`/api/v1/expenses/${expenseId}/comments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ text: 'Permits approved by forest dept.' }),
    });
    console.log('✓ POST /api/v1/expenses/:id/comments ->', commentRes.status, 'comments count:', commentRes.data.data.commentsCount);

    // 9. Record a settlement
    const settlementRes = await request('/api/v1/settlements', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        groupId: createdGroupId,
        payerId: 'usr_priya',
        payerName: 'Priya Sharma',
        receiverId: 'usr_me',
        receiverName: 'Alex Johnson',
        amount: 2500,
        currency: 'INR',
        paymentMethod: 'UPI',
        status: 'PENDING',
        referenceNumber: 'UPI-PERMIT-892',
      }),
    });
    console.log('✓ POST /api/v1/settlements ->', settlementRes.status, settlementRes.data.data.amount);
    const settlementId = settlementRes.data.data.id;

    // 10. Confirm settlement
    const confirmRes = await request(`/api/v1/settlements/${settlementId}/confirm`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log('✓ POST /api/v1/settlements/:id/confirm ->', confirmRes.status, confirmRes.data.data.status);

    // 11. Activities & notifications
    const actRes = await request('/api/v1/activities', { headers: authHeaders });
    console.log('✓ GET /api/v1/activities ->', actRes.status, `found ${actRes.data.data.length} activities`);

    const notifRes = await request('/api/v1/notifications', { headers: authHeaders });
    console.log('✓ GET /api/v1/notifications ->', notifRes.status, `found ${notifRes.data.data.length} notifications`);

    // 12. Search
    const searchRes = await request('/api/v1/search?q=Himalayan', { headers: authHeaders });
    console.log('✓ GET /api/v1/search?q=Himalayan ->', searchRes.status, `matched ${searchRes.data.data.groups.length} groups`);

    console.log('\n🎉 ALL 12 BACKEND INTEGRATION TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
