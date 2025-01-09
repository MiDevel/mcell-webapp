# Contributing to MCell

First off, thank you for considering contributing to MCell!


## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members


## Branching Strategy

This project uses the following branching strategy:

* `main` - Contains the stable production code
* `beta` - Main development branch where all features are integrated and tested
* Feature branches - Individual branches for new features or bug fixes

All development work should be done in feature branches created from `beta`. After testing and review, changes are merged into `beta`. Periodically, after thorough testing, `beta` is promoted to `main` for production releases.


## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible
* Include your environment details (OS, browser version, etc.)


### Suggesting Enhancements

If you have a suggestion for a new feature or enhancement:

* Use a clear and descriptive title
* Provide a detailed description of the proposed functionality
* Explain why this enhancement would be useful to MCell users
* List some examples of how it would be used
* Include mockups or screenshots if applicable


### Pull Requests

1. Fork the repository and create your branch from `beta`:
   ```bash
   git checkout beta
   git checkout -b my-feature-branch
   ```

2. Set up your development environment:
   ```bash
   npm install
   ```

3. Make your changes:
   * Follow the TypeScript coding style
   * Add or update tests as needed
   * Add or update documentation as needed

4. Keep your branch up to date with beta:
   ```bash
   git fetch origin
   git rebase origin/beta
   ```

5. Ensure the test suite passes:
   ```bash
   npm run test
   ```

6. Format your code:
   ```bash
   npm run format
   ```

7. Commit your changes:
   ```bash
   git commit -m 'Add some feature'
   ```

8. Push to your fork:
   ```bash
   git push origin my-feature-branch
   ```

9. Open a Pull Request against the `beta` branch

Note: The `beta` branch is our main development branch. The `main` branch contains the stable production code and is updated periodically from `beta` after thorough testing.


## Development Guidelines

### Code Style

* Use TypeScript for all new code
* Follow the existing code style
* Use meaningful variable and function names
* Add comments for complex logic
* Keep functions focused and concise


### Testing

* Add tests for new features
* Update tests for bug fixes
* Ensure all tests pass before submitting PR


### Documentation

* Update README.md if needed
* Add JSDoc comments for new functions and classes
* Update any relevant documentation


### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Reference issues and pull requests liberally after the first line


## Project Structure

The project follows this structure:
```
mcell-webapp/
├── src/           # TypeScript source code
│   ├── core/      # Essential CA objects and logic
│   ├── dialogs/   # Pop-up dialogs
│   ├── engines/   # Engines for CA families
│   ├── loaders/   # Pattern file handling
│   ├── ui/        # Visual components
│   └── utils/     # Common utilities
├── styles/        # CSS styles
├── data/          # CA patterns and rules
└── assets/        # Static assets
```


## Getting Help

If you need help, you can:
* Open an issue with your question
* Contact the maintainer at info@mcell.ca
* Check the [MCell website](https://mcell.ca) for documentation


## Recognition

Contributors will be added to the Acknowledgments section of the README.md file.

Thank you for contributing to MCell! 🎉
