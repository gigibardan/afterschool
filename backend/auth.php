<?php
// Admin Authentication Handler
// TechMinds Academy Afterschool Admin Panel

// Security check
define('SECURE_ACCESS', true);

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set content type
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');

// Include dependencies
require_once 'config.php';
require_once 'database.php';

// Response helper function
function sendAuthResponse($success, $message, $data = null, $errorCode = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    
    if ($errorCode !== null) {
        $response['error_code'] = $errorCode;
    }
    
    http_response_code($success ? 200 : 401);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendAuthResponse(false, 'Metodă de cerere nevalidă.', null, 'INVALID_METHOD');
}

// Rate limiting
if (!checkRateLimit($_SERVER['REMOTE_ADDR'])) {
    sendAuthResponse(false, 'Prea multe încercări. Încercați din nou mai târziu.', null, 'RATE_LIMIT_EXCEEDED');
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendAuthResponse(false, 'Date JSON nevalide.', null, 'INVALID_JSON');
    }
    
    $action = $data['action'] ?? 'login';
    
    switch ($action) {
        case 'login':
            handleLogin($data);
            break;
            
        case 'logout':
            handleLogout($data);
            break;
            
        case 'refresh_token':
            handleTokenRefresh($data);
            break;
            
        case 'verify_token':
            handleTokenVerification($data);
            break;
            
        default:
            sendAuthResponse(false, 'Acțiune nevalidă.', null, 'INVALID_ACTION');
    }
    
} catch (Exception $e) {
    debug_log('Auth error: ' . $e->getMessage());
    sendAuthResponse(false, 'Eroare de autentificare.', null, 'AUTH_ERROR');
}

// Login handler
function handleLogin($data) {
    // Validate required fields
    $requiredFields = ['username', 'password'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            sendAuthResponse(false, 'Câmpuri obligatorii lipsă.', null, 'MISSING_FIELDS');
        }
    }
    
    $username = trim($data['username']);
    $password = $data['password'];
    $rememberMe = $data['remember_me'] ?? false;
    $csrfToken = $data['csrf_token'] ?? '';
    
    // Basic validation
    if (strlen($username) < 3 || strlen($password) < 6) {
        sendAuthResponse(false, 'Date de autentificare nevalide.', null, 'INVALID_CREDENTIALS');
    }
    
    // Check for account lockout
    if (isAccountLocked($username)) {
        $lockoutTime = getAccountLockoutTime($username);
        $remainingTime = ceil(($lockoutTime - time()) / 60);
        sendAuthResponse(false, "Cont blocat. Încercați din nou în $remainingTime minute.", null, 'ACCOUNT_LOCKED');
    }
    
    // Security checks
    performSecurityChecks($data);
    
    try {
        $db = getDB();
        
        // Get admin user
        $admin = dbSelect(
            'administratori',
            '*',
            'username = ? AND activ = 1',
            [$username]
        );
        
        if (empty($admin)) {
            incrementFailedAttempts($username);
            sendAuthResponse(false, 'Username sau parolă incorectă.', null, 'INVALID_CREDENTIALS');
        }
        
        $admin = $admin[0];
        
        // Verify password
        if (!password_verify($password, $admin['password_hash'])) {
            incrementFailedAttempts($username);
            sendAuthResponse(false, 'Username sau parolă incorectă.', null, 'INVALID_CREDENTIALS');
        }
        
        // Check if password needs rehashing (security improvement)
        if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            dbUpdate(
                'administratori',
                ['password_hash' => $newHash],
                'id = ?',
                [$admin['id']]
            );
        }
        
        // Clear failed attempts
        clearFailedAttempts($username);
        
        // Generate authentication token
        $token = generateAuthToken();
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
        
        // Store session in database
        $sessionData = [
            'admin_id' => $admin['id'],
            'token_sesiune' => $token,
            'ip_adresa' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'data_expirare' => $expiresAt,
            'activa' => 1
        ];
        
        $sessionId = dbInsert('sesiuni_admin', $sessionData);
        
        if (!$sessionId) {
            sendAuthResponse(false, 'Eroare la crearea sesiunii.', null, 'SESSION_ERROR');
        }
        
        // Update last login
        dbUpdate(
            'administratori',
            ['ultima_logare' => date('Y-m-d H:i:s')],
            'id = ?',
            [$admin['id']]
        );
        
        // Log successful login
        logSecurityEvent('login_success', [
            'admin_id' => $admin['id'],
            'username' => $username,
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
        // Prepare user data (without sensitive info)
        $userData = [
            'id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'nume_complet' => $admin['nume_complet'],
            'ultima_logare' => $admin['ultima_logare']
        ];
        
        // Send success response
        sendAuthResponse(true, 'Autentificare reușită.', [
            'token' => $token,
            'expires_at' => $expiresAt,
            'user' => $userData,
            'redirect' => '../admin/dashboard.html'
        ]);
        
    } catch (Exception $e) {
        debug_log('Login error: ' . $e->getMessage());
        sendAuthResponse(false, 'Eroare de sistem. Încercați din nou.', null, 'SYSTEM_ERROR');
    }
}

