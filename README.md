# PhysioHub Research Platform

Advanced physical therapy research platform with multi-source literature aggregation, AI-powered analysis, and PubMed integration.

## Features

- **AI-Powered Analysis**: Advanced AI analyzes research papers to extract key findings, limitations, and clinical relevance
- **PubMed Integration**: Seamless search and import from PubMed with automated metadata extraction
- **Smart Comparisons**: Compare multiple studies with AI-generated insights
- **Quality Assessment**: Automated quality scoring and risk of bias assessment
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Production Ready**: Optimized for Ubuntu server deployment with Docker support

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm
- PostgreSQL (optional, for production)
- Redis (optional, for caching)

### Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-org/physiohub-research.git
   cd physiohub-research
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   \`\`\`

4. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Required for AI features
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Database (for production)
DATABASE_URL=postgresql://username:password@localhost:5432/physiohub

# Optional: Redis (for caching)
REDIS_URL=redis://localhost:6379

# Optional: PubMed API
PUBMED_EMAIL=your_email@domain.com

# Production settings
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com/api
\`\`\`

## Project Structure

\`\`\`
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   ├── upload/            # File upload page
│   │   ├── library/           # Research library
│   │   └── pubmed/            # PubMed search
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/ui components
│   │   └── custom/           # Custom components
│   ├── services/             # Business logic services
│   │   ├── ai/               # AI service integration
│   │   ├── pubmed/           # PubMed API client
│   │   └── file-processing/  # PDF processing
│   ├── lib/                  # Utilities and helpers
│   ├── config/               # Configuration files
│   └── types/                # TypeScript type definitions
├── deploy/                   # Deployment scripts
├── scripts/                  # Database and utility scripts
└── docs/                     # Documentation
\`\`\`

## API Endpoints

### Analysis
- `POST /api/analyze` - Analyze uploaded research papers
- `GET /api/ai/status` - Check AI service status

### PubMed Integration
- `GET /api/pubmed/search` - Basic PubMed search
- `GET /api/pubmed/enhanced-search` - Advanced search with filters
- `GET /api/pubmed/trending` - Get trending articles
- `GET /api/pubmed/domains` - Domain-specific searches

### Research Management
- `GET /api/research/articles` - Get saved articles
- `POST /api/research/articles` - Save article
- `DELETE /api/research/articles/:id` - Delete article

## Deployment

### Ubuntu Server Deployment

1. **Run the setup script**
   \`\`\`bash
   chmod +x deploy/ubuntu-setup.sh
   ./deploy/ubuntu-setup.sh
   \`\`\`

2. **Deploy the application**
   \`\`\`bash
   chmod +x deploy/deploy.sh
   ./deploy/deploy.sh
   \`\`\`

3. **Configure SSL (optional)**
   \`\`\`bash
   chmod +x deploy/ssl-setup.sh
   ./deploy/ssl-setup.sh your-domain.com
   \`\`\`

### Docker Deployment

1. **Build the image**
   \`\`\`bash
   docker build -t physiohub-research .
   \`\`\`

2. **Run the container**
   \`\`\`bash
   docker run -p 3000:3000 --env-file .env physiohub-research
   \`\`\`

### PM2 Deployment

1. **Install PM2**
   \`\`\`bash
   npm install -g pm2
   \`\`\`

2. **Start the application**
   \`\`\`bash
   npm run pm2:start
   \`\`\`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript checks
- `npm run test` - Run tests
- `npm run analyze` - Analyze bundle size

### Code Quality

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Husky** for git hooks (optional)

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Follow the existing code patterns and structure
3. Add tests for new functionality
4. Update documentation as needed
5. Submit pull request

## Architecture

### Service Layer Architecture

The application follows a service-oriented architecture:

- **AI Service**: Handles LLM interactions with fallback mechanisms
- **PubMed Service**: Manages PubMed API integration with rate limiting
- **File Processing Service**: Handles PDF parsing and text extraction
- **Cache Service**: Provides in-memory caching for performance

### Error Handling

Comprehensive error handling with:
- Custom error classes for different error types
- Centralized error handling in API routes
- Proper HTTP status codes and error messages
- Logging for debugging and monitoring

### Performance Optimizations

- **Caching**: In-memory caching for API responses
- **Rate Limiting**: Prevents API abuse and quota exhaustion
- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: Next.js image optimization
- **Compression**: Gzip compression for static assets

## Monitoring

### Health Checks

- Application health: `GET /api/health`
- AI service status: `GET /api/ai/status`

### Logging

Logs are stored in:
- Development: Console output
- Production: `/var/log/physiohub/`

### Monitoring Commands

\`\`\`bash
# View system stats
physiohub-stats

# Monitor PM2 processes
pm2 monit

# View application logs
tail -f /var/log/physiohub/out.log

# View error logs
tail -f /var/log/physiohub/err.log
\`\`\`

## Troubleshooting

### Common Issues

1. **AI Service Not Working**
   - Check API keys in environment variables
   - Verify API key permissions and quotas
   - Check service status: `curl http://localhost:3000/api/ai/status`

2. **PubMed Search Failing**
   - Check internet connectivity
   - Verify PubMed API is accessible
   - Check rate limiting logs

3. **File Upload Issues**
   - Verify file size limits (10MB default)
   - Check file type restrictions (PDF only)
   - Ensure sufficient disk space

4. **Build Failures**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

### Performance Issues

1. **Slow Response Times**
   - Check AI service response times
   - Monitor database query performance
   - Review cache hit rates

2. **High Memory Usage**
   - Monitor PM2 memory usage: `pm2 monit`
   - Check for memory leaks in logs
   - Restart application: `pm2 restart physiohub-research`

### Getting Help

1. Check the logs for error messages
2. Review the troubleshooting section
3. Search existing issues on GitHub
4. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Log excerpts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the troubleshooting guide

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
