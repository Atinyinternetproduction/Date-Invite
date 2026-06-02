# Private deploy

## 1. Copy the project to your server

Upload the whole folder to your VPS.

## 2. Create your environment file

Copy `.env.example` to `.env` and fill in:

- `RESEND_API_KEY`
- `TO_EMAIL`
- `FROM_EMAIL`
- `PORT`

## 3. Start the app

```bash
npm start
```

Or with PM2:

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. Put Nginx in front

Use `nginx-date-invite.conf` as a starting point.

Typical steps:

```bash
sudo cp nginx-date-invite.conf /etc/nginx/sites-available/date-invite
sudo ln -s /etc/nginx/sites-available/date-invite /etc/nginx/sites-enabled/date-invite
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Make it less public

Options:

- Use a private random URL
- Add Nginx basic auth
- Only share the link directly

## 6. Add basic auth if you want password protection

Install htpasswd tools and create a password:

```bash
sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd yourname
```

Then inside the `server` block:

```nginx
auth_basic "Private";
auth_basic_user_file /etc/nginx/.htpasswd;
```

Reload nginx after editing:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. HTTPS

If you attach a real domain, use Certbot:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
