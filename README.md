# 老妈看不懂的Readme
# 食堂仓库管理系统
Tauri + React + Django 的小学/中学食堂仓库出入库记录系统。

## 功能

- 小学、中学分类管理
- 入库、出库记录新增
- 按学校类型、记录类型、日期、关键字筛选
- 自动统计库存现存量、入库数量、出库数量
- 支持导出 CSV 和 Excel 记录

## 桌面端启动

首次开发运行先安装依赖：

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd ..\frontend
npm install
```

启动桌面端：

```powershell
cd frontend
npm run tauri:dev
```

打包桌面 EXE：

```powershell
cd frontend
npm run tauri:build
```

生成文件：

```text
frontend\src-tauri\target\release\cims.exe
```

桌面端会自动启动 Django 后端；如果 `127.0.0.1:8000` 已经有后端服务，会直接复用。

## 浏览器调试

需要单独调试前后端时：

```powershell
cd backend
python manage.py runserver 127.0.0.1:8000

cd frontend
npm run dev
```

## 打包为一个软件

```powershell
cd frontend
npm run tauri:bundle
```

这个命令会先把 Django 后端打包成 `backend\dist\cims-backend.exe`，再把它作为桌面软件资源一起打进 Tauri 应用。

桌面端数据库使用软件自己的 SQLite 文件，默认路径在 Windows 用户应用数据目录：

```text
%APPDATA%\CIMS\cims.sqlite3
```

软件启动时会自动执行数据库迁移，不需要手动创建数据库。
