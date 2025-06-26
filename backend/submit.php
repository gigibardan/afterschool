<?php
// Form submission handler for TechMinds Academy Afterschool
// Processes preregistration form data and saves to database

// Security check
define('SECURE_ACCESS', true);

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 1 for debugging

// Set content type
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Include dependencies
require_once 'config.php';
require_once 'database.php';

// Response helper function
function sendResponse($success, $message, $data = null, $errors = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    
    debug_log('Response sent: ' . json_encode($response));
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Metodă de cerere nevalidă. Doar POST este acceptat.');
}

// Check if request is AJAX
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    sendResponse(false, 'Cerere nevalidă.');
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'Date JSON nevalide.');
    }
    
    debug_log('Form submission received', $data);
    
   /*
    // Validate CSRF token
    if (!isset($data['csrf_token']) || !isset($_SESSION['csrf_token']) || 
        !hash_equals($_SESSION['csrf_token'], $data['csrf_token'])) {
        sendResponse(false, 'Token de securitate nevalid. Vă rugăm să reîncărcați pagina.');
    }
    */
    
    // Initialize validation errors
    $errors = [];
    $sanitizedData = [];
    
    // Validation and sanitization rules
    $rules = [
        'nume_parinte' => [
            'required' => true,
            'min_length' => 2,
            'max_length' => 100,
            'pattern' => '/^[a-zA-ZăîâșțĂÎÂȘȚ\s\-\']+$/u',
            'message' => 'Numele părintelui este invalid'
        ],
        'prenume_parinte' => [
            'required' => true,
            'min_length' => 2,
            'max_length' => 100,
            'pattern' => '/^[a-zA-ZăîâșțĂÎÂȘȚ\s\-\']+$/u',
            'message' => 'Prenumele părintelui este invalid'
        ],
        'telefon_parinte' => [
            'required' => true,
            'pattern' => '/^[0-9\s\-\+\(\)]+$/',
            'custom_validation' => 'validatePhone',
            'message' => 'Numărul de telefon este invalid'
        ],
        'email_parinte' => [
            'required' => true,
            'max_length' => 150,
            'custom_validation' => 'validateEmail',
            'message' => 'Adresa de email este invalidă'
        ],
        'nume_copil' => [
            'required' => true,
            'min_length' => 3,
            'max_length' => 100,
            'pattern' => '/^[a-zA-ZăîâșțĂÎÂȘȚ\s\-\']+$/u',
            'custom_validation' => 'validateChildName',
            'message' => 'Numele copilului este invalid'
        ],
        'varsta_copil' => [
            'required' => true,
            'type' => 'integer',
            'min_value' => 6,
            'max_value' => 18,
            'message' => 'Vârsta copilului trebuie să fie între 6 și 18 ani'
        ],
        'clasa_copil' => [
            'required' => true,
            'allowed_values' => ['Pregătitoare', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
            'message' => 'Clasa selectată nu este validă'
        ],
        'scoala_copil' => [
            'required' => true,
            'min_length' => 3,
            'max_length' => 200,
            'message' => 'Numele școlii este invalid'
        ],
        'experienta_copil' => [
            'required' => false,
            'allowed_values' => ['', 'Fără experiență', 'Începător', 'Intermediar', 'Avansat'],
            'message' => 'Nivelul de experiență selectat nu este valid'
        ],
        'observatii' => [
            'required' => false,
            'max_length' => 1000,
            'message' => 'Observațiile sunt prea lungi (maxim 1000 caractere)'
        ],
        'acord_gdpr' => [
            'required' => true,
            'type' => 'boolean',
            'message' => 'Acordul GDPR este obligatoriu'
        ]
    ];
    
    // Validate each field
    foreach ($rules as $field => $rule) {
        $value = isset($data[$field]) ? $data[$field] : '';
        
        // Handle boolean fields
        if (isset($rule['type']) && $rule['type'] === 'boolean') {
            $value = isset($data[$field]) && ($data[$field] === '1' || $data[$field] === true || $data[$field] === 1);
        }
        
        // Required field check
        if ($rule['required'] && (empty($value) && $value !== 0 && $value !== '0')) {
            $errors[$field] = 'Acest câmp este obligatoriu';
            continue;
        }
        
        // Skip further validation if field is empty and not required
        if (!$rule['required'] && empty($value)) {
            $sanitizedData[$field] = '';
            continue;
        }
        
        // Type conversion
        if (isset($rule['type'])) {
            switch ($rule['type']) {
                case 'integer':
                    $value = intval($value);
                    break;
                case 'boolean':
                    $value = $value ? 1 : 0;
                    break;
            }
        }
        
        // Length validation
        if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
            $errors[$field] = "Câmpul trebuie să aibă cel puțin {$rule['min_length']} caractere";
            continue;
        }
        
        if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
            $errors[$field] = "Câmpul trebuie să aibă cel mult {$rule['max_length']} caractere";
            continue;
        }
        
        // Value range validation
        if (isset($rule['min_value']) && $value < $rule['min_value']) {
            $errors[$field] = $rule['message'];
            continue;
        }
        
        if (isset($rule['max_value']) && $value > $rule['max_value']) {
            $errors[$field] = $rule['message'];
            continue;
        }
        
        // Pattern validation
        if (isset($rule['pattern']) && !preg_match($rule['pattern'], $value)) {
            $errors[$field] = $rule['message'];
            continue;
        }
        
        // Allowed values validation
        if (isset($rule['allowed_values']) && !in_array($value, $rule['allowed_values'])) {
            $errors[$field] = $rule['message'];
            continue;
        }
        
        // Custom validation
        if (isset($rule['custom_validation'])) {
            $validationResult = call_user_func($rule['custom_validation'], $value);
            if ($validationResult !== true) {
                $errors[$field] = $validationResult;
                continue;
            }
        }
        
        // Sanitize and store
        if (is_string($value)) {
            $sanitizedData[$field] = trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
        } else {
            $sanitizedData[$field] = $value;
        }
    }
    
    // Handle interests array
    if (isset($data['interese_copil']) && is_array($data['interese_copil'])) {
        $allowedInterests = ['Programare', 'Robotica', 'Jocuri', 'Web', 'AI'];
        $validInterests = array_intersect($data['interese_copil'], $allowedInterests);
        $sanitizedData['interese_copil'] = implode(', ', $validInterests);
    } else {
        $sanitizedData['interese_copil'] = '';
    }
    
    // Handle optional boolean fields
    $optionalBoolFields = ['acord_marketing', 'acord_foto'];
    foreach ($optionalBoolFields as $field) {
        $sanitizedData[$field] = isset($data[$field]) && ($data[$field] === '1' || $data[$field] === true || $data[$field] === 1) ? 1 : 0;
    }
    
    // If there are validation errors, return them
    if (!empty($errors)) {
        debug_log('Validation errors found', $errors);
        sendResponse(false, 'Datele introduse conțin erori. Vă rugăm să le corectați.', null, $errors);
    }
    
    // Check for duplicate email or phone
    $db = getDB();
    
    $existingByEmail = dbSelect(
        'preinscrieri', 
        'id, email_parinte', 
        'email_parinte = ?', 
        [$sanitizedData['email_parinte']]
    );
    
    if (!empty($existingByEmail)) {
        sendResponse(false, 'Această adresă de email este deja înregistrată. Dacă aveți întrebări, vă rugăm să ne contactați.');
    }
    
    $existingByPhone = dbSelect(
        'preinscrieri', 
        'id, telefon_parinte', 
        'telefon_parinte = ?', 
        [$sanitizedData['telefon_parinte']]
    );
    
    if (!empty($existingByPhone)) {
        sendResponse(false, 'Acest număr de telefon este deja înregistrat. Dacă aveți întrebări, vă rugăm să ne contactați.');
    }
    
    // Prepare data for database insertion
    $dbData = [
        'nume_parinte' => $sanitizedData['nume_parinte'],
        'prenume_parinte' => $sanitizedData['prenume_parinte'],
        'telefon_parinte' => $sanitizedData['telefon_parinte'],
        'email_parinte' => $sanitizedData['email_parinte'],
        'nume_copil' => $sanitizedData['nume_copil'],
        'varsta_copil' => $sanitizedData['varsta_copil'],
        'clasa_copil' => $sanitizedData['clasa_copil'],
        'scoala_copil' => $sanitizedData['scoala_copil'],
        'experienta_copil' => $sanitizedData['experienta_copil'],
        'interese_copil' => $sanitizedData['interese_copil'],
        'observatii' => $sanitizedData['observatii'],
        'acord_gdpr' => $sanitizedData['acord_gdpr'],
        'acord_marketing' => $sanitizedData['acord_marketing'],
        'acord_foto' => $sanitizedData['acord_foto'],
        'status' => 'nou',
        'data_inscriere' => date('Y-m-d H:i:s'),
        'ip_adresa' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    // Insert into database
    $insertId = dbInsert('preinscrieri', $dbData);
    
    if (!$insertId) {
        debug_log('Database insertion failed');
        sendResponse(false, 'A apărut o eroare la salvarea datelor. Vă rugăm să încercați din nou.');
    }
    
    debug_log('Preregistration saved successfully with ID: ' . $insertId);
    
    // Send notification emails (optional)
    try {
        sendNotificationEmails($sanitizedData, $insertId);
    } catch (Exception $e) {
        debug_log('Email notification failed: ' . $e->getMessage());
        // Don't fail the whole process if email fails
    }
    
    // Success response
    sendResponse(
        true, 
        'Preînregistrarea a fost trimisă cu succes! Vă vom contacta în cel mai scurt timp pentru a confirma locul și a vă oferi detalii suplimentare despre program.',
        [
            'registration_id' => $insertId,
            'email' => $sanitizedData['email_parinte']
        ]
    );
    
} catch (Exception $e) {
    debug_log('Fatal error in form submission: ' . $e->getMessage());
    sendResponse(false, 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou sau să ne contactați direct.');
}

// Custom validation functions

function validatePhone($phone) {
    $cleanPhone = preg_replace('/\s/', '', $phone);
    
    $patterns = [
        '/^07[0-9]{8}$/',      // 07XXXXXXXX
        '/^02[0-9]{7}$/',      // 02XXXXXXX
        '/^03[0-9]{8}$/',      // 03XXXXXXXX
        '/^\+407[0-9]{8}$/',   // +407XXXXXXXX
        '/^00407[0-9]{8}$/'    // 00407XXXXXXXX
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $cleanPhone)) {
            return true;
        }
    }
    
    return 'Numărul de telefon nu este valid (exemplu: 0745 123 456)';
}

