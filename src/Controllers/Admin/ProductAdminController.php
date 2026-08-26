<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Validator};
use Vicmic\Models\Product;

class ProductAdminController
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
            'brand'              => $request->query('brand'),
            'category_slug'      => $request->query('category'),
            'search'             => $request->query('q'),
            'sort'               => $request->query('sort', 'newest'),
            'include_unpublished'=> true,
        ];

        $result = $this->model->getPaginated($filters, $pagination['offset'], $pagination['per_page']);
        Response::paginated($result['items'], $result['total'], $pagination['page'], $pagination['per_page']);
    }

    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $product = $this->model->getById($id);

        if (!$product) {
            Response::notFound('Produk tidak ditemukan');
            return;
        }

        Response::success($product);
    }

    public function store(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'sku'          => 'required|string|max:50|unique:products,sku',
            'name'         => 'required|string|max:255',
            'brand'        => 'string|max:100',
            'category_id'  => 'integer',
            'base_price'   => 'required|numeric|min:0',
            'description'  => 'string',
        ]);
        $data = $validator->validateOrFail();

        // Generate slug
        $data['slug'] = $this->model->generateSlug($data['name']);

        // Handle optional fields
        $optional = ['short_description', 'processor', 'ram_capacity', 'storage_type', 'gpu', 
                     'display_specs', 'os', 'weight_grams', 'sale_price', 'warranty_period_months',
                     'images', 'specifications', 'meta_title', 'meta_description', 'is_featured', 'is_published'];
        
        foreach ($optional as $field) {
            $value = $request->input($field);
            if ($value !== null) {
                $data[$field] = $value;
            }
        }

        $id = $this->model->create($data);
        Response::created(['id' => $id, 'slug' => $data['slug']], 'Produk berhasil ditambahkan');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $product = $this->model->getById($id);

        if (!$product) {
            Response::notFound('Produk tidak ditemukan');
            return;
        }

        $data = $request->all();
        
        // Regenerate slug if name changed
        if (isset($data['name']) && $data['name'] !== $product['name']) {
            $data['slug'] = $this->model->generateSlug($data['name'], $id);
        }

        // Remove read-only fields
        unset($data['id'], $data['created_at']);

        $this->model->update($id, $data);
        Response::success(['id' => $id], 'Produk berhasil diupdate');
    }

    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id');
        $this->model->delete($id);
        Response::success(null, 'Produk berhasil dihapus');
    }

    public function addVariant(Request $request): void
    {
        $productId = (int) $request->param('id');
        $validator = Validator::make($request->all(), [
            'variant_sku'      => 'required|string|max:50|unique:product_variants,variant_sku',
            'variant_name'     => 'required|string|max:100',
            'price_adjustment' => 'numeric',
        ]);
        $data = $validator->validateOrFail();
        $data['product_id'] = $productId;

        $db = \Vicmic\Core\Database::getInstance();
        $id = $db->insert('product_variants', $data);

        Response::created(['id' => $id], 'Varian berhasil ditambahkan');
    }

    public function updateVariant(Request $request): void
    {
        $id = (int) $request->param('id');
        $data = $request->only(['variant_name', 'price_adjustment', 'is_active']);
        
        $db = \Vicmic\Core\Database::getInstance();
        $db->update('product_variants', $data, ['id' => $id]);

        Response::success(null, 'Varian berhasil diupdate');
    }

    public function deleteVariant(Request $request): void
    {
        $id = (int) $request->param('id');
        $db = \Vicmic\Core\Database::getInstance();
        $db->delete('product_variants', ['id' => $id]);

        Response::success(null, 'Varian berhasil dihapus');
    }
}
