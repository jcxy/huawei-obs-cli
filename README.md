# huawei-obs-cli

[![CI](https://github.com/jcxy/huawei-obs-cli/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jcxy/huawei-obs-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@cvtoolman/huawei-obs-cli)](https://www.npmjs.com/package/@cvtoolman/huawei-obs-cli)
[![node](https://img.shields.io/node/v/@cvtoolman/huawei-obs-cli)](package.json)
[![license](https://img.shields.io/github/license/jcxy/huawei-obs-cli)](LICENSE)

用命令行操作华为云 OBS：列对象、查对象、上传、下载、服务端复制、删除。

这个 CLI 刻意**不做交互确认**，把"要不要确认"留给调用它的 AI 助手；配套的 Agent Skill
只讲命令怎么用，不讲业务流程。结果是一个足够薄、可以被无人值守调用、又不会误删东西的工具。

## 30 秒看懂它解决什么问题

AI 助手手里的 shell 能跑 `rm`，但它不知道 OBS 上那个 key 到底存不存在、这一下会覆盖什么。
所以 `obs-cli` 提供了两个“先看清再动手”的原语：先用 `stat` 确认 key 是否存在（不存在时退出码 1），
再用 `--dry-run` 预演这一下会动什么。

下面这段是真实执行结果（假凭证，未连接任何桶）：

```console
$ obs-cli upload --dry-run user-import.xlsx dev/user-import.xlsx
Would upload user-import.xlsx -> dev/user-import.xlsx

$ obs-cli --format json rm --dry-run dev/a.xlsx
{"dryRun":true,"action":"delete","key":"dev/a.xlsx"}
```

拿到这个输出，助手才可以向你复述"我要覆盖/删除哪个对象"，再真正执行。
CLI 自己永远不会停下来问你 —— 但它给了助手问你的全部依据。

## 安装

```bash
npm install -g @cvtoolman/huawei-obs-cli
```

配置凭证（交互式向导，依次询问 AK / SK / Endpoint / Bucket）：

```bash
obs-cli init
```

配置写在 `~/.obs-cli/config.json`（Windows: `%USERPROFILE%\.obs-cli\config.json`）。

## 给 AI 助手装上 Skill

```bash
npx skills add jcxy/huawei-obs-cli
```

装完重启会话，然后直接说人话：

> 把 dev 下的用户导入模板发到生产

助手会 `stat` 目标 key、用 `--dry-run` 预演、把要覆盖的内容念给你确认，最后才执行 `copy`。
Skill 本身只有一份命令速查、输出契约和一条安全规则，没有业务剧本。

## 命令

```
obs-cli init                             交互式配置向导（AK / SK / Endpoint / Bucket）
obs-cli config list|set|get|unset        管理配置项
obs-cli ls [prefix]                      列出前缀下对象（递归）
obs-cli stat <key>                       查询单个对象的 size / etag / last-modified
obs-cli download <key> [-o <file>]       下载对象（默认存到当前目录）
obs-cli upload <file> <key> [--dry-run]  上传本地文件
obs-cli copy <srcKey> <destKey> [--dry-run]  服务端复制（不经本地）
obs-cli rm <key> [--dry-run]             删除对象（不可逆）
obs-cli completion <bash|zsh|powershell> Shell 补全
```

全局选项（放在子命令之前）：

```
--format text|json    输出格式，默认 text
--bucket <name>       临时覆盖默认桶
```

### 输出契约

| 命令        | text                                                            | json                                            |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `ls`        | 每行 `key<TAB>size<TAB>lastModified`，按 key 排序；无结果不输出 | `[{"key","size","lastModified"}]`               |
| `stat`      | `key<TAB>size<TAB>etag<TAB>lastModified`                        | `{"key","size","etag","lastModified"}`          |
| `--dry-run` | 一行 `Would delete dev/a.xlsx`                                  | `{"dryRun":true,"action":"delete","key":"..."}` |

数据走 stdout，错误走 stderr；退出码 0 / 非 0。`stat` 找不到对象时退出码 1。

## 设计取舍

### 为什么 CLI 不做交互确认

AI 是无人值守调用者，任何 `y/n` 提示都会让整条自动化卡死。所以确认职责上移到调用方：
CLI 提供 `stat` 与 `--dry-run` 让助手"先看清"，再由助手向你确认。
这比在 CLI 里加 `--force` 更有效 —— 对 agent 来说 `--force` 会变成永远加上的 flag，等于没有门禁。

### 为什么 Skill 只是一份引导

Skill 里不写业务流程，因为流程属于使用者的系统，不属于工具。
把 Excel 模板发布、环境前缀这类故事写进 Skill，等于把一次性上下文固化成了对所有用户的默认行为。
Skill 只保留 agent 猜不到的东西：`copy` 是服务端操作、`rm` 不可逆、破坏性操作前要先 `--dry-run`。

### 为什么用 `npx skills` 分发

`npx skills add` 是 Agent Skills 的事实标准入口，装一次能覆盖 Claude Code、Cursor、Qoder 等
几十种工具。代价是必须把 frontmatter 写对 —— `name` / `description` 缺一个，
`npx skills` 会静默跳过整个 skill。所以仓库里有一个 `npm run verify:skill` 和对应的 CI job 守着它。

## 配置

| 键         | 必填 | 说明                                                                |
| ---------- | ---- | ------------------------------------------------------------------- |
| `ak`       | 是   | 华为云 Access Key                                                   |
| `sk`       | 是   | 华为云 Secret Key                                                   |
| `endpoint` | 是   | OBS 终端节点，含协议，如 `https://obs.cn-north-4.myhuaweicloud.com` |
| `bucket`   | 否   | 默认桶（可用 `--bucket` 按命令覆盖）                                |

环境变量优先级高于配置文件：`OBS_AK` / `OBS_SK` / `OBS_ENDPOINT` / `OBS_BUCKET`。

## 开发

```bash
git clone https://github.com/jcxy/huawei-obs-cli.git
cd huawei-obs-cli
npm ci
npm run dev -- ls dev/     # 用 tsx 直接跑源码
npm test                   # 单元测试（mock SDK，不连真实 OBS）
```

CI 会在 Linux 和 Windows、Node 20 和 22 上跑同一组检查：

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

改动约定见 [CONTRIBUTING.md](./CONTRIBUTING.md)，版本变更见 [CHANGELOG.md](./CHANGELOG.md)。

## License

[MIT](./LICENSE)
