<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response};
use Vicmic\Models\Product;

class ProductController
{
    private Product $model;

    public function __construct()
    {
        $this->model = new Product();
    }

    public function index(Request $request): void
    {
        $pagination = $request->pagination();
        $filters = [
            'brand'         => $request->query('brand'),
            'category_slug' => $request->query('category'),
            'min_price'     => $request->query('min_price'),
            'max_price'     => $request->query('max_price'),
            'search'        => $request->query('q'),
            'sort'          => $request->query('sort', 'newest'),
        ];

        $result = $this->model->getPaginated($filters, $pagination['offset'], $pagination['per_page']);
        Response::paginated($result['items'], $result['total'], $pagination['page'], $pagination['per_page']);
    }

    public function featured(Request $request): void
    {
        $limit = (int) $request->query('limit', 8);
        $preferredCategory = $request->query('preferred_category', null);
        Response::success($this->model->getFeatured($limit, $preferredCategory));
    }

    public function search(Request $request): void
    {
        $q = $request->query('q', '');
        if (mb_strlen($q) < 2) {
            Response::success([]);
            return;
        }

        $result = $this->model->getPaginated(['search' => $q], 0, 20);
        Response::success($result['items']);
    }

    public function show(Request $request): void
    {
        $slug = $request->param('slug');
        $product = $this->model->getBySlug($slug);

        if (!$product) {
            Response::notFound('Produk tidak ditemukan');
            return;
        }

        Response::success($product);
    }

    public function stockInfo(Request $request): void
    {
        $slug = $request->param('slug');
        $product = $this->model->getBySlug($slug);

        if (!$product) {
            Response::notFound('Produk tidak ditemukan');
            return;
        }

        Response::success([
            'total_stock'     => $product['total_stock'],
            'warehouse_stock' => $product['warehouse_stock'],
            'in_stock'        => $product['total_stock'] > 0,
        ]);
    }

    public function categories(Request $request): void
    {
        Response::success($this->model->getCategories());
    }
}
