<?php
namespace Vicmic\Services;

use Vicmic\Core\Database;

/**
 * RajaOngkirService — Shipping rate calculation.
 * 
 * Integrates with RajaOngkir API (Starter tier) for:
 * - Province and city data (cached in DB)
 * - Shipping cost calculation (JNE, POS, TIKI)
 */
class RajaOngkirService
{
    private string $apiKey;
    private string $apiUrl;
    private string $accountType;
    private Database $db;

    public function __construct()
    {
        $this->apiKey = config('RAJAONGKIR_API_KEY', '');
        $this->accountType = config('RAJAONGKIR_ACCOUNT_TYPE', 'starter');
        $this->apiUrl = config('RAJAONGKIR_API_URL', 'https://api.rajaongkir.com/starter');
        $this->db = Database::getInstance();
    }

    /**
     * Get available couriers based on account type
     */
    public function getAvailableCouriers(): array
    {
        return match ($this->accountType) {
            'starter' => [
                ['code' => 'jne', 'name' => 'JNE'],
                ['code' => 'pos', 'name' => 'POS Indonesia'],
                ['code' => 'tiki', 'name' => 'TIKI'],
            ],
            'basic' => [
                ['code' => 'jne', 'name' => 'JNE'],
                ['code' => 'pos', 'name' => 'POS Indonesia'],
                ['code' => 'tiki', 'name' => 'TIKI'],
                ['code' => 'rpx', 'name' => 'RPX'],
                ['code' => 'esl', 'name' => 'ESL'],
            ],
            'pro' => [
                ['code' => 'jne', 'name' => 'JNE'],
                ['code' => 'pos', 'name' => 'POS Indonesia'],
                ['code' => 'tiki', 'name' => 'TIKI'],
                ['code' => 'j&t', 'name' => 'J&T Express'],
                ['code' => 'sicepat', 'name' => 'SiCepat'],
                ['code' => 'anteraja', 'name' => 'AnterAja'],
            ],
            default => [],
        };
    }

    /**
     * Get all provinces (from DB cache or API)
     */
    public function getProvinces(): array
    {
        // Check DB cache first
        $cached = $this->db->fetchAll("SELECT * FROM shipping_provinces ORDER BY name ASC");
        
        if (!empty($cached)) {
            return $cached;
        }

        // Fetch from API
        $response = $this->apiRequest('GET', '/province');
        $provinces = $response['rajaongkir']['results'] ?? [];

        // Cache to DB
        foreach ($provinces as $prov) {
            $this->db->query(
                "INSERT IGNORE INTO shipping_provinces (id, name) VALUES (?, ?)",
                [$prov['province_id'], $prov['province']]
            );
        }

        return $this->db->fetchAll("SELECT * FROM shipping_provinces ORDER BY name ASC");
    }

    /**
     * Get cities by province (from DB cache or API)
     */
    public function getCities(?int $provinceId = null): array
    {
        // Check DB cache
        $sql = "SELECT * FROM shipping_cities";
        $params = [];

        if ($provinceId) {
            $sql .= " WHERE province_id = ?";
            $params[] = $provinceId;
        }
        $sql .= " ORDER BY name ASC";

        $cached = $this->db->fetchAll($sql, $params);

        if (!empty($cached)) {
            return $cached;
        }

        // Fetch from API
        $endpoint = '/city';
        if ($provinceId) {
            $endpoint .= '?province=' . $provinceId;
        }

        $response = $this->apiRequest('GET', $endpoint);
        $cities = $response['rajaongkir']['results'] ?? [];

        // Cache to DB
        foreach ($cities as $city) {
            // Ensure province exists
            $this->db->query(
                "INSERT IGNORE INTO shipping_provinces (id, name) VALUES (?, ?)",
                [$city['province_id'], $city['province']]
            );

            $this->db->query(
                "INSERT IGNORE INTO shipping_cities (id, province_id, type, name, postal_code) VALUES (?, ?, ?, ?, ?)",
                [$city['city_id'], $city['province_id'], $city['type'], $city['city_name'], $city['postal_code'] ?? null]
            );
        }

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Calculate shipping cost
     * 
     * @param int $originCityId Origin city RajaOngkir ID
     * @param int $destinationCityId Destination city RajaOngkir ID
     * @param int $weightGrams Weight in grams
     * @param string|null $courier Specific courier code (null = all available)
     * @return array Shipping rate options
     */
    public function calculateCost(int $originCityId, int $destinationCityId, int $weightGrams, ?string $courier = null): array
    {
        // Minimum weight is 1000g (1kg) for most couriers
        $weight = max($weightGrams, 1000);

        $couriers = $courier ? [$courier] : array_column($this->getAvailableCouriers(), 'code');
        $allRates = [];

        foreach ($couriers as $courierCode) {
            $response = $this->apiRequest('POST', '/cost', [
                'origin'      => $originCityId,
                'destination'  => $destinationCityId,
                'weight'       => $weight,
                'courier'      => $courierCode,
            ]);

            $results = $response['rajaongkir']['results'] ?? [];

            foreach ($results as $result) {
                $courierName = $result['name'] ?? $courierCode;
                $costs = $result['costs'] ?? [];

                foreach ($costs as $service) {
                    $costDetail = $service['cost'][0] ?? [];
                    $allRates[] = [
                        'courier_code'  => $courierCode,
                        'courier_name'  => $courierName,
                        'service'       => $service['service'] ?? '',
                        'description'   => $service['description'] ?? '',
                        'cost'          => (int) ($costDetail['value'] ?? 0),
                        'etd'           => $costDetail['etd'] ?? '-',
                        'note'          => $costDetail['note'] ?? '',
                    ];
                }
            }
        }

        // Sort by cost ascending
        usort($allRates, fn($a, $b) => $a['cost'] - $b['cost']);

        return $allRates;
    }

    /**
     * Make API request to RajaOngkir
     */
    private function apiRequest(string $method, string $endpoint, ?array $data = null): array
    {
        $ch = curl_init();
        $url = $this->apiUrl . $endpoint;

        $headers = [
            'key: ' . $this->apiKey,
        ];

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING       => '',
            CURLOPT_MAXREDIRS      => 10,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        ]);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            $headers[] = 'content-type: application/x-www-form-urlencoded';
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \RuntimeException("RajaOngkir API error: $error");
        }

        return json_decode($response, true) ?? [];
    }

    /**
     * Check if API is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }
}
