<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Auth, Database};
use Vicmic\Services\MediaService;

class MediaStudioController
{
    private MediaService $mediaService;

    public function __construct()
    {
        $this->mediaService = new MediaService();
    }

    public function index(Request $request): void
    {
        $db = Database::getInstance();
        $pagination = $request->pagination(30);

        $total = (int) $db->fetchColumn("SELECT COUNT(*) FROM media");
        $items = $db->fetchAll(
            "SELECT m.*, au.full_name as uploaded_by_name
             FROM media m
             LEFT JOIN admin_users au ON m.uploaded_by = au.id
             ORDER BY m.created_at DESC
             LIMIT ? OFFSET ?",
            [$pagination['per_page'], $pagination['offset']]
        );

        Response::paginated($items, $total, $pagination['page'], $pagination['per_page']);
    }

    public function upload(Request $request): void
    {
        $user = Auth::user($request);

        // Check if base64 upload (from Canvas)
        $base64Data = $request->input('image_data');
        if ($base64Data) {
            try {
                $result = $this->mediaService->uploadBase64($base64Data, 'products');
                $this->saveToLibrary($result, $user['id']);
                Response::created($result, 'Gambar berhasil diupload');
            } catch (\Throwable $e) {
                Response::error($e->getMessage(), 400);
            }
            return;
        }

        // Regular file upload
        $file = $request->file('image');
        if (!$file) {
            Response::error('Tidak ada file yang diupload', 400);
            return;
        }

        try {
            $result = $this->mediaService->upload($file, 'products');
            $this->saveToLibrary($result, $user['id']);
            Response::created($result, 'Gambar berhasil diupload');
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id');
        $db = Database::getInstance();
        
        $media = $db->fetch("SELECT * FROM media WHERE id = ?", [$id]);
        if (!$media) {
            Response::notFound('Media tidak ditemukan');
            return;
        }

        $this->mediaService->delete($media['path']);
        if ($media['thumbnail_path']) {
            $this->mediaService->delete($media['thumbnail_path']);
        }

        $db->delete('media', ['id' => $id]);
        Response::success(null, 'Media berhasil dihapus');
    }

    private function saveToLibrary(array $result, int $uploadedBy): void
    {
        $db = Database::getInstance();
        $db->insert('media', [
            'filename'       => $result['filename'],
            'original_name'  => $result['original_name'],
            'mime_type'      => $result['mime_type'],
            'file_size'      => $result['file_size'],
            'width'          => $result['width'],
            'height'         => $result['height'],
            'path'           => $result['path'],
            'thumbnail_path' => $result['thumbnail_path'] ?? null,
            'uploaded_by'    => $uploadedBy,
        ]);
    }
}
