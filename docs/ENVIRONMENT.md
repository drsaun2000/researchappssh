# Environment Variables

This document describes all environment variables used by the PhysioHub Research Platform.

## Required Variables

### AI Services

#### ANTHROPIC_API_KEY
- **Description**: API key for Anthropic Claude models
- **Required**: No (but recommended for best performance)
- **Example**: `sk-ant-api03-...`
- **Where to get**: [Anthropic Console](https://console.anthropic.com/)

#### OPENAI_API_KEY
- **Description**: API key for OpenAI GPT models
- **Required**: No (fallback if Anthropic not available)
- **Example**: `sk-proj-...`
- **Where to get**: [OpenAI Platform](https://platform.openai.com/api-keys)

**Note**: At least one AI service API key is required for analysis features.

## Optional Variables

### Application Configuration

#### NODE_ENV
- **Description**: Application environment
- **Default**: `development`
- **Options**: `development`, `production`, `test`
- **Example**: `NODE_ENV=production`

#### PORT
- **Description**: Port for the application server
- **Default**: `3000`
- **Example**: `PORT=8080`

#### NEXT_PUBLIC_API_URL
- **Description**: Public API URL for client-side requests
- **Default**: `/api` (relative)
- **Example**: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

### Database Configuration

#### DATABASE_URL
- **Description**: PostgreSQL database connection string
- **Required**: No (uses in-memory storage if not provided)
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `DATABASE_URL=postgresql://user:pass@localhost:5432/physiohub`

#### REDIS_URL
- **Description**: Redis connection string for caching
- **Required**: No (uses in-memory cache if not provided)
- **Format**: `redis://host:port` or `redis://username:password@host:port`
- **Example**: `REDIS_URL=redis://localhost:6379`

### PubMed Configuration

#### PUBMED_EMAIL
- **Description**: Email address for PubMed API requests (recommended)
- **Required**: No
- **Example**: `PUBMED_EMAIL=research@yourdomain.com`
- **Note**: Helps with rate limiting and API access

#### PUBMED_API_KEY
- **Description**: PubMed API key for higher rate limits
- **Required**: No
- **Example**: `PUBMED_API_KEY=your_ncbi_api_key`
- **Where to get**: [NCBI Account Settings](https://www.ncbi.nlm.nih.gov/account/settings/)

### Security Configuration

#### JWT_SECRET
- **Description**: Secret key for JWT token signing
- **Required**: No (not currently used)
- **Example**: `JWT_SECRET=your-super-secret-key-here`
- **Note**: Generate with `openssl rand -base64 32`

#### ENCRYPTION_KEY
- **Description**: Key for encrypting sensitive data
- **Required**: No
- **Example**: `ENCRYPTION_KEY=32-character-hex-string`
- **Note**: Generate with `openssl rand -hex 16`

### External Services

#### SMTP_HOST
- **Description**: SMTP server hostname for email notifications
- **Required**: No
- **Example**: `SMTP_HOST=smtp.gmail.com`

#### SMTP_PORT
- **Description**: SMTP server port
- **Default**: `587`
- **Example**: `SMTP_PORT=465`

#### SMTP_USER
- **Description**: SMTP username
- **Required**: No
- **Example**: `SMTP_USER=your-email@gmail.com`

#### SMTP_PASS
- **Description**: SMTP password or app password
- **Required**: No
- **Example**: `SMTP_PASS=your-app-password`

### Analytics and Monitoring

#### GOOGLE_ANALYTICS_ID
- **Description**: Google Analytics tracking ID
- **Required**: No
- **Example**: `GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX`

#### SENTRY_DSN
- **Description**: Sentry DSN for error tracking
- **Required**: No
- **Example**: `SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx`

### Feature Flags

#### ENABLE_ANALYTICS
- **Description**: Enable analytics tracking
- **Default**: `false` in development, `true` in production
- **Options**: `true`, `false`
- **Example**: `ENABLE_ANALYTICS=true`

#### ENABLE_CACHING
- **Description**: Enable response caching
- **Default**: `true`
- **Options**: `true`, `false`
- **Example**: `ENABLE_CACHING=false`

#### ENABLE_RATE_LIMITING
- **Description**: Enable API rate limiting
- **Default**: `true`
- **Options**: `true`, `false`
- **Example**: `ENABLE_RATE_LIMITING=false`

#### ENABLE_COMPRESSION
- **Description**: Enable response compression
- **Default**: `true`
- **Options**: `true`, `false`
- **Example**: `ENABLE_COMPRESSION=true`

### Development and Testing

#### ANALYZE
- **Description**: Enable bundle analysis
- **Default**: `false`
- **Options**: `true`, `false`
- **Example**: `ANALYZE=true npm run build`

#### DEBUG
- **Description**: Enable debug logging
- **Default**: `false`
- **Options**: `true`, `false`
- **Example**: `DEBUG=true`

#### MOCK_AI_RESPONSES
- **Description**: Use mock AI responses for testing
- **Default**: `false`
- **Options**: `true`, `false`
- **Example**: `MOCK_AI_RESPONSES=true`

## Environment Files

### Development (.env.local)
\`\`\`env
# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here

# Development settings
NODE_ENV=development
DEBUG=true
ENABLE_ANALYTICS=false

# Optional services
PUBMED_EMAIL=dev@yourdomain.com
\`\`\`

### Production (.env)
\`\`\`env
# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-your-production-key
OPENAI_API_KEY=sk-proj-your-production-key

# Production settings
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/physiohub
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
ENABLE_ANALYTICS=true

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
\`\`\`

### Testing (.env.test)
\`\`\`env
NODE_ENV=test
MOCK_AI_RESPONSES=true
ENABLE_RATE_LIMITING=false
ENABLE_ANALYTICS=false
DATABASE_URL=postgresql://test:test@localhost:5432/physiohub_test
\`\`\`

## Environment Setup

### Local Development

1. Copy the example file:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Edit `.env.local` with your values:
   \`\`\`bash
   nano .env.local
   \`\`\`

3. Restart the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

### Production Deployment

1. Create production environment file:
   \`\`\`bash
   sudo nano /var/www/physiohub/.env
   \`\`\`

2. Set secure file permissions:
   \`\`\`bash
   sudo chmod 600 /var/www/physiohub/.env
   sudo chown physiohub:physiohub /var/www/physiohub/.env
   \`\`\`

3. Restart the application:
   \`\`\`bash
   pm2 restart physiohub-research
   \`\`\`

### Docker Deployment

Create a `.env` file for Docker:
\`\`\`bash
# Create environment file
cat > .env &lt;&lt; EOF
NODE_ENV=production
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
EOF

# Run with environment file
docker run --env-file .env -p 3000:3000 physiohub-research
\`\`\`

## Security Best Practices

1. **Never commit environment files** to version control
2. **Use different keys** for development and production
3. **Rotate API keys** regularly
4. **Set restrictive file permissions** (600) on production
5. **Use secrets management** for production deployments
6. **Monitor API usage** to detect unauthorized access

## Validation

The application validates environment variables on startup:

- **Required variables**: Application will fail to start if missing
- **Format validation**: URLs, email addresses, and keys are validated
- **Warning messages**: Displayed for missing optional variables

## Troubleshooting

### Common Issues

1. **AI features not working**
   - Check if at least one AI API key is set
   - Verify API key format and validity
   - Check API quotas and billing

2. **PubMed search failing**
   - Verify internet connectivity
   - Check if PUBMED_EMAIL is set (recommended)
   - Monitor rate limiting

3. **Database connection errors**
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure database exists and user has permissions

4. **Environment not loading**
   - Check file permissions
   - Verify file location (.env.local for development)
   - Restart the application after changes

### Debug Environment

To debug environment variable loading:

\`\`\`bash
# Check loaded environment
npm run dev -- --inspect-env

# Or add to your code temporarily
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  // Don't log actual keys!
});
\`\`\`

## Migration Guide

### From v1.0 to v1.1

- `AI_API_KEY` renamed to `OPENAI_API_KEY`
- Added `ANTHROPIC_API_KEY` (recommended)
- `PUBMED_KEY` renamed to `PUBMED_API_KEY`

### From v1.1 to v1.2

- Added feature flags (`ENABLE_*` variables)
- Added monitoring variables (`SENTRY_DSN`, etc.)
- Deprecated `DISABLE_CACHE` (use `ENABLE_CACHING=false`)

Update your environment files accordingly when upgrading.
