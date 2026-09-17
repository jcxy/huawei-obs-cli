# huawei-obs-cli — CLI + SKILL

简体中文 | [English](./README.en.md)

> 让你的 AI 编程助手（Claude Code、Cursor、Copilot、Qoder 等）通过自然语言操作华为云对象存储 OBS。

一个工具，两部分：

| 部分 | 作用 |
| --- | --- |
| CLI (`obs-cli`) | 轻量命令行工具，对接华为云 OBS API |
| SKILL (`SKILL.md`) | 一份给 AI 看的"说明书"，教它如何把自然语言转成 CLI 命令 |

AI 读完 skill 后，你只需说一句"把用户导入模版发布到生产"，AI 就会自动列出文件、向你确认、执行 `obs-cli copy dev/... prod/...`。不用记 key，不用开控制台。

## 快速开始

### 1. 安装 CLI

```
npm install -g @cvtoolman/huawei-obs-cli
```

### 2. 配置凭证

```
obs-cli init
```

向导会依次询问 AK、SK、Endpoint、Bucket，一次配好。配置存储在 `~/.obs-cli/config.json`。

### 3. 安装 Skill（给 AI 工具用）

Claude Code:

```
mkdir -p .claude/skills/huawei-obs-cli
curl -o .claude/skills/huawei-obs-cli/SKILL.md \
https://raw.githubusercontent.com/jcxy/huawei-obs-cli/main/skills/huawei-obs-cli/SKILL.md
```

Qoder:

```
mkdir -p .qoder/skills/huawei-obs-cli
curl -o .qoder/skills/huawei-obs-cli/SKILL.md \
https://raw.githubusercontent.com/jcxy/huawei-obs-cli/main/skills/huawei-obs-cli/SKILL.md
```

手动安装（任意 AI 工具）： 将 `skills/huawei-obs-cli/SKILL.md` 复制到对应 AI 工具的 skills 目录下。

### 4. 命令行直接使用（不依赖 AI）

```
# 列出对象（递归）
obs-cli ls dev/

# JSON 输出，管道给 jq
obs-cli --format json ls dev/ | jq .

# 下载（默认存到当前目录）
obs-cli download dev/user-import.xlsx

# 上传（覆盖同名对象）
obs-cli upload user-import.xlsx dev/user-import.xlsx

# 服务端复制（dev → prod 发布，不经本地）
obs-cli copy dev/user-import.xlsx prod/user-import.xlsx

# 删除（无确认提示，谨慎）
obs-cli rm dev/old-template.xlsx
```

## 命令参考

```
obs-cli init                          交互式配置向导（AK/SK/Endpoint/Bucket）
obs-cli config list|set|get|unset     管理配置项
obs-cli ls [prefix]                   列出前缀下对象（递归）
obs-cli download <key> [-o <file>]    下载对象
obs-cli upload <file> <key>           上传本地文件
obs-cli copy <srcKey> <destKey>       服务端复制
obs-cli rm <key>                      删除对象
obs-cli completion <bash|zsh|powershell>  Shell 补全

全局选项（放在子命令之前）：
--format text|json                    输出格式（默认 text：key<TAB>size<TAB>modified）
--bucket <name>                       临时覆盖默认桶
```

## 配置说明

配置存储在 `~/.obs-cli/config.json`（Windows: `%USERPROFILE%\.obs-cli\config.json`）。

| 键 | 必填 | 说明 |
| --- | --- | --- |
| ak | 是 | 华为云 Access Key |
| sk | 是 | 华为云 Secret Key |
| endpoint | 是 | OBS 终端节点，含协议，如 `https://obs.cn-north-4.myhuaweicloud.com` |
| bucket | 否 | 默认桶（可用 `--bucket` 按命令覆盖） |

环境变量优先级高于配置文件：`OBS_AK` / `OBS_SK` / `OBS_ENDPOINT` / `OBS_BUCKET`。

## 安全设计

CLI 本身**不做交互确认**（覆盖、删除直接执行），以便 AI 无人值守调用。安全策略放在 SKILL.md 层：AI 在执行覆盖/删除类操作前，必须先 `ls` 展示现状、向用户明确说明后果并获得确认。详见 [SKILL.md](./skills/huawei-obs-cli/SKILL.md)。

## 开发指南

```
git clone https://github.com/jcxy/huawei-obs-cli.git
cd huawei-obs-cli
npm install
npm run build     # 编译到 dist/
npm test          # 单元测试（mock SDK，不连真实 OBS）
npm run dev -- ls dev/
```

## License

MIT
