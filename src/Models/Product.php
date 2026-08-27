<?php
namespace Vicmic\Models;

use Vicmic\Core\Database;

/**
 * Product Model — Handles product CRUD and queries.
 */
class Product
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get paginated products with optional filters
     */
    public function getPaginated(array $filters = [], int $offset = 0, int $limit = 20): array
    {
        $where = ['p.is_published = 1'];
        $params = [];

        if (!empty($filters['brand'])) {
            $where[] = 'p.brand = ?';
            $params[] = $filters['brand'];
        }

        if (!empty($filters['category_id'])) {
            $where[] = 'p.category_id = ?';
            $params[] = $filters['category_id'];
        }

        if (!empty($filters['category_slug'])) {
            $where[] = 'c.slug = ?';
            $params[] = $filters['category_slug'];
        }

        if (!empty($filters['min_price'])) {
            $where[] = 'COALESCE(p.sale_price, p.base_price) >= ?';
            $params[] = $filters['min_price'];
        }

        if (!empty($filters['max_price'])) {
            $where[] = 'COALESCE(p.sale_price, p.base_price) <= ?';
            $params[] = $filters['max_price'];
        }

        if (!empty($filters['search'])) {
            $where[] = '(p.name LIKE ? OR p.brand LIKE ? OR p.sku LIKE ? OR p.processor LIKE ?)';
            $search = '%' . $filters['search'] . '%';
            $params = array_merge($params, [$search, $search, $search, $search]);
        }

        // Include all published products (even admin search might override)
        if (!empty($filters['include_unpublished'])) {
            $where = array_filter($where, fn($w) => $w !== 'p.is_published = 1');
        }

        $whereClause = implode(' AND ', $where);

        // Sort
        $orderBy = match($filters['sort'] ?? 'newest') {
            'price_low'  => 'COALESCE(p.sale_price, p.base_price) ASC',
            'price_high' => 'COALESCE(p.sale_price, p.base_price) DESC',
            'name'       => 'p.name ASC',
            'popular'    => 'p.view_count DESC',
            default      => 'p.created_at DESC',
        };

        // Count total
        $countSql = "SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE $whereClause";
        $total = (int) $this->db->fetchColumn($countSql, $params);

        // Fetch items
        $sql = "SELECT p.*, c.name as category_name, c.slug as category_slug,
                    COALESCE(p.sale_price, p.base_price) as effective_price,
                    (SELECT COALESCE(SUM(ps.quantity - ps.reserved_quantity), 0) FROM product_stocks ps WHERE ps.product_id = p.id) as total_stock
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE $whereClause
                ORDER BY $orderBy
                LIMIT ? OFFSET ?";

        $params[] = $limit;
        $params[] = $offset;

        $items = $this->db->fetchAll($sql, $params);

        // Decode JSON fields
        foreach ($items as &$item) {
            $item['images'] = json_decode($item['images'] ?? '[]', true);
            $item['specifications'] = json_decode($item['specifications'] ?? '{}', true);
        }

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Get product by slug with variants and stock
     */
    public function getBySlug(string $slug): ?array
    {
        $product = $this->db->fetch(
            "SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.slug = ? AND p.is_published = 1",
            [$slug]
        );

        if (!$product) return null;

        // Decode JSON
        $product['images'] = json_decode($product['images'] ?? '[]', true);
        $product['specifications'] = json_decode($product['specifications'] ?? '{}', true);

        // Get variants
        $product['variants'] = $this->db->fetchAll(
            "SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1",
            [$product['id']]
        );

        // Get total stock
        $product['total_stock'] = (int) $this->db->fetchColumn(
            "SELECT COALESCE(SUM(quantity - reserved_quantity), 0) FROM product_stocks WHERE product_id = ?",
            [$product['id']]
        );

        // Get stock per warehouse
        $product['warehouse_stock'] = $this->db->fetchAll(
            "SELECT ps.*, w.name as warehouse_name, w.city_name
             FROM product_stocks ps
             JOIN warehouses w ON ps.warehouse_id = w.id
             WHERE ps.product_id = ? AND w.is_active = 1",
            [$product['id']]
        );

        // Increment view count
        $this->db->query("UPDATE products SET view_count = view_count + 1 WHERE id = ?", [$product['id']]);

        return $product;
    }

    /**
     * Get product by ID (admin)
     */
    public function getById(int $id): ?array
    {
        $product = $this->db->fetch("SELECT * FROM products WHERE id = ?", [$id]);
        if (!$product) return null;

        $product['images'] = json_decode($product['images'] ?? '[]', true);
        $product['specifications'] = json_decode($product['specifications'] ?? '{}', true);
        $product['variants'] = $this->db->fetchAll(
            "SELECT * FROM product_variants WHERE product_id = ?", [$id]
        );

        return $product;
    }

    /**
     * Get featured products with optional smart recommendations
     */
    public function getFeatured(int $limit = 8, ?string $preferredCategory = null): array
    {
        $items = [];
        
        // Try to fetch half of the limit from preferred category first
        if ($preferredCategory) {
            $prefLimit = (int) ceil($limit / 2);
            $items = $this->db->fetchAll(
                "SELECT p.*, c.name as category_name,
                    COALESCE(p.sale_price, p.base_price) as effective_price,
                    (SELECT COALESCE(SUM(ps.quantity - ps.reserved_quantity), 0) FROM product_stocks ps WHERE ps.product_id = p.id) as total_stock
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE p.is_published = 1 AND p.is_featured = 1 AND c.slug = ?
                 ORDER BY p.created_at DESC
                 LIMIT ?",
                [$preferredCategory, $prefLimit]
            );
        }
        
        // Fetch the remaining slots normally (excluding already fetched items)
        $remainingLimit = $limit - count($items);
        if ($remainingLimit > 0) {
            $excludeIds = array_column($items, 'id');
            
            $where = "p.is_published = 1 AND p.is_featured = 1";
            $params = [];
            
            if (!empty($excludeIds)) {
                $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
                $where .= " AND p.id NOT IN ($placeholders)";
                $params = array_merge($params, $excludeIds);
            }
            
            $params[] = $remainingLimit;
            
            $otherItems = $this->db->fetchAll(
                "SELECT p.*, c.name as category_name,
                    COALESCE(p.sale_price, p.base_price) as effective_price,
                    (SELECT COALESCE(SUM(ps.quantity - ps.reserved_quantity), 0) FROM product_stocks ps WHERE ps.product_id = p.id) as total_stock
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE $where
                 ORDER BY p.created_at DESC
                 LIMIT ?",
                $params
            );
            
            $items = array_merge($items, $otherItems);
        }

        foreach ($items as &$item) {
            $item['images'] = json_decode($item['images'] ?? '[]', true);
        }

        return $items;
    }

    /**
     * Get all categories
     */
    public function getCategories(): array
    {
        return $this->db->fetchAll(
            "SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = 1) as product_count
             FROM categories c
             WHERE c.is_active = 1
             ORDER BY c.sort_order ASC"
        );
    }

    /**
     * Get unique brands
     */
    public function getBrands(): array
    {
        return $this->db->fetchAll(
            "SELECT DISTINCT brand, COUNT(*) as product_count
             FROM products WHERE is_published = 1 AND brand IS NOT NULL
             GROUP BY brand ORDER BY brand ASC"
        );
    }

    /**
     * Create a product
     */
    public function create(array $data): int
    {
        // Encode JSON fields
        if (isset($data['images']) && is_array($data['images'])) {
            $data['images'] = json_encode($data['images']);
        }
        if (isset($data['specifications']) && is_array($data['specifications'])) {
            $data['specifications'] = json_encode($data['specifications']);
        }

        return $this->db->insert('products', $data);
    }

    /**
     * Update a product
     */
    public function update(int $id, array $data): int
    {
        if (isset($data['images']) && is_array($data['images'])) {
            $data['images'] = json_encode($data['images']);
        }
        if (isset($data['specifications']) && is_array($data['specifications'])) {
            $data['specifications'] = json_encode($data['specifications']);
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->update('products', $data, ['id' => $id]);
    }

    /**
     * Delete a product
     */
    public function delete(int $id): int
    {
        return $this->db->delete('products', ['id' => $id]);
    }

    /**
     * Generate unique slug from name
     */
    public function generateSlug(string $name, ?int $excludeId = null): string
    {
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $name), '-'));
        $baseSlug = $slug;
        $counter = 1;

        while (true) {
            $sql = "SELECT COUNT(*) FROM products WHERE slug = ?";
            $params = [$slug];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }

            if ($this->db->fetchColumn($sql, $params) == 0) {
                break;
            }

            $slug = "$baseSlug-$counter";
            $counter++;
        }

        return $slug;
    }
}
