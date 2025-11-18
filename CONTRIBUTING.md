# Contributing to mod_fbg_fabofelanm

Thank you for your interest in contributing to the Felanmälan Joomla module!

## Development Setup

### Prerequisites

- PHP 7.4+ (for Joomla 3.9+) or PHP 8.0+ (for Joomla 4.x)
- Node.js 18+ and npm
- Access to a Joomla test installation
- Access to FAST2 API test credentials

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/falkenberg-kommun/mod_fbg_fabofelanm.git
   cd mod_fbg_fabofelanm
   ```

2. **Install widget dependencies:**
   ```bash
   cd widget-build
   npm install
   ```

3. **Copy React components from felanmalan-mock:**
   Follow the instructions in `widget-build/BUILD.md`

4. **Build the widget:**
   ```bash
   npm run build
   ```

5. **Test in Joomla:**
   - Symlink the module directory to your Joomla installation:
     ```bash
     ln -s /path/to/mod_fbg_fabofelanm /path/to/joomla/modules/mod_fbg_fabofelanm
     ```
   - Install the module in Joomla admin
   - Configure with test credentials

## Code Structure

```
mod_fbg_fabofelanm/
├── lib/                    # PHP libraries (OAuth2, API auth, proxy)
├── tmpl/                   # Joomla templates
├── widget-build/           # React widget source
│   ├── src/               # Widget source code
│   └── public/            # Test files
├── assets/                # Built widget assets (generated)
├── language/              # Joomla language files
├── helper.php             # BFF logic
├── mod_fbg_fabofelanm.php # Module entry point
└── mod_fbg_fabofelanm.xml # Module manifest
```

## Making Changes

### PHP Code

- Follow Joomla coding standards
- Use meaningful variable names
- Add PHPDoc comments for all functions
- Handle errors gracefully with try-catch
- Never expose credentials in error messages

### React Widget

- Use functional components with hooks
- Keep components small and focused
- Use descriptive prop names
- Add comments for complex logic
- Test with standalone test page

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]
```

Examples:
- `feat(widget): add support for multiple file uploads`
- `fix(auth): handle token expiry correctly`
- `docs(readme): update installation instructions`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

## Testing

### Widget Testing

Test the widget standalone:

```bash
cd widget-build
npm run dev
# Open http://localhost:5173/public/
```

### PHP Testing

Test the BFF logic:

1. Install module in Joomla test environment
2. Enable Joomla debug mode
3. Test all API endpoints
4. Check error logs for issues

### Integration Testing

1. Test with logged-in Joomla user
2. Test creating felanmälan
3. Test creating beställning
4. Test file uploads
5. Test confidential work orders
6. Test QR code generation

## Submitting Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Test thoroughly**

4. **Commit:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request:**
   - Go to GitHub
   - Click "New Pull Request"
   - Add description of changes
   - Request review

## Code Review

All changes require code review before merging. Reviewers will check:

- Code quality and style
- Security considerations
- Performance impact
- Documentation updates
- Test coverage

## Security

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email: it@falkenberg.se
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

## Questions?

Contact: it@falkenberg.se