// Logout handler
function handleLogout($data) {
    $token = $data['token'] ?? '';
    
    if (empty($token)) {
        sendAuthResponse(false, 'Token lipsă.', null, 'MISSING_TOKEN');
    }
    
    try {
        // Deactivate session
        dbUpdate(
            'sesiuni_admin',
            ['activa' => 0],
            'token_sesiune = ?',
            [$token]
        );
        
        // Log logout
        $session = dbSelect(
            'sesiuni_admin',
            'admin_id',
            'token_sesiune = ?',
            [$token]
        );
        
        if (!empty($session)) {
            logSecurityEvent('logout', [
                'admin_id' => $session[0]['admin_id'],
                'ip' => $_SERVER['REMOTE_ADDR']
            ]);
        }
        
        sendAuthResponse(true, 'Deconectare reușită.');
        
    } catch (Exception $e) {
        debug_log('Logout error: ' . $e->getMessage());
        sendAuthResponse(false, 'Eroare la deconectare.', null, 'LOGOUT_ERROR');
    }
}

// Token refresh handler
function handleTokenRefresh($data) {
    $token = $data['token'] ?? '';
    
    if (empty($token)) {
        sendAuthResponse(false, 'Token lipsă.', null, 'MISSING_TOKEN');
    }
    
    try {
        // Verify current token
        $session = dbSelect(
            'sesiuni_admin s JOIN administratori a ON s.admin_id = a.id',
            's.*, a.username, a.activ',
            's.token_sesiune = ? AND s.activa = 1 AND s.data_expirare > NOW() AND a.activ = 1',
            [$token]
        );
        
        if (empty($session)) {
            sendAuthResponse(false, 'Token invalid sau expirat.', null, 'INVALID_TOKEN');
        }
        
        $session = $session[0];
        
        // Generate new token
        $newToken = generateAuthToken();
        $newExpiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
        
        // Update session
        dbUpdate(
            'sesiuni_admin',
            [
                'token_sesiune' => $newToken,
                'data_expirare' => $newExpiresAt
            ],
            'token_sesiune = ?',
            [$token]
        );
        
        // Log token refresh
        logSecurityEvent('token_refresh', [
            'admin_id' => $session['admin_id'],
            'ip' => $_SERVER['REMOTE_ADDR']
        ]);
        
        sendAuthResponse(true, 'Token actualizat.', [
            'token' => $newToken,
            'expires_at' => $newExpiresAt
        ]);
        
    } catch (Exception $e) {
        debug_log('Token refresh error: ' . $e->getMessage());
        sendAuthResponse(false, 'Eroare la actualizarea token-ului.', null, 'REFRESH_ERROR');
    }
}

