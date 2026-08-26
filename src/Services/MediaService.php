<?php
namespace Vicmic\Services;

/**
 * MediaService — Handles file uploads and image processing.
 * 
 * Server-side responsibilities:
 * - File upload validation and storage
 * - Thumbnail generation (using GD)
 * - File naming with unique hashes
 * 
 * Client-side Canvas handles: crop, rotate, resize, watermark, templates
 */
class MediaService
{
    private string $uploadPath;
    private int $maxSize;
    private array $allowedTypes;

    public function __construct()
    {
        $this->uploadPath = VICMIC_ROOT . '/' . ltrim(config('UPLOAD_PATH', '../uploads'), '/');
        $this->maxSize = (int) config('UPLOAD_MAX_SIZE', 5242880);
        $this->allowedTypes = explode(',', config('UPLOAD_ALLOWED_TYPES', 'jpg,jpeg,png,webp,gif'));

        // Ensure upload directories exist
        $this->ensureDirectory($this->uploadPath . '/products');
        $this->ensureDirectory($this->uploadPath . '/media');
        $this->ensureDirectory($this->uploadPath . '/thumbnails');
    }

    /**
     * Upload a file from $_FILES
     * 
     * @return array{filename, original_name, path, url, mime_type, file_size, width, height}
     */
    public function upload(array $file, string $subdir = 'products'): array
    {
        // Validate file
        $this->validateFile($file);

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = $this->generateFilename($extension);
        $targetDir = $this->uploadPath . '/' . $subdir;
        $targetPath = $targetDir . '/' . $filename;

        $this->ensureDirectory($targetDir);

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new \RuntimeException('Gagal menyimpan file');
        }

        // Get image dimensions
        $dimensions = @getimagesize($targetPath);
        $width = $dimensions[0] ?? null;
        $height = $dimensions[1] ?? null;

        // Generate thumbnail
        $thumbnailPath = null;
        if ($dimensions && in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
            $thumbnailPath = $this->generateThumbnail($targetPath, $extension);
        }

        return [
            'filename'      => $filename,
            'original_name' => $file['name'],
            'path'          => "/uploads/$subdir/$filename",
            'url'           => config('APP_URL') . "/uploads/$subdir/$filename",
            'thumbnail_path'=> $thumbnailPath ? "/uploads/thumbnails/" . basename($thumbnailPath) : null,
            'mime_type'     => $file['type'],
            'file_size'     => $file['size'],
            'width'         => $width,
            'height'        => $height,
        ];
    }

    /**
     * Upload a base64-encoded image (from Canvas export)
     */
    public function uploadBase64(string $base64Data, string $subdir = 'products'): array
    {
        // Parse data URI
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $matches)) {
            $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
            $data = base64_decode(preg_replace('/^data:image\/\w+;base64,/', '', $base64Data));
        } else {
            throw new \RuntimeException('Format gambar tidak valid');
        }

        if (!$data) {
            throw new \RuntimeException('Gagal decode data gambar');
        }

        if (strlen($data) > $this->maxSize) {
            throw new \RuntimeException('Ukuran file melebihi batas (' . round($this->maxSize / 1048576, 1) . 'MB)');
        }

        $filename = $this->generateFilename($extension);
        $targetDir = $this->uploadPath . '/' . $subdir;
        $targetPath = $targetDir . '/' . $filename;

        $this->ensureDirectory($targetDir);
        file_put_contents($targetPath, $data);

        $dimensions = @getimagesize($targetPath);

        return [
            'filename'      => $filename,
            'original_name' => $filename,
            'path'          => "/uploads/$subdir/$filename",
            'url'           => config('APP_URL') . "/uploads/$subdir/$filename",
            'mime_type'     => "image/$extension",
            'file_size'     => strlen($data),
            'width'         => $dimensions[0] ?? null,
            'height'        => $dimensions[1] ?? null,
        ];
    }

    /**
     * Delete a file
     */
    public function delete(string $path): bool
    {
        $fullPath = VICMIC_ROOT . '/public' . $path;
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(array $file): void
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors = [
                UPLOAD_ERR_INI_SIZE   => 'File terlalu besar (batas server)',
                UPLOAD_ERR_FORM_SIZE  => 'File terlalu besar (batas form)',
                UPLOAD_ERR_PARTIAL    => 'File hanya terupload sebagian',
                UPLOAD_ERR_NO_FILE    => 'Tidak ada file yang diupload',
                UPLOAD_ERR_NO_TMP_DIR => 'Folder temporary tidak ditemukan',
                UPLOAD_ERR_CANT_WRITE => 'Gagal menulis file ke disk',
            ];
            throw new \RuntimeException($errors[$file['error']] ?? 'Upload error');
        }

        if ($file['size'] > $this->maxSize) {
            throw new \RuntimeException('Ukuran file melebihi batas (' . round($this->maxSize / 1048576, 1) . 'MB)');
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowedTypes)) {
            throw new \RuntimeException('Tipe file tidak diizinkan. Gunakan: ' . implode(', ', $this->allowedTypes));
        }

        // Verify it's actually an image
        if (!@getimagesize($file['tmp_name'])) {
            throw new \RuntimeException('File bukan gambar yang valid');
        }
    }

    /**
     * Generate unique filename
     */
    private function generateFilename(string $extension): string
    {
        return date('Ymd') . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
    }

    /**
     * Generate thumbnail (300x300)
     */
    private function generateThumbnail(string $sourcePath, string $extension, int $size = 300): ?string
    {
        if (!extension_loaded('gd')) {
            return null;
        }

        $source = match ($extension) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($sourcePath),
            'png'         => @imagecreatefrompng($sourcePath),
            'webp'        => @imagecreatefromwebp($sourcePath),
            default       => null,
        };

        if (!$source) return null;

        $origW = imagesx($source);
        $origH = imagesy($source);

        // Calculate crop dimensions (square center crop)
        $cropSize = min($origW, $origH);
        $srcX = (int) (($origW - $cropSize) / 2);
        $srcY = (int) (($origH - $cropSize) / 2);

        $thumb = imagecreatetruecolor($size, $size);

        // Preserve transparency for PNG
        if ($extension === 'png') {
            imagesavealpha($thumb, true);
            $transparent = imagecolorallocatealpha($thumb, 0, 0, 0, 127);
            imagefill($thumb, 0, 0, $transparent);
        }

        imagecopyresampled($thumb, $source, 0, 0, $srcX, $srcY, $size, $size, $cropSize, $cropSize);

        $thumbFilename = pathinfo(basename($sourcePath), PATHINFO_FILENAME) . '_thumb.webp';
        $thumbPath = $this->uploadPath . '/thumbnails/' . $thumbFilename;

        imagewebp($thumb, $thumbPath, 80);

        imagedestroy($source);
        imagedestroy($thumb);

        return $thumbPath;
    }

    /**
     * Ensure directory exists
     */
    private function ensureDirectory(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
}
