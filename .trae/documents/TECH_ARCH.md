# 电子签名工具 - 技术架构文档

## 1. 项目结构

```
/workspace/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 主应用逻辑
│   ├── signature.js    # 签名画布模块
│   ├── upload.js       # 图片上传模块
│   └── export.js       # 导出模块
└── assets/
    └── icons/          # 图标资源
```

## 2. 核心模块设计

### 2.1 SignaturePad 模块
- **功能**: 签名画布管理
- **API**:
  - `init(canvasElement)` - 初始化画布
  - `clear()` - 清空画布
  - `getImage()` - 获取签名图片
  - `setColor(color)` - 设置颜色
  - `setThickness(thickness)` - 设置笔触粗细

### 2.2 DocumentUpload 模块
- **功能**: 合同图片上传与预览
- **API**:
  - `init(containerElement)` - 初始化上传区域
  - `loadImage(file)` - 加载图片
  - `getImage()` - 获取合同图片
  - `getCanvas()` - 获取画布元素

### 2.3 SignaturePlacer 模块
- **功能**: 签名位置调整
- **API**:
  - `init(documentCanvas, signatureImage)` - 初始化
  - `setPosition(x, y)` - 设置位置
  - `setScale(scale)` - 设置缩放
  - `getComposite()` - 获取合成结果

### 2.4 Exporter 模块
- **功能**: 导出最终图片
- **API**:
  - `init(canvas)` - 初始化
  - `exportImage()` - 导出图片
  - `download()` - 下载图片
  - `share()` - 分享图片

## 3. 页面流程状态

```
STEP 1: sign    - 签名创建
STEP 2: upload  - 合同上传
STEP 3: place   - 位置调整
STEP 4: export  - 导出保存
```

## 4. 触摸交互设计

### 4.1 签名画布
- 单指滑动：绘制签名
- 底部按钮：清空/确认

### 4.2 位置调整
- 单指拖拽：移动签名位置
- 双指捏合：缩放签名大小
- 双指旋转：调整签名角度

## 5. 兼容性考虑

- iOS Safari 13+
- Android Chrome 80+
- 移动端横屏优化
- 触摸事件优先

## 6. 性能优化

- Canvas 离屏渲染
- 签名图片压缩存储
- 懒加载合同图片
- 防抖处理触摸事件
