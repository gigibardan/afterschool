<?php
header('Content-Type: application/json; charset=utf-8');

try {
    $csv_file = __DIR__ . '/preinscrieri.csv';
    
    if (!file_exists($csv_file)) {
        echo json_encode([
            'success' => false,
            'message' => 'Nu există preînscriieri încă.'
        ]);
        exit;
    }
    
    $registrations = [];
    if (($handle = fopen($csv_file, 'r')) !== FALSE) {
        $header = fgetcsv($handle);
        while (($data = fgetcsv($handle)) !== FALSE) {
            if (count($data) >= count($header)) {
                $registrations[] = array_combine($header, $data);
            }
        }
        fclose($handle);
    }
    
    // Sort by date (newest first)
    usort($registrations, function($a, $b) {
        return strtotime($b['Data Inscriere']) - strtotime($a['Data Inscriere']);
    });
    
    echo json_encode([
        'success' => true,
        'registrations' => $registrations,
        'total' => count($registrations)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Eroare: ' . $e->getMessage()
    ]);
}
?>