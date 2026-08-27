<?php
/**
 * Vicmic Diagnostic & Admin Setup Tool
 * Akses halaman ini SEKALI untuk setup admin, lalu hapus file ini.
 */

// Auto-detect deployment structure (cPanel vs Local)
if (file_exists(dirname(__DIR__) . '/vendor/autoload.php')) {
    define('VICMIC_ROOT', dirname(__DIR__));
} else {
    define('VICMIC_ROOT', dirname(__DIR__, 2) . '/vicmic_core');
}

echo "<h2>Vicmic Diagnostik</h2>";
echo "<pre>";

// 1. Check VICMIC_ROOT
echo "1. VICMIC_ROOT: " . VICMIC_ROOT . "\n";
echo "   Exists: " . (is_dir(VICMIC_ROOT) ? "✅ Ya" : "❌ Tidak") . "\n\n";

// 2. Check autoloader
$autoloadPath = VICMIC_ROOT . '/vendor/autoload.php';
echo "2. Autoloader: " . $autoloadPath . "\n";
echo "   Exists: " . (file_exists($autoloadPath) ? "✅ Ya" : "❌ Tidak") . "\n\n";

// 3. Check config
$configPath = VICMIC_ROOT . '/config/app.php';
echo "3. Config: " . $configPath . "\n";
echo "   Exists: " . (file_exists($configPath) ? "✅ Ya" : "❌ Tidak") . "\n\n";

if (!file_exists($autoloadPath) || !file_exists($configPath)) {
    echo "❌ GAGAL: File inti tidak ditemukan. Periksa deployment.\n";
    echo "</pre>";
    exit;
}

require_once $autoloadPath;
require_once $configPath;

// 4. Test database connection
echo "4. Database Connection...\n";
try {
    $db = \Vicmic\Core\Database::getInstance();
    echo "   ✅ Koneksi database berhasil!\n\n";
} catch (\Throwable $e) {
    echo "   ❌ GAGAL: " . $e->getMessage() . "\n";
    echo "</pre>";
    exit;
}

// 5. Check admin_users table
echo "5. Cek tabel admin_users...\n";
try {
    $users = $db->fetchAll("SELECT id, username, email, full_name, role, is_active FROM admin_users");
    echo "   Jumlah admin: " . count($users) . "\n";
    foreach ($users as $u) {
        echo "   - ID:{$u['id']} | {$u['username']} | {$u['email']} | {$u['full_name']} | role:{$u['role']} | active:{$u['is_active']}\n";
    }
    echo "\n";
} catch (\Throwable $e) {
    echo "   ❌ Tabel belum ada atau error: " . $e->getMessage() . "\n\n";
}

// 6. Create/Reset admin user
echo "6. Membuat/reset akun admin...\n";
try {
    // Hapus admin lama jika ada
    $db->execute("DELETE FROM admin_users WHERE username = 'admin'");
    
    // Buat password hash yang benar untuk 'password123'
    $hash = password_hash('password123', PASSWORD_BCRYPT, ['cost' => 10]);
    
    $db->insert('admin_users', [
        'username'      => 'admin',
        'email'         => 'admin@vicmic.id',
        'password_hash' => $hash,
        'full_name'     => 'Super Admin',
        'role'          => 'super_admin',
        'is_active'     => 1,
    ]);
    
    echo "   ✅ Akun admin berhasil dibuat!\n";
    echo "   Username: admin\n";
    echo "   Password: password123\n";
    echo "   Hash: $hash\n\n";
    
    // Verify it was created
    $verify = $db->fetch("SELECT id, username, password_hash FROM admin_users WHERE username = 'admin'");
    if ($verify) {
        $testVerify = password_verify('password123', $verify['password_hash']);
        echo "   Verifikasi password_verify('password123'): " . ($testVerify ? "✅ COCOK" : "❌ TIDAK COCOK") . "\n";
    }
} catch (\Throwable $e) {
    echo "   ❌ Gagal membuat admin: " . $e->getMessage() . "\n";
}

// 7. Check JWT Secret
echo "\n7. JWT Secret: " . (config('JWT_SECRET') ? "✅ Tersedia" : "❌ Kosong (Login akan gagal!)") . "\n";

echo "\n========================================\n";
echo "⚠️  HAPUS FILE INI SETELAH SELESAI!  ⚠️\n";
echo "========================================\n";
echo "</pre>";
