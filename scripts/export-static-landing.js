const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const destDir = path.join(srcDir, 'landing-page-feedback');

// Helper to make directory recursively
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy file
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${path.relative(srcDir, src)} -> ${path.relative(srcDir, dest)}`);
}

// Read, replace, and write file
function replaceAndWrite(srcPath, destPath, replacements) {
  let content = fs.readFileSync(srcPath, 'utf8');
  for (const [target, replacement] of replacements) {
    content = content.split(target).join(replacement);
  }
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`Processed & Written: ${path.relative(srcDir, srcPath)} -> ${path.relative(srcDir, destPath)}`);
}

async function main() {
  console.log('Exporting static landing page mockup...');
  
  // Ensure directories
  ensureDir(destDir);
  ensureDir(path.join(destDir, 'css'));
  ensureDir(path.join(destDir, 'js'));
  ensureDir(path.join(destDir, 'images'));

  // Replacements for HTML files to make links and assets relative
  const htmlReplacements = [
    ['href="/css/style.css"', 'href="css/style.css"'],
    ['href="/css/landing.css"', 'href="css/landing.css"'],
    ['src="/js/landing.js"', 'src="js/landing.js"'],
    ['src="/js/api.js"', 'src="js/api.js"'],
    ['src="/images/', 'src="images/'],
    ['href="/login"', 'href="login.html"'],
    ['href="/register"', 'href="register.html"'],
    ['href="/"', 'href="index.html"']
  ];

  // Process HTML files
  replaceAndWrite(path.join(srcDir, 'public', 'index.html'), path.join(destDir, 'index.html'), htmlReplacements);
  replaceAndWrite(path.join(srcDir, 'public', 'login.html'), path.join(destDir, 'login.html'), htmlReplacements);
  replaceAndWrite(path.join(srcDir, 'public', 'register.html'), path.join(destDir, 'register.html'), htmlReplacements);

  // Replacements for CSS files (make image urls relative)
  const cssReplacements = [
    ["url('/images/", "url('../images/"],
    ['url("/images/', 'url("../images/']
  ];

  // Process CSS files
  replaceAndWrite(path.join(srcDir, 'public', 'css', 'style.css'), path.join(destDir, 'css', 'style.css'), cssReplacements);
  replaceAndWrite(path.join(srcDir, 'public', 'css', 'landing.css'), path.join(destDir, 'css', 'landing.css'), cssReplacements);

  // Copy JS files
  copyFile(path.join(srcDir, 'public', 'js', 'landing.js'), path.join(destDir, 'js', 'landing.js'));
  copyFile(path.join(srcDir, 'public', 'js', 'api.js'), path.join(destDir, 'js', 'api.js'));

  // Copy Images
  const imgDir = path.join(srcDir, 'public', 'images');
  if (fs.existsSync(imgDir)) {
    const images = fs.readdirSync(imgDir);
    images.forEach(img => {
      copyFile(path.join(imgDir, img), path.join(destDir, 'images', img));
    });
  }

  console.log('\n🎉 Export Completed! Static mockup is available in the "landing-page-feedback" folder.');
  console.log('You can open "landing-page-feedback/index.html" directly in any browser.');
}

main().catch(err => {
  console.error('Error during static export:', err);
});
