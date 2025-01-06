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

    return result;
  } catch (err) {
    throw new Error(`Error reading directory: ${err}`);
  }
}

module.exports = {
  getDirectoryStructure,
};