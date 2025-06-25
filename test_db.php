<?php
// Test simplu pentru conexiunea la baza de date
require_once 'backend/config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "‚úÖ Conexiunea la baza de date func»õioneazƒÉ!<br>";
    echo "Ì≥ä Host: " . DB_HOST . "<br>";
    echo "ÔøΩÔøΩÔ∏è Database: " . DB_NAME . "<br>";
    echo "Ì±§ User: " . DB_USER . "<br>";
    
    // Test query
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "ÔøΩÔøΩ Tabele: " . implode(', ', $tables) . "<br>";
    
} catch (PDOException $e) {
    echo "‚ùå Eroare conexiune: " . $e->getMessage();
}
?>
