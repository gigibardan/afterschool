<?php
// Simple submit handler with file storage
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Simple validation
    $errors = [];
    
    if (empty($data['nume_parinte'])) {
        $errors['nume_parinte'] = 'Numele părintelui este obligatoriu';
    }
    
    if (empty($data['email_parinte'])) {
        $errors['email_parinte'] = 'Email-ul este obligatoriu';
    } elseif (!filter_var($data['email_parinte'], FILTER_VALIDATE_EMAIL)) {
        $errors['email_parinte'] = 'Email-ul nu este valid';
    }
    
    if (empty($data['nume_copil'])) {
        $errors['nume_copil'] = 'Numele copilului este obligatoriu';
    }
    
    if (empty($data['acord_gdpr']) || $data['acord_gdpr'] !== '1') {
        $errors['acord_gdpr'] = 'Acordul GDPR este obligatoriu';
    }
    
    if (!empty($errors)) {
        echo json_encode([
            'success' => false,
            'message' => 'Vă rugăm să completați câmpurile obligatorii',
            'errors' => $errors
        ]);
        exit;
    }
    
    // Prepare data for storage
    $registration = [
        'id' => time() . '_' . rand(1000, 9999),
        'data_inscriere' => date('Y-m-d H:i:s'),
        'ip_adresa' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'status' => 'nou',
        'data' => $data
    ];
    
    // Save to file (CSV format for easy reading)
    $csv_file = __DIR__ . '/preinscrieri.csv';
    $is_new_file = !file_exists($csv_file);
    
    $csv_data = [
        $registration['id'],
        $registration['data_inscriere'],
        $data['nume_parinte'] ?? '',
        $data['prenume_parinte'] ?? '',
        $data['telefon_parinte'] ?? '',
        $data['email_parinte'] ?? '',
        $data['nume_copil'] ?? '',
        $data['varsta_copil'] ?? '',
        $data['clasa_copil'] ?? '',
        $data['scoala_copil'] ?? '',
        $data['experienta_copil'] ?? '',
        $data['interese_copil'] ?? '',
        $data['observatii'] ?? '',
        $data['acord_gdpr'] ?? '0',
        $data['acord_marketing'] ?? '0',
        $data['acord_foto'] ?? '0',
        $registration['status'],
        $registration['ip_adresa']
    ];
    
    $fp = fopen($csv_file, 'a');
    
    // Add header if new file
    if ($is_new_file) {
        $header = [
            'ID', 'Data Inscriere', 'Nume Parinte', 'Prenume Parinte', 'Telefon', 'Email',
            'Nume Copil', 'Varsta', 'Clasa', 'Scoala', 'Experienta', 'Interese', 
            'Observatii', 'GDPR', 'Marketing', 'Foto', 'Status', 'IP'
        ];
        fputcsv($fp, $header);
    }
    
    fputcsv($fp, $csv_data);
    fclose($fp);
    
    // Also save detailed JSON for backup
    $json_file = __DIR__ . '/preinscrieri.json';
    $all_registrations = [];
    
    if (file_exists($json_file)) {
        $all_registrations = json_decode(file_get_contents($json_file), true) ?: [];
    }
    
    $all_registrations[] = $registration;
    file_put_contents($json_file, json_encode($all_registrations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Preînregistrarea a fost trimisă cu succes! Vă vom contacta în cel mai scurt timp.',
        'data' => [
            'registration_id' => $registration['id'],
            'timestamp' => $registration['data_inscriere']
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'A apărut o eroare la procesarea cererii. Vă rugăm să încercați din nou.'
    ]);
}
?>