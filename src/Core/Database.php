<?php
namespace Vicmic\Core;

/**
 * Database — PDO-based singleton database connection.
 * 
 * Provides prepared statement execution, simple query builder,
 * and transaction support for atomic operations.
 */
class Database
{
    private static ?Database $instance = null;
    private \PDO $pdo;

    private function __construct()
    {
        $config = require VICMIC_ROOT . '/config/database.php';
        
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['database'],
            $config['charset']
        );

        $this->pdo = new \PDO($dsn, $config['username'], $config['password'], $config['options']);
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
     * Get raw PDO connection
     */
    public function getPdo(): \PDO
    {
        return $this->pdo;
    }

    /**
     * Execute a query with prepared params
     * 
     * @param string $sql SQL with ? or :named placeholders
     * @param array $params Bound parameters
     * @return \PDOStatement
     */
    public function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Fetch all rows
     */
    public function fetchAll(string $sql, array $params = []): array
    {
        return $this->query($sql, $params)->fetchAll();
    }

    /**
     * Fetch single row
     */
    public function fetch(string $sql, array $params = []): ?array
    {
        $result = $this->query($sql, $params)->fetch();
        return $result ?: null;
    }

    /**
     * Fetch single row (alias for fetch)
     */
    public function fetchRow(string $sql, array $params = []): ?array
    {
        return $this->fetch($sql, $params);
    }

    /**
     * Fetch single column value
     */
    public function fetchColumn(string $sql, array $params = []): mixed
    {
        return $this->query($sql, $params)->fetchColumn();
    }

    /**
     * Insert a row and return the last insert ID
     */
    public function insert(string $table, array $data): int
    {
        $columns = implode(', ', array_map(fn($c) => "`$c`", array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO `$table` ($columns) VALUES ($placeholders)";
        $this->query($sql, array_values($data));
        
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Update rows matching conditions
     * 
     * @return int Number of affected rows
     */
    public function update(string $table, array $data, array $where): int
    {
        $setParts = [];
        $params = [];
        
        foreach ($data as $col => $val) {
            $setParts[] = "`$col` = ?";
            $params[] = $val;
        }

        $whereParts = [];
        foreach ($where as $col => $val) {
            $whereParts[] = "`$col` = ?";
            $params[] = $val;
        }

        $sql = sprintf(
            'UPDATE `%s` SET %s WHERE %s',
            $table,
            implode(', ', $setParts),
            implode(' AND ', $whereParts)
        );

        return $this->query($sql, $params)->rowCount();
    }

    /**
     * Delete rows matching conditions
     * 
     * @return int Number of affected rows
     */
    public function delete(string $table, array $where): int
    {
        $whereParts = [];
        $params = [];

        foreach ($where as $col => $val) {
            $whereParts[] = "`$col` = ?";
            $params[] = $val;
        }

        $sql = sprintf('DELETE FROM `%s` WHERE %s', $table, implode(' AND ', $whereParts));
        return $this->query($sql, $params)->rowCount();
    }

    /**
     * Count rows matching conditions
     */
    public function count(string $table, array $where = []): int
    {
        if (empty($where)) {
            return (int) $this->fetchColumn("SELECT COUNT(*) FROM `$table`");
        }

        $whereParts = [];
        $params = [];
        foreach ($where as $col => $val) {
            $whereParts[] = "`$col` = ?";
            $params[] = $val;
        }

        return (int) $this->fetchColumn(
            sprintf('SELECT COUNT(*) FROM `%s` WHERE %s', $table, implode(' AND ', $whereParts)),
            $params
        );
    }

    /**
     * Begin a database transaction
     */
    public function beginTransaction(): bool
    {
        return $this->pdo->beginTransaction();
    }

    /**
     * Commit current transaction
     */
    public function commit(): bool
    {
        return $this->pdo->commit();
    }

    /**
     * Roll back current transaction
     */
    public function rollback(): bool
    {
        return $this->pdo->rollBack();
    }

    /**
     * Execute callback within a transaction
     * Auto-commits on success, rolls back on exception
     */
    public function transaction(callable $callback): mixed
    {
        $this->beginTransaction();
        try {
            $result = $callback($this);
            $this->commit();
            return $result;
        } catch (\Throwable $e) {
            $this->rollback();
            throw $e;
        }
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }
}
