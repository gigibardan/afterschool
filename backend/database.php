<?php
// Clasa pentru gestionarea conexiunii la baza de date
// TechMinds Academy Afterschool

define('SECURE_ACCESS', true);
require_once 'config.php';

class Database {
    private $connection;
    private static $instance = null;
    
    private function __construct() {
        $this->connect();
    }
    
    // Singleton pattern pentru o singură conexiune
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            debug_log('Conexiune la baza de date realizată cu succes');
            
        } catch (PDOException $e) {
            debug_log('Eroare conectare baza de date: ' . $e->getMessage());
            throw new Exception('Eroare la conectarea la baza de date');
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Metodă pentru query-uri simple
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            debug_log('Eroare query: ' . $e->getMessage(), ['sql' => $sql, 'params' => $params]);
            throw new Exception('Eroare la executarea query-ului');
        }
    }
    
    // Inserare cu returnarea ID-ului
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($data);
            return $this->connection->lastInsertId();
        } catch (PDOException $e) {
            debug_log('Eroare insert: ' . $e->getMessage(), ['table' => $table, 'data' => $data]);
            throw new Exception('Eroare la inserarea datelor');
        }
    }
    
    // Update cu condiții
    public function update($table, $data, $where, $whereParams = []) {
        $setClause = [];
        foreach (array_keys($data) as $key) {
            $setClause[] = "{$key} = :{$key}";
        }
        $setClause = implode(', ', $setClause);
        
        $sql = "UPDATE {$table} SET {$setClause} WHERE {$where}";
        $params = array_merge($data, $whereParams);
        
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            debug_log('Eroare update: ' . $e->getMessage(), ['table' => $table, 'data' => $data]);
            throw new Exception('Eroare la actualizarea datelor');
        }
    }
    
    // Ștergere cu condiții
    public function delete($table, $where, $whereParams = []) {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($whereParams);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            debug_log('Eroare delete: ' . $e->getMessage(), ['table' => $table, 'where' => $where]);
            throw new Exception('Eroare la ștergerea datelor');
        }
    }
    
    // Selectare cu condiții
    public function select($table, $columns = '*', $where = '', $whereParams = [], $orderBy = '', $limit = '') {
        $sql = "SELECT {$columns} FROM {$table}";
        
        if (!empty($where)) {
            $sql .= " WHERE {$where}";
        }
        
        if (!empty($orderBy)) {
            $sql .= " ORDER BY {$orderBy}";
        }
        
        if (!empty($limit)) {
            $sql .= " LIMIT {$limit}";
        }
        
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($whereParams);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            debug_log('Eroare select: ' . $e->getMessage(), ['sql' => $sql]);
            throw new Exception('Eroare la citirea datelor');
        }
    }
    
    // Verifică dacă tabelele există (pentru setup)
    public function checkTables() {
        $tables = ['preinscrieri', 'administratori', 'sesiuni_admin'];
        $existingTables = [];
        
        foreach ($tables as $table) {
            $result = $this->query("SHOW TABLES LIKE ?", [$table]);
            if ($result->rowCount() > 0) {
                $existingTables[] = $table;
            }
        }
        
        return $existingTables;
    }
    
    // Închide conexiunea
    public function close() {
        $this->connection = null;
    }
    
    // Dezactivez clonarea (Singleton)
    private function __clone() {}
    
    // Dezactivez unserialize (Singleton)
    public function __wakeup() {
        throw new Exception("Nu se poate deserializa singleton");
    }
}

// Funcții helper pentru acces rapid
function getDB() {
    return Database::getInstance();
}

function dbQuery($sql, $params = []) {
    return Database::getInstance()->query($sql, $params);
}

function dbInsert($table, $data) {
    return Database::getInstance()->insert($table, $data);
}

function dbUpdate($table, $data, $where, $whereParams = []) {
    return Database::getInstance()->update($table, $data, $where, $whereParams);
}

function dbDelete($table, $where, $whereParams = []) {
    return Database::getInstance()->delete($table, $where, $whereParams);
}

function dbSelect($table, $columns = '*', $where = '', $whereParams = [], $orderBy = '', $limit = '') {
    return Database::getInstance()->select($table, $columns, $where, $whereParams, $orderBy, $limit);
}

?>