<?php
namespace Vicmic\Core;

/**
 * Request — HTTP request abstraction.
 * 
 * Wraps $_GET, $_POST, $_SERVER, php://input for clean access
 * with input sanitization.
 */
class Request
{
    private array $params = [];
    private ?array $jsonBody = null;
    private ?string $rawBody = null;

    public function __construct()
    {
        $this->rawBody = file_get_contents('php://input');
        
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json') && $this->rawBody) {
            $this->jsonBody = json_decode($this->rawBody, true) ?? [];
        }
    }

    /**
     * HTTP method (GET, POST, PUT, DELETE, PATCH)
     */
    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    /**
     * Request URI path (without query string)
     */
    public function path(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        
        // Remove /api prefix if present (since API routes don't include it in pattern)
        // The API router entry point handles this
        return $path;
    }

    /**
     * Set route parameters from pattern matching
     */
    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    /**
     * Get a route parameter
     */
    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    /**
     * Get all route parameters
     */
    public function params(): array
    {
        return $this->params;
    }

    /**
     * Get a query string parameter (?key=value)
     */
    public function query(string $key, mixed $default = null): mixed
    {
        return isset($_GET[$key]) ? $this->sanitize($_GET[$key]) : $default;
    }

    /**
     * Get all query parameters
     */
    public function queryAll(): array
    {
        return array_map([$this, 'sanitize'], $_GET);
    }

    /**
     * Get a JSON body field
     */
    public function input(string $key, mixed $default = null): mixed
    {
        if ($this->jsonBody !== null) {
            return $this->jsonBody[$key] ?? $default;
        }
        return isset($_POST[$key]) ? $this->sanitize($_POST[$key]) : $default;
    }

    /**
     * Get all input (JSON body or POST data)
     */
    public function all(): array
    {
        if ($this->jsonBody !== null) {
            return $this->jsonBody;
        }
        return array_map([$this, 'sanitize'], $_POST);
    }

    /**
     * Get specific fields from input
     */
    public function only(array $keys): array
    {
        $all = $this->all();
        return array_intersect_key($all, array_flip($keys));
    }

    /**
     * Get raw request body
     */
    public function rawBody(): ?string
    {
        return $this->rawBody;
    }

    /**
     * Get a header value
     */
    public function header(string $key, mixed $default = null): mixed
    {
        // HTTP headers are in $_SERVER as HTTP_X_HEADER_NAME
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
        return $_SERVER[$serverKey] ?? $default;
    }

    /**
     * Get the Authorization Bearer token
     */
    public function bearerToken(): ?string
    {
        $auth = $this->header('Authorization');
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            return substr($auth, 7);
        }
        return null;
    }

    /**
     * Get client IP address
     */
    public function ip(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] 
            ?? $_SERVER['HTTP_X_REAL_IP'] 
            ?? $_SERVER['REMOTE_ADDR'] 
            ?? '0.0.0.0';
    }

    /**
     * Get User Agent
     */
    public function userAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    /**
     * Check if request wants JSON response
     */
    public function wantsJson(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return str_contains($accept, 'application/json');
    }

    /**
     * Check if request is AJAX
     */
    public function isAjax(): bool
    {
        return ($this->header('X-Requested-With') === 'XMLHttpRequest') || $this->wantsJson();
    }

    /**
     * Get uploaded file info
     */
    public function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }

    /**
     * Sanitize input string
     */
    private function sanitize(mixed $value): mixed
    {
        if (is_string($value)) {
            return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        }
        if (is_array($value)) {
            return array_map([$this, 'sanitize'], $value);
        }
        return $value;
    }

    /**
     * Get pagination parameters
     */
    public function pagination(int $defaultPerPage = 20): array
    {
        $page = max(1, (int) $this->query('page', 1));
        $perPage = min(100, max(1, (int) $this->query('per_page', $defaultPerPage)));
        $offset = ($page - 1) * $perPage;

        return [
            'page'     => $page,
            'per_page' => $perPage,
            'offset'   => $offset,
        ];
    }
}
