<?php
/**
 * Run database migrations
 */
if (!isset($_GET['key']) || $_GET['key'] !== 'vicmic123') {
    die("Unauthorized. Please provide the correct key.");
}

// Auto-detect deployment structure
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    define('VICMIC_ROOT', dirname(__DIR__));
} else {
    define('VICMIC_ROOT', dirname(__DIR__) . '/vicmic_core');
}

require_once __DIR__ . '/../src/Core/Database.php';

use Vicmic\Core\Database;

try {
    $db = Database::getInstance();
    $sqlFile = __DIR__ . '/../database/migration_phase3.sql';
    
    if (!file_exists($sqlFile)) {
        die("Migration file not found: " . $sqlFile);
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Disable FK checks temporarily for safe migration
    $db->query("SET FOREIGN_KEY_CHECKS = 0;");
    
    // Execute raw SQL statements (since PDO doesn't support multiple statements natively in execute, we might need to split or use emulation)
    // Actually PDO with emulation supports multiple statements.
    $db->query($sql);
    
    $db->query("SET FOREIGN_KEY_CHECKS = 1;");
    
    echo "<h2>Migration Phase 3 completed successfully!</h2>";
    echo "<p>Added condition, dimensions, insurance to products.</p>";
    echo "<p>Created customers and customer_addresses tables.</p>";
    echo "<a href='/admin/'>Back to Admin</a>";

} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage());
}
