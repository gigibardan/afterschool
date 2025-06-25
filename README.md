# TechMinds Academy - Afterschool

Sistem de preînscrieri pentru programul afterschool al TechMinds Academy.

## Structura proiectului

```
afterschool.techminds-academy.ro/
├── index.html                 # Pagina principală
├── preinscriere.html          # Formularul de preînscriere
├── admin/                     # Panoul de administrare
│   ├── login.html            # Login admin
│   ├── dashboard.html        # Dashboard principal
│   ├── preinscrieri.html     # Gestionare preînscriieri
│   └── admin.css             # Stiluri pentru admin
├── backend/                   # Logica server-side (PHP)
│   ├── config.php            # Configurație bază de date
│   ├── submit.php            # Procesare formular
│   ├── admin_functions.php   # Funcții admin (CRUD)
│   ├── auth.php              # Autentificare
│   └── database.php          # Conectare DB
├── assets/                    # Resurse statice
│   ├── css/                  # Stiluri CSS
│   ├── js/                   # JavaScript
│   └── images/               # Imagini
├── database/                  # SQL și migrări
│   └── setup.sql             # Structura bazei de date
└── .htaccess                 # Configurație Apache
```

## Funcționalități

- **Formular preînscriere**: Colectare date părinte + copil
- **Panel admin**: Gestionare preînscriieri (CRUD)
- **Securitate**: Validări, autentificare, protecție CSRF
- **Responsive design**: Funcționează pe toate dispozitivele

## Setup inițial

1. Configurează baza de date în cPanel
2. Editează `backend/config.php` cu datele tale
3. Rulează `database/setup.sql` în phpMyAdmin
4. Setează credențialele admin

## Tehnologii

- Frontend: HTML5, CSS3, JavaScript
- Backend: PHP 7.4+
- Bază de date: MySQL
- Server: Apache (cPanel)

---
© 2025 TechMinds Academy