// Token verification handler
function handleTokenVerification($data) {
    $token = $data['token'] ?? '';
    
    if (empty($token)) {
        sendAuthResponse(false, 'Token lipsă.', null, 'MISSING_TOKEN');
    }
    
    try {
        $session = verifyAuthToken($token);
        
        if (!$session) {
            sendAuthResponse(false, 'Token invalid.', null, 'INVALID_TOKEN');
        }
        
        sendAuthResponse(true, 'Token valid.', [
            'user' => [
                'id' => $session['admin_id'],
                'username' => $session['username'],
                'nume_complet' => $session['nume_complet']
            ]
        ]);
        
    } catch (Exception $e) {
        debug_log('Token verification error: ' . $e->getMessage());
        sendAuthResponse(false, 'Eroare la verificarea token-ului.', null, 'VERIFICATION_ERROR');
    }
}

// Security functions
function performSecurityChecks($data) {
    // Check for suspicious patterns
    $username = $data['username'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    
    // Check for SQL injection attempts
    $sqlPatterns = [
        '/(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/i',
        '/(\bor\b|\band\b)\s*\d+\s*=\s*\d+/i',
        '/[\'";]/',
        '/(\b|%20)(sleep|benchmark|waitfor)\s*\(/i'
    ];
    
    foreach ($sqlPatterns as $pattern) {
        if (preg_match($pattern, $username)) {
            logSecurityEvent('sql_injection_attempt', [
                'username' => $username,
                'ip' => $ip,
                'user_agent' => $userAgent
            ]);
            sendAuthResponse(false, 'Activitate suspectă detectată.', null, 'SECURITY_VIOLATION');
        }
    }
    
    // Check for automated attacks
    if (empty($userAgent) || strlen($userAgent) < 10) {
        logSecurityEvent('suspicious_user_agent', [
            'user_agent' => $userAgent,
            'ip' => $ip
        ]);
    }
    
    // Check for brute force patterns
    $recentAttempts = getRecentFailedAttempts($ip);
    if ($recentAttempts > 10) {
        logSecurityEvent('brute_force_detected', [
            'ip' => $ip,
            'attempts' => $recentAttempts
        ]);
        sendAuthResponse(false, 'Prea multe încercări de autentificare.', null, 'BRUTE_FORCE_DETECTED');
    }
}

function generateAuthToken() {
    return bin2hex(random_bytes(32));
}

function verifyAuthToken($token) {
    if (empty($token)) {
        return false;
    }
    
    $session = dbSelect(
        'sesiuni_admin s JOIN administratori a ON s.admin_id = a.id',
        's.*, a.username, a.nume_complet, a.email, a.activ',
        's.token_sesiune = ? AND s.activa = 1 AND s.data_expirare > NOW() AND a.activ = 1',
        [$token]
    );
    
    if (empty($session)) {
        return false;
    }
    
    // Update last activity
    dbUpdate(
        'sesiuni_admin',
        ['data_expirare' => date('Y-m-d H:i:s', time() + SESSION_LIFETIME)],
        'token_sesiune = ?',
        [$token]
    );
    
    return $session[0];
}

function incrementFailedAttempts($username) {
    $key = "failed_attempts_" . md5($username . $_SERVER['REMOTE_ADDR']);
    $attempts = (int)($_SESSION[$key] ?? 0) + 1;
    $_SESSION[$key] = $attempts;
    $_SESSION[$key . '_time'] = time();
    
    // Log failed attempt
    logSecurityEvent('login_failed', [
        'username' => $username,
        'ip' => $_SERVER['REMOTE_ADDR'],
        'attempts' => $attempts
    ]);
    
    return $attempts;
}

function clearFailedAttempts($username) {
    $key = "failed_attempts_" . md5($username . $_SERVER['REMOTE_ADDR']);
    unset($_SESSION[$key]);
    unset($_SESSION[$key . '_time']);
}

function getFailedAttempts($username) {
    $key = "failed_attempts_" . md5($username . $_SERVER['REMOTE_ADDR']);
    return (int)($_SESSION[$key] ?? 0);
}

function isAccountLocked($username) {
    $attempts = getFailedAttempts($username);
    if ($attempts < MAX_LOGIN_ATTEMPTS) {
        return false;
    }
    
    $key = "failed_attempts_" . md5($username . $_SERVER['REMOTE_ADDR']) . '_time';
    $lastAttemptTime = $_SESSION[$key] ?? 0;
    
    return (time() - $lastAttemptTime) < LOGIN_LOCKOUT_TIME;
}

function getAccountLockoutTime($username) {
    $key = "failed_attempts_" . md5($username . $_SERVER['REMOTE_ADDR']) . '_time';
    $lastAttemptTime = $_SESSION[$key] ?? 0;
    
    return $lastAttemptTime + LOGIN_LOCKOUT_TIME;
}

function getRecentFailedAttempts($ip) {
    // Count failed attempts from this IP in the last hour
    $oneHourAgo = time() - 3600;
    $attempts = 0;
    
    // Simple implementation using session data
    // In production, use database or Redis for better tracking
    foreach ($_SESSION as $key => $value) {
        if (strpos($key, 'failed_attempts_') === 0 && strpos($key, '_time') !== false) {
            if ($value > $oneHourAgo) {
                $attempts++;
            }
        }
    }
    
    return $attempts;
}

function logSecurityEvent($event, $data) {
    try {
        $logData = [
            'event_type' => $event,
            'event_data' => json_encode($data),
            'ip_adresa' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        // In a full implementation, you'd have a security_logs table
        debug_log("Security Event: $event", $data);
        
        // Also log to file for external monitoring
        $logFile = __DIR__ . '/../logs/security.log';
        $logEntry = date('Y-m-d H:i:s') . " - $event - " . json_encode($data) . "\n";
        
        if (!file_exists(dirname($logFile))) {
            mkdir(dirname($logFile), 0755, true);
        }
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
    } catch (Exception $e) {
        debug_log('Security logging error: ' . $e->getMessage());
    }
}

function checkRateLimit($ip) {
    $rateLimitFile = __DIR__ . '/../logs/rate_limit.json';
    
    if (!file_exists($rateLimitFile)) {
        file_put_contents($rateLimitFile, '{}');
        return true;
    }
    
    $rateData = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    $currentMinute = date('Y-m-d-H-i');
    
    if (!isset($rateData[$ip])) {
        $rateData[$ip] = [];
    }
    
    if (!isset($rateData[$ip][$currentMinute])) {
        $rateData[$ip][$currentMinute] = 0;
    }
    
    // Allow max 10 requests per minute per IP
    if ($rateData[$ip][$currentMinute] >= 10) {
        return false;
    }
    
    $rateData[$ip][$currentMinute]++;
    
    // Clean old data (keep only last 10 minutes)
    foreach ($rateData as $rateIp => $minutes) {
        foreach ($minutes as $minute => $count) {
            if ($minute < date('Y-m-d-H-i', strtotime('-10 minutes'))) {
                unset($rateData[$rateIp][$minute]);
            }
        }
        if (empty($rateData[$rateIp])) {
            unset($rateData[$rateIp]);
        }
    }
    
    file_put_contents($rateLimitFile, json_encode($rateData));
    return true;
}

// Helper function to get bearer token from Authorization header
function getBearerToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

// Middleware function to verify authentication for API calls
function requireAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        sendAuthResponse(false, 'Token de autentificare lipsă.', null, 'NO_TOKEN');
    }
    
    $session = verifyAuthToken($token);
    
    if (!$session) {
        sendAuthResponse(false, 'Token invalid sau expirat.', null, 'INVALID_TOKEN');
    }
    
    return $session;
}

// Clean expired sessions (call this periodically)
function cleanExpiredSessions() {
    try {
        $deleted = dbDelete(
            'sesiuni_admin',
            'data_expirare < NOW() OR activa = 0'
        );
        
        if ($deleted > 0) {
            debug_log("Cleaned $deleted expired sessions");
        }
        
    } catch (Exception $e) {
        debug_log('Session cleanup error: ' . $e->getMessage());
    }
}

// Run cleanup if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    if (isset($_GET['cleanup'])) {
        cleanExpiredSessions();
        echo json_encode(['success' => true, 'message' => 'Cleanup completed']);
    }
}
?>