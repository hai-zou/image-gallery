const path = require('path');
const fs = require('fs');

async function getDirectoryStructure(dirPath) {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = [];

    for (const file of files) {
      if (file.isDirectory()) {
        result.push({
          name: file.name,
          type: 'directory',
        });
      } else {
        result.push({
          name: file.name,
          type: 'file'
        });
      }
    }

    result.sort((a, b) => {
      // 目录排在前面，文件排在后面
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      // 如果都是文件或目录，按名字排序
      return a.name.localeCompare(b.name);  
    });

    return result;
  } catch (err) {
    throw new Error(`Error reading directory: ${err}`);
  }
}

module.exports = {
  getDirectoryStructure,
};