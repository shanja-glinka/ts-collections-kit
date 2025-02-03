import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function renameFilesRecursively(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      renameFilesRecursively(fullPath);
    } else if (path.extname(entry) === '.js') {
      const newPath = fullPath.slice(0, -3) + '.cjs';
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${fullPath} -> ${newPath}`);
    }
  }
}

// Получаем __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Проверяет и обновляет require()-вызовы в указанном файле.
 * Если в require() указан относительный путь без расширения и существует файл с .cjs,
 * добавляет расширение.
 */
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Регулярное выражение, которое ищет вызовы require() с относительными путями,
  // начинающимися с "./" или "../"
  const fixedContent = content.replace(/require\((['"])((?:\.\.?\/)[^'"]+)(['"])\)/g, (match, p1, p2, p3) => {
    const candidate = path.join(path.dirname(filePath), p2 + '.cjs');
    if (fs.existsSync(candidate)) {
      return `require(${p1}${p2}.cjs${p3})`;
    }
    return match;
  });

  if (fixedContent !== content) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed require in ${filePath}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (path.extname(entry) === '.cjs') {
      fixFile(fullPath);
    }
  }
}

const cjsDir = path.join(__dirname, 'dist', 'cjs');
renameFilesRecursively(cjsDir);
walkDir(cjsDir);
