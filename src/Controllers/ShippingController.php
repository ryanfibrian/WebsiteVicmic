<?php
namespace Vicmic\Controllers;

use Vicmic\Core\{Request, Response};
use Vicmic\Services\RajaOngkirService;

class ShippingController
{
    private RajaOngkirService $shipping;

    public function __construct()
    {
        $this->shipping = new RajaOngkirService();
    }

    public function provinces(Request $request): void
    {
        Response::success($this->shipping->getProvinces());
    }

    public function cities(Request $request): void
    {
        $provinceId = (int) $request->param('province_id');
        Response::success($this->shipping->getCities($provinceId));
    }

    public function calculateRates(Request $request): void
    {
        $originCityId = (int) $request->query('origin');
        $destinationCityId = (int) $request->query('destination');
        $weight = (int) $request->query('weight', 2500);
        $courier = $request->query('courier');

        if (!$destinationCityId) {
            Response::error('Kota tujuan harus dipilih', 400);
            return;
        }

        // If no origin specified, calculate from all active warehouses
        if (!$originCityId) {
            $db = \Vicmic\Core\Database::getInstance();
            $warehouses = $db->fetchAll("SELECT id, city_id, name FROM warehouses WHERE is_active = 1");
            
            if (empty($warehouses)) {
                Response::error('Belum ada gudang aktif', 500);
                return;
            }

            // Use first warehouse as default
            $originCityId = $warehouses[0]['city_id'];
        }

        try {
            $rates = $this->shipping->calculateCost($originCityId, $destinationCityId, $weight, $courier);
            Response::success([
                'rates'    => $rates,
                'couriers' => $this->shipping->getAvailableCouriers(),
            ]);
        } catch (\Throwable $e) {
            Response::error('Gagal menghitung ongkir: ' . $e->getMessage(), 500);
        }
    }
}
