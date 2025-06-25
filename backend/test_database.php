<?php
// Test pentru conexiunea la baza de date
// Șterge acest fișier după testare!

require_once 'backend/database.php';

try {
    $db = getDB();
    echo "✅ Conexiunea la baza de date funcționează!<br>";
    
    // Verifică tabelele
    $tables = $db->checkTables();
    echo "📊 Tabele existente: " . implode(', ', $tables) . "<br>";
    
    // Test query simplu
    $result = dbQuery("SELECT COUNT(*) as total FROM preinscrieri");
    $count = $result->fetch();
    echo "📝 Preînscriieri în bază: " . $count['total'] . "<br>";
    
    // Test admin
    $admin = dbSelect('administratori', '*', 'id = ?', [1]);
    if (!empty($admin)) {
        echo "👤 Admin găsit: " . $admin[0]['username'] . "<br>";
    }
    
    echo "<br>🎉 Toate testele au trecut cu succes!";
    
} catch (Exception $e) {
    echo "❌ Eroare: " . $e->getMessage();
}
?>