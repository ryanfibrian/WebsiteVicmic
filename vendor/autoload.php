<?php
/**
 * Vicmic E-Commerce Platform — PSR-4 Autoloader
 * 
 * Manual autoloader that works without Composer.
 * Maps the Vicmic\ namespace to the src/ directory.
 */

spl_autoload_register(function (string $class) {
    // Only handle Vicmic namespace
    $prefix = 'Vicmic\\';
    $baseDir = VICMIC_ROOT . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // Get the relative class name
    $relativeClass = substr($class, $len);

    // Convert namespace separators to directory separators
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});
