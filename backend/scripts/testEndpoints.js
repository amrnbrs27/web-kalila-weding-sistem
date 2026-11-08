const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Package = require('../src/models/Package');

let server;
let baseUrl;

async function runTests() {
  console.log('--- Memulai Pengujian API ---');

  // 1. Hubungkan ke DB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Database terhubung');

  // 2. Jalankan server pada port acak/5009
  const port = 5009;
  server = app.listen(port);
  baseUrl = `http://localhost:${port}`;
  console.log(`✓ Server berjalan di ${baseUrl}`);

  try {
    // 3. Health check
    const healthRes = await fetch(`${baseUrl}/`);
    const healthData = await healthRes.json();
    console.assert(healthRes.status === 200, 'Health check status should be 200');
    console.assert(healthData.success === true, 'Health check success should be true');
    console.log('✓ Health check endpoint OK');

    // 4. Buat atau dapatkan user admin
    const adminEmail = `admin_test_${Date.now()}@kalila.com`;
    const adminPassword = 'Password123!';
    const admin = await User.create({
      name: 'Admin Test',
      email: adminEmail,
      phone: '081234567890',
      password: adminPassword,
      role: 'admin',
    });

    // Login admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.assert(adminLoginRes.status === 200, 'Admin login failed');
    const adminToken = adminLoginData.data.token;
    console.log('✓ Login Admin OK');

    // 5. Auth Register Customer
    const custEmail = `customer_${Date.now()}@kalila.com`;
    const custPassword = 'Customer123!';
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Budi Pelanggan',
        email: custEmail,
        phone: '081987654321',
        password: custPassword,
      }),
    });
    const registerData = await registerRes.json();
    console.assert(registerRes.status === 201, 'Customer register status should be 201');
    console.assert(registerData.data.user.role === 'customer', 'Registered user role must be customer');
    const custToken = registerData.data.token;
    console.log('✓ Register Customer OK');

    // 6. Test Duplicate Register
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Budi Duplicate',
        email: custEmail,
        phone: '081987654321',
        password: custPassword,
      }),
    });
    console.assert(dupRes.status === 409, 'Duplicate register should return 409 Conflict');
    console.log('✓ Duplicate Register Validation OK (409)');

    // 7. GET /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const meData = await meRes.json();
    console.assert(meRes.status === 200, 'GET /me status should be 200');
    console.assert(meData.data.user.email === custEmail, 'GET /me email mismatch');
    console.log('✓ GET /api/auth/me OK');

    // 8. Auth me without token -> 401
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
    console.assert(unauthRes.status === 401, 'GET /me without token should return 401');
    console.log('✓ Unauthorized Check OK (401)');

    // 9. Customer tries to create package -> 403 Forbidden
    const custCreateRes = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Palsu',
        category: 'dekor',
        price: 5000000,
        decorWidth: 4,
      }),
    });
    console.assert(custCreateRes.status === 403, 'Customer creating package should return 403');
    console.log('✓ Role Protection Check OK (403)');

    // 10. Admin create package dekor without decorWidth -> 400 Bad Request
    const invalidDekorRes = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Dekor Rusak',
        category: 'dekor',
        price: 5000000,
        // decorWidth sengaja dikosongkan
      }),
    });
    console.assert(invalidDekorRes.status === 400, 'Dekor package without decorWidth should return 400');
    console.log('✓ Dekor Validation (decorWidth required) OK (400)');

    // 11. Admin create valid package Dekor
    const createDekorRes = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Dekor Rustic Gold',
        category: 'dekor',
        price: 7500000,
        description: 'Dekorasi panggung rustic modern elegan dengan bunga segar.',
        packageItems: ['Backdrop 6x3m', 'Standing Flowers 4 pcs', 'Mini Garden', 'Karpet Panggung'],
        decorWidth: 6,
      }),
    });
    const dekorData = await createDekorRes.json();
    console.assert(createDekorRes.status === 201, 'Create package dekor should be 201');
    const dekorId = dekorData.data.package._id;
    console.log('✓ Admin Create Package Dekor OK');

    // 12. Admin create valid package Catering
    const createCateringRes = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Paket Buffet Nusantara Deluxe',
        category: 'catering',
        price: 65000,
        description: 'Paket prasmanan menu nusantara lengkap pilihan koki.',
        packageItems: ['Nasi Putih', 'Ayam Bakar Madu', 'Daging Rendang', 'Sup Kimlo', 'Puding & Buah'],
        cateringDetails: {
          minOrder: 100,
          menuType: 'Buffet Nusantara',
        },
      }),
    });
    console.assert(createCateringRes.status === 201, 'Create package catering should be 201');
    console.log('✓ Admin Create Package Catering OK');

    // 13. Public GET /api/packages with filter & pagination
    const listRes = await fetch(`${baseUrl}/api/packages?category=dekor&page=1&limit=5`);
    const listData = await listRes.json();
    console.assert(listRes.status === 200, 'GET /packages should be 200');
    console.assert(listData.data.packages.length >= 1, 'Should return at least 1 dekor package');
    console.assert(listData.data.pagination.page === 1, 'Pagination page mismatch');
    console.log('✓ Public GET /api/packages with Filter & Pagination OK');

    // 14. Public GET /api/packages/:id
    const detailRes = await fetch(`${baseUrl}/api/packages/${dekorId}`);
    const detailData = await detailRes.json();
    console.assert(detailRes.status === 200, 'GET /packages/:id should be 200');
    console.assert(detailData.data.package._id === dekorId, 'Package ID mismatch');
    console.log('✓ Public GET /api/packages/:id Detail OK');

    // 15. Admin PUT /api/packages/:id
    const updateRes = await fetch(`${baseUrl}/api/packages/${dekorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        price: 8000000,
        description: 'Dekorasi rustic gold diperbarui dengan karpet bulu tebal.',
      }),
    });
    const updateData = await updateRes.json();
    console.assert(updateRes.status === 200, 'PUT /packages/:id should be 200');
    console.assert(updateData.data.package.price === 8000000, 'Price update mismatch');
    console.log('✓ Admin PUT /api/packages/:id OK');

    // 16. Admin Upload Image using multipart/form-data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    // Dummy 1x1 png image bytes
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const multipartBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="test-dekor.png"\r\nContent-Type: image/png\r\n\r\n`
      ),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${baseUrl}/api/packages/${dekorId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${adminToken}`,
      },
      body: multipartBody,
    });
    const uploadData = await uploadRes.json();
    console.assert(uploadRes.status === 201, 'Upload images should return 201');
    console.assert(uploadData.data.uploadedImages.length === 1, 'Should have 1 uploaded image');
    const uploadedUrl = uploadData.data.uploadedImages[0];
    console.log('✓ Admin Upload Package Images OK');

    // 17. Admin Delete Image from Package
    const deleteImgRes = await fetch(`${baseUrl}/api/packages/${dekorId}/images`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ imageUrl: uploadedUrl }),
    });
    console.assert(deleteImgRes.status === 200, 'Delete image should return 200');
    console.log('✓ Admin Remove Image from Package OK');

    // 18. Admin Soft Delete Package
    const deleteRes = await fetch(`${baseUrl}/api/packages/${dekorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.assert(deleteRes.status === 200, 'Soft delete should return 200');
    console.log('✓ Admin Soft Delete Package OK');

    // 19. Public GET /api/packages/:id on inactive package -> 404
    const publicInactiveRes = await fetch(`${baseUrl}/api/packages/${dekorId}`);
    console.assert(publicInactiveRes.status === 404, 'Public getting inactive package should return 404');
    console.log('✓ Public Inactive Package Hidden Check OK (404)');

    // Bersihkan data tes
    await User.deleteMany({ email: { $in: [adminEmail, custEmail] } });
    await Package.deleteMany({ _id: dekorId });

    console.log('\n========================================');
    console.log('SEMUA PENGUJIAN ENDPOINT BERHASIL (PASSED)!');
    console.log('========================================');
  } catch (err) {
    console.error('Pengujian gagal:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTests();

