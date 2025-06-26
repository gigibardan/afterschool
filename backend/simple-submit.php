<?php
// Simple submit handler for testing
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Simple validation - just check if main fields exist
    $errors = [];
    
    if (empty($data['nume_parinte'])) {
        $errors['nume_parinte'] = 'Numele părintelui este obligatoriu';
    }
    
    if (empty($data['email_parinte'])) {
        $errors['email_parinte'] = 'Email-ul este obligatoriu';
    }
    
    if (empty($data['nume_copil'])) {
        $errors['nume_copil'] = 'Numele copilului este obligatoriu';
    }
    
    if (!empty($errors)) {
        echo json_encode([
            'success' => false,
            'message' => 'Vă rugăm să completați câmpurile obligatorii',
            'errors' => $errors
        ]);
        exit;
    }
    
    // Success
    echo json_encode([
        'success' => true,
        'message' => 'Preînregistrarea a fost trimisă cu succes! Vă vom contacta în cel mai scurt timp.'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Eroare de server: ' . $e->getMessage()
    ]);
}
?>