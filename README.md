# WorldBox 地图创建器

一个静态网页工具，用于从图片生成 WorldBox 游戏地图存档文件。

## 功能

- 上传图片文件（每个像素对应一个 tile）
- 上传 Excel 颜色映射表（可选，默认使用 `default.xlsx`）
- 自动生成符合 WorldBox 格式的 `.wbox` 存档文件
- 支持拖放上传
- 实时处理进度显示

## 使用方法

1. 打开 `index.html` 文件（建议使用现代浏览器，如 Chrome、Firefox、Edge）

2. 上传图片文件
   - 点击上传区域或拖放图片文件
   - 图片的每个像素将映射到一个 tile 类型

3. （可选）上传 Excel 文件
   - 如果不提供，将使用默认的 `default.xlsx`
   - Excel 格式：第一列为 tile 类型，第二列为对应的颜色（16进制）

4. 点击"生成地图存档"按钮

5. 等待处理完成，自动下载生成的 `.wbox` 文件

## Excel 文件格式

Excel 文件应包含两列：

| Tile 类型 | 颜色 |
|-----------|------|
| deep_ocean | 3370CC |
| close_ocean | 4084E2 |
| sand | F7E898 |
| ... | ... |

- 第一列：tile 类型（字符串）
- 第二列：颜色值（16进制字符串或数字，如 `3370CC` 或 `3370CC`）

## 技术说明

- 使用 Canvas API 读取图片像素
- 使用 SheetJS 解析 Excel 文件
- 使用 RLE 压缩算法优化存档大小
- 使用 pako 进行 zlib 压缩生成 `.wbox` 格式

## 文件结构

```
static_wb_map_creator/
├── index.html          # 主页面
├── default.xlsx        # 默认颜色映射表
├── js/
│   ├── main.js        # 主逻辑
│   ├── imageProcessor.js  # 图片处理
│   ├── excelParser.js     # Excel解析
│   └── saveGenerator.js   # 存档生成
├── lib/               # 第三方库
│   ├── xlsx.min.js    # Excel处理库 (SheetJS)
│   └── pako.min.js    # zlib压缩库
└── README.md
```

## 注意事项

- 确保 `default.xlsx` 文件与 `index.html` 在同一目录
- 图片尺寸会影响生成时间，建议使用合理大小的图片
- 如果图片中包含 Excel 映射表中没有的颜色，将使用默认的 `soil_low` tile 类型
- 生成的存档文件需要手动复制到 WorldBox 的存档目录

## 浏览器兼容性

- Chrome/Edge (推荐)
- Firefox
- Safari
- 不支持 IE

