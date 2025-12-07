# Local Email Testing Setup

Since you're having network connectivity issues reaching Brevo and Mailgun APIs, here are alternatives for development:

## Option 1: MailHog (Recommended for Development)

MailHog catches all emails and shows them in a web UI - perfect for testing!

### Install MailHog:

**Windows:**
```powershell
# Download from: https://github.com/mailhog/MailHog/releases
# Or use Chocolatey:
choco install mailhog
```

**Linux/Mac:**
```bash
# Using Go:
go install github.com/mailhog/MailHog@latest

# Or download binary from releases
```

### Run MailHog:
```bash
mailhog
```

Then open http://localhost:8025 to see caught emails!

### Configure Your App:

Add to `.env`:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@prashiskshan.local
```

## Option 2: Ethereal Email (Online Testing)

Ethereal creates temporary test email accounts - no installation needed!

### Get Test Account:

```bash
node backend/setup-ethereal.js
```

This will create a test account and show you the credentials.

## Option 3: Gmail SMTP (Real Emails)

Use Gmail to send real emails during development.

### Setup:

1. Enable 2-Factor Authentication on your Gmail
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=your.email@gmail.com
```

## Option 4: Fix Network Issues

### Check Connectivity:

```bash
# Test Brevo API
curl https://api.brevo.com/v3/account

# Test Mailgun API  
curl https://api.mailgun.net

# Test DNS resolution
nslookup api.brevo.com
nslookup api.mailgun.net
```

### Common Network Issues:

1. **Corporate Firewall**: Ask IT to whitelist:
   - api.brevo.com
   - api.mailgun.net

2. **Antivirus/Firewall**: Temporarily disable to test

3. **VPN**: Try disconnecting VPN

4. **DNS Issues**: Try using Google DNS (8.8.8.8)

5. **Proxy**: Configure proxy in `.env`:
   ```env
   HTTP_PROXY=http://proxy:8080
   HTTPS_PROXY=http://proxy:8080
   ```

## Recommended for Your Situation:

Since you have network issues, I recommend **MailHog** for development:

1. Install MailHog
2. Run `mailhog` in a terminal
3. Open http://localhost:8025
4. All emails will appear there instantly!

No internet connection needed, perfect for development!
