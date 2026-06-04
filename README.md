# 轻课 MomentClass V6 · Supabase 多人同步版

这是基于 V5 修改的 Supabase 多人同步版。

## 已接入 Supabase

- SUPABASE_URL：https://fjfqmxaklxsfhpicnllk.supabase.co
- 前端使用 Supabase publishable key 连接数据库
- 数据不再存储在浏览器 localStorage 中
- 老师和学生共用同一个数据库

## 使用前必须先初始化数据库

打开 Supabase：

1. 进入你的项目
2. 点击 SQL Editor
3. 新建 New query
4. 粘贴 `schema.sql` 的全部内容
5. 点击 Run

完成后再打开网页。

## 默认账号

教师：
- 姓名：张可
- 工号：T2026001
- 密码：123456

学生：
- 姓名：李静
- 学号：2023123456
- 密码：123456
- 专业班级：2023级新闻班

## 支持功能

教师端：
- 开始上课 / 结束上课
- 发布签到 / 结束签到 / 重置签到
- 创建投票，支持自定义问题和选项
- 查看投票结果
- 随机点名
- 添加、批量导入、删除学生

学生端：
- 登录课堂
- 一键签到
- 参与投票
- 查看是否被点名
- 查看课堂状态

## 部署方式

将本项目上传到 GitHub 后，用 Vercel 部署即可。

注意：Vercel 只负责前端网页，数据同步由 Supabase 负责。
