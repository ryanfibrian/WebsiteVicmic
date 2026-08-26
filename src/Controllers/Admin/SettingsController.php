<?php
namespace Vicmic\Controllers\Admin;

use Vicmic\Core\{Request, Response, Database};

class SettingsController
{
    public function index(Request $request): void
    {
        $db = Database::getInstance();
        $settings = $db->fetchAll("SELECT * FROM settings ORDER BY setting_group, setting_key");

        $grouped = [];
        foreach ($settings as $s) {
            $grouped[$s['setting_group']][$s['setting_key']] = $s['setting_value'];
        }

        Response::success($grouped);
    }

    public function update(Request $request): void
    {
        $db = Database::getInstance();
        $settings = $request->all();

        foreach ($settings as $key => $value) {
            $existing = $db->fetch("SELECT id FROM settings WHERE setting_key = ?", [$key]);
            if ($existing) {
                $db->update('settings', ['setting_value' => $value], ['setting_key' => $key]);
            } else {
                $db->insert('settings', [
                    'setting_key'   => $key,
                    'setting_value' => $value,
                    'setting_group' => 'general',
                ]);
            }
        }

        Response::success(null, 'Pengaturan berhasil disimpan');
    }

    public function publicSettings(Request $request): void
    {
        $db = Database::getInstance();
        $settings = $db->fetchAll(
            "SELECT setting_key, setting_value FROM settings WHERE setting_group IN ('general', 'branding')"
        );

        $result = [];
        foreach ($settings as $s) {
            $result[$s['setting_key']] = $s['setting_value'];
        }

        Response::success($result);
    }
}