function validateEmail($email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'Adresa de email nu este validă';
    }
    
    // Check for disposable email domains (optional)
    $disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    $domain = substr(strrchr($email, "@"), 1);
    
    if (in_array(strtolower($domain), $disposableDomains)) {
        return 'Vă rugăm să utilizați o adresă de email permanentă';
    }
    
    return true;
}

function validateChildName($name) {
    $nameParts = preg_split('/\s+/', trim($name));
    
    if (count($nameParts) < 2) {
        return 'Vă rugăm să introduceți numele complet al copilului (nume și prenume)';
    }
    
    foreach ($nameParts as $part) {
        if (strlen($part) < 2) {
            return 'Fiecare parte a numelui trebuie să aibă cel puțin 2 caractere';
        }
    }
    
    return true;
}

// Email notification function
function sendNotificationEmails($data, $registrationId) {
    // This is a placeholder for email functionality
    // You can implement actual email sending here using PHPMailer or similar
    
    debug_log('Email notifications should be sent for registration ID: ' . $registrationId);
    
    // Example structure for email data
    $emailData = [
        'to_admin' => [
            'subject' => 'Preînregistrare nouă Afterschool - ' . $data['nume_copil'],
            'template' => 'admin_notification',
            'data' => $data
        ],
        'to_parent' => [
            'subject' => 'Confirmare preînregistrare TechMinds Academy Afterschool',
            'template' => 'parent_confirmation',
            'data' => $data
        ]
    ];
    
    // TODO: Implement actual email sending
    // For now, just log the data
    debug_log('Email data prepared', $emailData);
}

// Rate limiting check (optional)
function checkRateLimit($ip) {
    // Simple rate limiting: max 5 submissions per hour per IP
    $rateLimitFile = __DIR__ . '/../logs/rate_limit.json';
    
    if (!file_exists($rateLimitFile)) {
        return true;
    }
    
    $rateData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    $currentHour = date('Y-m-d-H');
    
    if (!isset($rateData[$ip])) {
        $rateData[$ip] = [];
    }
    
    if (!isset($rateData[$ip][$currentHour])) {
        $rateData[$ip][$currentHour] = 0;
    }
    
    if ($rateData[$ip][$currentHour] >= 5) {
        return false;
    }
    
    $rateData[$ip][$currentHour]++;
    
    // Clean old data
    foreach ($rateData as $rateIp => $hours) {
        foreach ($hours as $hour => $count) {
            if ($hour < date('Y-m-d-H', strtotime('-2 hours'))) {
                unset($rateData[$rateIp][$hour]);
            }
        }
        if (empty($rateData[$rateIp])) {
            unset($rateData[$rateIp]);
        }
    }
    
    file_put_contents($rateLimitFile, json_encode($rateData));
    return true;
}
?>