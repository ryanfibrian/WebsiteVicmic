<?php
namespace Vicmic\Core;

/**
 * Router — Lightweight RESTful API route dispatcher.
 * 
 * Supports:
 * - Route pattern matching with named parameters (:id, :slug)
 * - Middleware pipeline (auth, CORS, rate-limit)
 * - Route groups with shared prefixes and middleware
 * - HTTP method-based routing (GET, POST, PUT, DELETE, PATCH)
 */
class Router
{
    private array $routes = [];
    private array $middleware = [];
    private array $groupStack = [];
    private string $prefix = '';

    /**
     * Register a GET route
     */
    public function get(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('GET', $path, $handler, $middleware);
    }

    /**
     * Register a POST route
     */
    public function post(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('POST', $path, $handler, $middleware);
    }

    /**
     * Register a PUT route
     */
    public function put(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('PUT', $path, $handler, $middleware);
    }

    /**
     * Register a DELETE route
     */
    public function delete(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    /**
     * Register a PATCH route
     */
    public function patch(string $path, callable|array $handler, array $middleware = []): self
    {
        return $this->addRoute('PATCH', $path, $handler, $middleware);
    }

    /**
     * Group routes with shared prefix and/or middleware
     */
    public function group(string $prefix, callable $callback, array $middleware = []): self
    {
        $previousPrefix = $this->prefix;
        $this->prefix .= $prefix;
        
        $this->groupStack[] = $middleware;
        $callback($this);
        array_pop($this->groupStack);
        
        $this->prefix = $previousPrefix;
        return $this;
    }

    /**
     * Add a route to the registry
     */
    private function addRoute(string $method, string $path, callable|array $handler, array $middleware): self
    {
        $fullPath = $this->prefix . $path;
        
        // Merge group middleware
        $allMiddleware = $middleware;
        foreach ($this->groupStack as $groupMw) {
            $allMiddleware = array_merge($groupMw, $allMiddleware);
        }

        // Convert path to regex pattern
        $pattern = $this->pathToPattern($fullPath);

        $this->routes[] = [
            'method'     => $method,
            'path'       => $fullPath,
            'pattern'    => $pattern,
            'handler'    => $handler,
            'middleware'  => $allMiddleware,
        ];

        return $this;
    }

    /**
     * Convert route path to regex pattern
     * e.g., /products/:slug → #^/products/(?P<slug>[^/]+)$#
     */
    private function pathToPattern(string $path): string
    {
        // Replace :param with named capture group
        $pattern = preg_replace('#:([a-zA-Z_]+)#', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    /**
     * Dispatch the current request to a matching route
     */
    public function dispatch(Request $request): void
    {
        $method = $request->method();
        $path = $request->path();

        // Handle CORS preflight
        if ($method === 'OPTIONS') {
            Response::cors();
            return;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $path, $matches)) {
                // Extract named params
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $request->setParams($params);

                // Run middleware pipeline
                foreach ($route['middleware'] as $mw) {
                    if (is_string($mw) && class_exists($mw)) {
                        $mwInstance = new $mw();
                        $result = $mwInstance->handle($request);
                        if ($result === false) {
                            return; // Middleware rejected the request
                        }
                    } elseif (is_callable($mw)) {
                        $result = $mw($request);
                        if ($result === false) {
                            return;
                        }
                    }
                }

                // Execute handler
                $handler = $route['handler'];
                
                if (is_array($handler)) {
                    // [ControllerClass, 'method'] format
                    [$class, $action] = $handler;
                    $controller = new $class();
                    $controller->$action($request);
                } elseif (is_callable($handler)) {
                    $handler($request);
                }
                return;
            }
        }

        // No route matched
        Response::json(['error' => 'Not Found', 'path' => $path], 404);
    }
}
