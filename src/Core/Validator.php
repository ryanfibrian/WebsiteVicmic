<?php
namespace Vicmic\Core;

/**
 * Validator — Input validation helper.
 * 
 * Provides declarative validation rules for request data
 * with clear error messages.
 */
class Validator
{
    private array $errors = [];
    private array $data;
    private array $validated = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Create validator from request input
     */
    public static function make(array $data, array $rules): self
    {
        $validator = new self($data);
        $validator->validate($rules);
        return $validator;
    }

    /**
     * Run validation rules
     * 
     * Rules format: ['field' => 'required|string|max:255']
     */
    public function validate(array $rules): self
    {
        foreach ($rules as $field => $ruleString) {
            $fieldRules = is_string($ruleString) ? explode('|', $ruleString) : $ruleString;
            $value = $this->data[$field] ?? null;
            $isRequired = in_array('required', $fieldRules, true);

            // If field is not required and not present, skip
            if (!$isRequired && ($value === null || $value === '')) {
                continue;
            }

            foreach ($fieldRules as $rule) {
                $this->applyRule($field, $value, $rule);
            }

            // Store validated value if no errors for this field
            if (!isset($this->errors[$field])) {
                $this->validated[$field] = $value;
            }
        }

        return $this;
    }

    /**
     * Apply a single validation rule
     */
    private function applyRule(string $field, mixed $value, string $rule): void
    {
        $params = [];
        if (str_contains($rule, ':')) {
            [$rule, $paramStr] = explode(':', $rule, 2);
            $params = explode(',', $paramStr);
        }

        $label = str_replace('_', ' ', $field);

        switch ($rule) {
            case 'required':
                if ($value === null || $value === '' || (is_array($value) && empty($value))) {
                    $this->addError($field, "$label wajib diisi");
                }
                break;

            case 'string':
                if ($value !== null && !is_string($value)) {
                    $this->addError($field, "$label harus berupa teks");
                }
                break;

            case 'integer':
            case 'int':
                if ($value !== null && !is_numeric($value)) {
                    $this->addError($field, "$label harus berupa angka");
                }
                break;

            case 'numeric':
                if ($value !== null && !is_numeric($value)) {
                    $this->addError($field, "$label harus berupa angka");
                }
                break;

            case 'email':
                if ($value !== null && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "$label harus berupa email yang valid");
                }
                break;

            case 'min':
                $min = (int) ($params[0] ?? 0);
                if (is_string($value)) {
                    if (mb_strlen($value) < $min) {
                        $this->addError($field, "$label minimal $min karakter");
                    }
                } elseif (is_numeric($value) && $value < $min) {
                    $this->addError($field, "$label minimal bernilai $min");
                }
                break;

            case 'max':
                $max = (int) ($params[0] ?? 0);
                if (is_string($value)) {
                    if (mb_strlen($value) > $max) {
                        $this->addError($field, "$label maksimal $max karakter");
                    }
                } elseif (is_numeric($value) && $value > $max) {
                    $this->addError($field, "$label maksimal bernilai $max");
                }
                break;

            case 'in':
                if ($value !== null && !in_array($value, $params, true)) {
                    $this->addError($field, "$label harus salah satu dari: " . implode(', ', $params));
                }
                break;

            case 'phone':
                if ($value !== null && !preg_match('/^(\+?62|0)[0-9]{8,13}$/', preg_replace('/[\s\-]/', '', $value))) {
                    $this->addError($field, "$label harus berupa nomor telepon yang valid");
                }
                break;

            case 'slug':
                if ($value !== null && !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value)) {
                    $this->addError($field, "$label harus berupa slug yang valid (huruf kecil, angka, dan strip)");
                }
                break;

            case 'url':
                if ($value !== null && !filter_var($value, FILTER_VALIDATE_URL)) {
                    $this->addError($field, "$label harus berupa URL yang valid");
                }
                break;

            case 'array':
                if ($value !== null && !is_array($value)) {
                    $this->addError($field, "$label harus berupa array");
                }
                break;

            case 'json':
                if ($value !== null && is_string($value) && json_decode($value) === null) {
                    $this->addError($field, "$label harus berupa JSON yang valid");
                }
                break;

            case 'boolean':
            case 'bool':
                if ($value !== null && !in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false'], true)) {
                    $this->addError($field, "$label harus berupa boolean");
                }
                break;

            case 'date':
                if ($value !== null && !strtotime($value)) {
                    $this->addError($field, "$label harus berupa tanggal yang valid");
                }
                break;

            case 'unique':
                // Format: unique:table,column
                if ($value !== null && count($params) >= 2) {
                    $table = $params[0];
                    $column = $params[1];
                    $excludeId = $params[2] ?? null;
                    
                    try {
                        $db = Database::getInstance();
                        $sql = "SELECT COUNT(*) FROM `$table` WHERE `$column` = ?";
                        $sqlParams = [$value];
                        
                        if ($excludeId) {
                            $sql .= " AND id != ?";
                            $sqlParams[] = $excludeId;
                        }
                        
                        if ($db->fetchColumn($sql, $sqlParams) > 0) {
                            $this->addError($field, "$label sudah digunakan");
                        }
                    } catch (\Throwable $e) {
                        // If DB is unreachable, skip unique check
                        // The DB constraint will catch duplicates on insert
                    }
                }
                break;

            case 'confirmed':
                $confirmField = $field . '_confirmation';
                $confirmValue = $this->data[$confirmField] ?? null;
                if ($value !== $confirmValue) {
                    $this->addError($field, "Konfirmasi $label tidak cocok");
                }
                break;
        }
    }

    /**
     * Add an error message
     */
    public function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    /**
     * Check if validation failed
     */
    public function fails(): bool
    {
        return !empty($this->errors);
    }

    /**
     * Check if validation passed
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Get all errors
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Get first error for a field
     */
    public function firstError(string $field): ?string
    {
        return $this->errors[$field][0] ?? null;
    }

    /**
     * Get all validated data
     */
    public function validated(): array
    {
        return $this->validated;
    }

    /**
     * Auto-respond with 422 if validation fails
     */
    public function validateOrFail(): array
    {
        if ($this->fails()) {
            Response::validationError($this->errors());
        }
        return $this->validated();
    }
}
