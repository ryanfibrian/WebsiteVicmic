<?php
/**
 * Vicmic E-Commerce Platform — Database Configuration
 * 
 * Returns PDO connection settings from environment config.
 */

// Prevent direct access
if (!defined('VICMIC_ROOT')) {
    die('Direct access not permitted');
}

return [
    'host'     => config('DB_HOST', 'localhost'),
    'port'     => config('DB_PORT', 3306),
    'database' => config('DB_NAME', 'vicmicid_vicmic_db'),
    'username' => config('DB_USER', 'vicmicid_admin'),
    'password' => config('DB_PASS', 'Pasticuan#8899.'),
    'charset'  => config('DB_CHARSET', 'utf8mb4'),
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ],
];
