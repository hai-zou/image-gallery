const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');

const app = express();

app.use(express.json());

const imagesDir = path.join(__dirname, 'images');

app.use(express.static(imagesDir));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * @param {Sting} directory 目录名
 * @param {Boolean} isRetainName 是否保留文件名
 * @param {Boolean} isDateDir 是否创建日期文件夹
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { directory, isDateDir } = req.body;
    let subDirName = path.join(imagesDir, directory);
    let dateDirName = '';

    if (isDateDir === 'true') {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      dateDirName = `${year}${month}${day}`;
    }
    const dir = path.join(subDirName, dateDirName);

    // 如果目录不存在，则创建
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { isRetainName } = req.body;
    let fileName = file.originalname;
    if (isRetainName === 'false') {
      fileName = `${nanoid(10)}${path.extname(file.originalname)}`;
    }
    cb(null, fileName);
  }
});
const upload = multer({ storage });

app.get('/getDirList', (req, res) => {
  const list = fs.readdirSync(imagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  list.unshift('/');
  res.json({ list });
});

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ path: path.basename(req.file.path) });
});

app.listen(3030, () => {
  console.log('Server running at http://localhost:3030');
});
