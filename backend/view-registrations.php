<?php
// Simple page to view registrations
$csv_file = __DIR__ . '/preinscrieri.csv';
$json_file = __DIR__ . '/preinscrieri.json';

if (!file_exists($csv_file)) {
    die('Nu există încă preînscriieri.');
}

$registrations = [];
if (($handle = fopen($csv_file, 'r')) !== FALSE) {
    $header = fgetcsv($handle);
    while (($data = fgetcsv($handle)) !== FALSE) {
        $registrations[] = array_combine($header, $data);
    }
    fclose($handle);
}
?>

<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preînscriieri - TechMinds Academy</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-nou { background-color: #e3f2fd; }
        .status-contactat { background-color: #fff3e0; }
        .status-confirmat { background-color: #e8f5e8; }
        .export-btn { background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Preînscriieri TechMinds Academy Afterschool</h1>
    
    <p><strong>Total preînscriieri:</strong> <?php echo count($registrations); ?></p>
    
    <a href="preinscrieri.csv" class="export-btn" download>📥 Descarcă CSV</a>
    <a href="preinscrieri.json" class="export-btn" download>📥 Descarcă JSON</a>
    
    <?php if (empty($registrations)): ?>
        <p>Nu există preînscriieri încă.</p>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Părinte</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Copil</th>
                    <th>Vârsta</th>
                    <th>Școala</th>
                    <th>Status</th>
                    <th>IP</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($registrations as $reg): ?>
                <tr class="status-<?php echo $reg['Status']; ?>">
                    <td><?php echo htmlspecialchars($reg['ID']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Data Inscriere']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Nume Parinte'] . ' ' . $reg['Prenume Parinte']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Email']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Telefon']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Nume Copil']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Varsta']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Scoala']); ?></td>
                    <td><?php echo htmlspecialchars($reg['Status']); ?></td>
                    <td><?php echo htmlspecialchars($reg['IP']); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
    
    <br><br>
    <a href="../preinscriere.html">← Înapoi la formular</a>
</body>
</html>