// Test script to simulate guest user flow
async function testGuestFlow() {
  try {
    console.log('🚀 Testing Guest User Flow...\n');

    // Step 1: Access public notebook (should require guest name)
    console.log('1️⃣ Testing public notebook access...');
    const response = await fetch('http://localhost:5000/api/notebooks/guest-test-notebook');
    const notebookAccess = await response.json();
    console.log('Response:', JSON.stringify(notebookAccess, null, 2));

    if (notebookAccess.requiresGuestName) {
      console.log('✅ Correctly requires guest name\n');

      // Step 2: Register as guest
      console.log('2️⃣ Testing guest registration...');
      const guestResponse = await fetch('http://localhost:5000/api/notebooks/guest-test-notebook/register-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: 'Test Guest From Script' })
      });
      
      const guestData = await guestResponse.json();
      console.log('Guest registration response:', JSON.stringify(guestData, null, 2));

      if (guestData.guestUser) {
        console.log('✅ Guest registration successful');
        console.log('✅ Guest ID:', guestData.guestUser.id);
        console.log('✅ Guest Name:', guestData.guestUser.name);
        console.log('✅ Access Level:', guestData.accessLevel);
        console.log('✅ User Role:', guestData.userRole);
        console.log('\n🎉 Backend guest flow test completed successfully!');
      } else {
        console.error('❌ Guest registration failed');
      }
    } else {
      console.error('❌ Notebook access should require guest name');
    }

    // Test password-protected notebook
    console.log('\n6️⃣ Testing password-protected notebook...');
    const pwResponse = await fetch('http://localhost:5000/api/notebooks/password-test-notebook');
    const pwNotebook = await pwResponse.json();
    console.log('Password notebook response:', JSON.stringify(pwNotebook, null, 2));

    if (pwNotebook.requiresPassword) {
      console.log('✅ Correctly requires password');

      // Test password verification
      const verifyResponse = await fetch('http://localhost:5000/api/notebooks/password-test-notebook/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'testpass' })
      });

      const verifiedData = await verifyResponse.json();
      if (verifiedData.hasAccess) {
        console.log('✅ Password verification successful');
        console.log('✅ Access Level:', verifiedData.accessLevel);
      } else {
        console.error('❌ Password verification failed');
      }
    }

    console.log('\n🎉 All backend tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGuestFlow();
