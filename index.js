const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const { getDirectoryStructure } = require('./utils/tools');

const app = express();

app.use(express.json());

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

app.use(express.static(imagesDir));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * @param {Sting} directory 目录名
 * @param {Boolean} isRetainName 是否保留文件名
 * @param {Boolean} isDateDir 是否创建日期文件夹
 * @param {Boolean} transWebp 是否转换为Webp格式
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
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|webp|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extName) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

app.get('/getDirList', (req, res) => {
  const list = fs.readdirSync(imagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  list.unshift('/');
  res.json({ list });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { transWebp } = req.body;
    if (transWebp === 'true') {
      const originalFilePath = req.file.path;
      // 获取文件扩展名
      const fileExt = path.extname(originalFilePath).toLowerCase();
      const webpFileName = `${path.basename(req.file.filename, fileExt)}.webp`;
      const webpFilePath = path.join(path.dirname(originalFilePath), webpFileName);

      // 检查文件格式，如果是 WebP 格式则不用转换
      if (fileExt=== '.webp') {
        return res.json({ path: originalFilePath });
      }

      // 转换为 WebP 格式
      await sharp(originalFilePath)
        .rotate() // 自动根据 EXIF 元数据调整方向
        .webp({ quality: 80 }) // 设置 WebP 的质量
        .toFile(webpFilePath);

      // 删除原始文件（可选）
      fs.unlinkSync(originalFilePath);

      res.json({ path: webpFilePath });
    } else {
      res.json({ path: path.basename(req.file.path) });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/getFileListByPath", async (req, res) => {
  try {
    const dir = path.join(imagesDir, req.query.path);
    const list = await getDirectoryStructure(dir);
    res.json({ list });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(3030, () => {
  console.log('Server running at http://localhost:3030');
});
