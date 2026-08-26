<?php
/**
 * Vicmic E-Commerce Platform — Application Configuration
 * 
 * Loads environment variables from .env file and provides
 * a centralized configuration accessor.
 */

// Prevent direct access
if (!defined('VICMIC_ROOT')) {
    die('Direct access not permitted');
}

class AppConfig
{
    private static ?AppConfig $instance = null;
    private array $config = [];

    private function __construct()
    {
        $this->loadEnv();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Load .env file into config array
     */
    private function loadEnv(): void
    {
        $envFile = VICMIC_ROOT . '/config/.env';
        
        if (!file_exists($envFile)) {
            // Fall back to .env.example for initial setup
            $envFile = VICMIC_ROOT . '/config/.env.example';
        }

        if (!file_exists($envFile)) {
            throw new RuntimeException('No .env or .env.example file found in config/');
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            $line = trim($line);
            if (empty($line) || $line[0] === '#') {
                continue;
            }

            // Parse KEY=VALUE
            if (strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove surrounding quotes
            if (preg_match('/^"(.*)"$/', $value, $m)) {
                $value = $m[1];
            } elseif (preg_match("/^'(.*)'$/", $value, $m)) {
                $value = $m[1];
            }

            // Type casting
            if ($value === 'true') $value = true;
            elseif ($value === 'false') $value = false;
            elseif (is_numeric($value) && !str_contains($value, '.')) $value = (int) $value;
            elseif (is_numeric($value)) $value = (float) $value;

            $this->config[$key] = $value;

            // Also set as environment variable
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }

    /**
     * Get a config value
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    /**
     * Check if app is in debug mode
     */
    public function isDebug(): bool
    {
        return (bool) $this->get('APP_DEBUG', false);
    }

    /**
     * Check if app is in production
     */
    public function isProduction(): bool
    {
        return $this->get('APP_ENV', 'production') === 'production';
    }

    /**
     * Get the full app URL
     */
    public function url(string $path = ''): string
    {
        $base = rtrim($this->get('APP_URL', 'https://vicmic.id'), '/');
        return $base . '/' . ltrim($path, '/');
    }
}

/**
 * Global helper function to access config
 */
function config(string $key, mixed $default = null): mixed
{
    return AppConfig::getInstance()->get($key, $default);
}
