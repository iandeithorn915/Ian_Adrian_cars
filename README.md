# Ian & Adrian Car Cleaning — PHP + MySQL backend

This project keeps your current front end, but moves bookings and admin scheduling data into MySQL so it works from any device.

## What is included
- `public/index.php` — public website with chatbot booking flow
- `public/admin.php` — private admin page
- `public/api/*.php` — backend endpoints
- `includes/*.php` — shared PHP/bootstrap code
- `schema.sql` — MySQL tables
- `config.sample.php` — copy to `config.php` and fill in your DB credentials

## Setup
1. Copy `config.sample.php` to `config.php`
2. Create a MySQL database, for example `carcleaning`
3. Import `schema.sql`
4. Point your PHP web root to the `public/` folder
5. Open `index.php` for customers and `admin.php` for yourself

## Default admin login
- Password: `admin123`
- Change it right away in the admin page

## Notes
- Bookings now save in MySQL, not browser local storage
- Confirmed bookings remove the time slot for everyone
- Admin changes apply everywhere the site is loaded
- EmailJS is still used for notification emails on the front end. For production, moving email sending to PHP/server-side would be better.

## Good hosting choices
Use shared hosting or VPS hosting that supports:
- PHP 8.1+
- MySQL / MariaDB
- HTTPS / SSL
- custom domains

Examples: SiteGround, Hostinger, Namecheap shared hosting, or a VPS like DigitalOcean.

## Domain flow
1. Buy your domain from any registrar
2. Add hosting
3. Point the domain DNS to your host
4. Upload this project
5. Set your document root to the `public/` folder
6. Enable SSL so the site runs on `https://`

## Security note
This is much better than local storage, but for a business site you should still eventually add:
- CSRF protection
- rate limiting / CAPTCHA
- server-side email sending
- stronger admin auth and hidden admin URL
