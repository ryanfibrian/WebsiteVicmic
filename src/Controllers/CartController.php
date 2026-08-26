<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response, Database};

/**
 * CartController — Session-based shopping cart.
 */
class CartController
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function show(Request $request): void
    {
        $cart = $this->getCart();
        $enriched = $this->enrichCartItems($cart);

        Response::success([
            'items'    => $enriched,
            'subtotal' => array_sum(array_map(fn($i) => $i['line_total'], $enriched)),
            'count'    => array_sum(array_column($enriched, 'quantity')),
        ]);
    }

    public function add(Request $request): void
    {
        $productId = (int) $request->input('product_id');
        $variantId = $request->input('variant_id') ? (int) $request->input('variant_id') : null;
        $quantity = max(1, (int) $request->input('quantity', 1));

        // Verify product exists
        $product = $this->db->fetch("SELECT id, name, base_price, sale_price FROM products WHERE id = ? AND is_published = 1", [$productId]);
        if (!$product) {
            Response::notFound('Produk tidak ditemukan');
            return;
        }

        $cart = $this->getCart();
        $key = $productId . '-' . ($variantId ?? '0');

        if (isset($cart[$key])) {
            $cart[$key]['quantity'] += $quantity;
        } else {
            $cart[$key] = [
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity'   => $quantity,
            ];
        }

        $this->saveCart($cart);
        $enriched = $this->enrichCartItems($cart);

        Response::success([
            'items'    => $enriched,
            'subtotal' => array_sum(array_map(fn($i) => $i['line_total'], $enriched)),
            'count'    => array_sum(array_column($enriched, 'quantity')),
            'message'  => 'Produk ditambahkan ke keranjang',
        ]);
    }

    public function update(Request $request): void
    {
        $productId = (int) $request->input('product_id');
        $variantId = $request->input('variant_id') ? (int) $request->input('variant_id') : null;
        $quantity = (int) $request->input('quantity');

        $cart = $this->getCart();
        $key = $productId . '-' . ($variantId ?? '0');

        if ($quantity <= 0) {
            unset($cart[$key]);
        } elseif (isset($cart[$key])) {
            $cart[$key]['quantity'] = $quantity;
        }

        $this->saveCart($cart);
        $enriched = $this->enrichCartItems($cart);

        Response::success([
            'items'    => $enriched,
            'subtotal' => array_sum(array_map(fn($i) => $i['line_total'], $enriched)),
            'count'    => array_sum(array_column($enriched, 'quantity')),
        ]);
    }

    public function remove(Request $request): void
    {
        $id = $request->param('id'); // format: productId-variantId
        $cart = $this->getCart();
        unset($cart[$id]);

        $this->saveCart($cart);
        $enriched = $this->enrichCartItems($cart);

        Response::success([
            'items'    => $enriched,
            'subtotal' => array_sum(array_map(fn($i) => $i['line_total'], $enriched)),
            'count'    => array_sum(array_column($enriched, 'quantity')),
        ]);
    }

    public function clear(Request $request): void
    {
        $this->saveCart([]);
        Response::success(['items' => [], 'subtotal' => 0, 'count' => 0]);
    }

    private function getCart(): array
    {
        return $_SESSION['cart'] ?? [];
    }

    private function saveCart(array $cart): void
    {
        $_SESSION['cart'] = $cart;
    }

    /**
     * Enrich cart items with current product data
     */
    private function enrichCartItems(array $cart): array
    {
        $enriched = [];
        foreach ($cart as $key => $item) {
            $product = $this->db->fetch(
                "SELECT id, name, slug, brand, base_price, sale_price, images, weight_grams FROM products WHERE id = ?",
                [$item['product_id']]
            );

            if (!$product) continue;

            $variant = null;
            if ($item['variant_id']) {
                $variant = $this->db->fetch(
                    "SELECT id, variant_name, price_adjustment FROM product_variants WHERE id = ?",
                    [$item['variant_id']]
                );
            }

            $price = $product['sale_price'] ?? $product['base_price'];
            if ($variant) {
                $price += $variant['price_adjustment'];
            }

            $images = json_decode($product['images'] ?? '[]', true);

            $enriched[] = [
                'key'          => $key,
                'product_id'   => $product['id'],
                'variant_id'   => $item['variant_id'],
                'name'         => $product['name'],
                'brand'        => $product['brand'],
                'slug'         => $product['slug'],
                'variant_name' => $variant['variant_name'] ?? null,
                'unit_price'   => (float) $price,
                'quantity'     => $item['quantity'],
                'line_total'   => (float) $price * $item['quantity'],
                'image'        => $images[0] ?? null,
                'weight_grams' => $product['weight_grams'],
            ];
        }
        return $enriched;
    }
}
