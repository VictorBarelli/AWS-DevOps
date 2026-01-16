# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- ✅ ESLint configuration for code quality
- ✅ Prettier for consistent code formatting
- ✅ Vitest testing framework with initial tests
- ✅ CI workflow for automated validation
- ✅ Environment variable management (.env.example)
- ✅ Dependabot for automated dependency updates
- ✅ GitHub Actions badges in README
- ✅ Smoke tests in deployment workflows
- ✅ Build validation and artifact storage
- ✅ Improved cache control for S3 assets

### Changed
- 🔒 Moved API keys from hardcoded to environment variables (SECURITY FIX)
- 🚀 Enhanced deployment workflows with validation steps
- 📝 Updated README with detailed installation instructions

### Security
- 🔴 Fixed exposed Supabase credentials
- 🔴 Fixed exposed RAWG API key
- 🔒 Implemented proper environment variable handling

## [1.0.0] - Previous Release

### Added
- Initial release with React + Vite
- AWS infrastructure with Terraform
- S3 + CloudFront hosting
- CloudWatch monitoring
- GitHub Actions CI/CD
- Supabase authentication
- RAWG API integration
