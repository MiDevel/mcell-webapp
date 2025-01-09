const fs = require('fs');
const path = require('path');

const deployDir = 'deploy';
const filesToCopy = [
    'index.html',
    'favicon.ico'
];

const directoriesToCopy = [
    'assets',
    'data',
    'dist',
    'styles'
];

// Create deploy directory if it doesn't exist
if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir);
}

// Helper function to copy a directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy individual files
for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(deployDir, file));
        console.log(`Copied ${file}`);
    } else {
        console.warn(`Warning: ${file} not found`);
    }
}

// Copy directories
for (const dir of directoriesToCopy) {
    if (fs.existsSync(dir)) {
        copyDir(dir, path.join(deployDir, dir));
        console.log(`Copied directory ${dir}`);
    } else {
        console.warn(`Warning: Directory ${dir} not found`);
    }
}

console.log('\nDeployment files prepared successfully in the "deploy" directory!');
