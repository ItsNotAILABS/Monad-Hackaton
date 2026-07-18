# Delta AI — long-horizon, multi-device, self-evolving

**Text briefs only. STT for notes/commands. No robot TTS.**

## Why not “old AI”

| Old path | MonadBuilder path |
|----------|-------------------|
| Full context re-encode every step | **Delta attention** — residual weight on *changed* senses |
| Giant server memory forever | Local-first skills + bounded working memory |
| Chat only | Long-horizon goals · tool hops · self-evolve |
| Main-thread freeze | Browser + Node workers |

## Pipeline

```
multi_sense → delta_attention → fast_decode → multi_device tools → self_evolve
```

## API

```bash
GET  /agent
POST /agent/step   {"goal":"…","note":"…","stt":"…"}
```

## X marketing (ecosystem + user)

AI drafts posts from real actions (rejects, morning, signals). Owner posts via intent URL.

```bash
POST /x/from-actions
GET  /x/queue
# MCP: thesis_x_draft · thesis_x_from_actions · thesis_x_queue
```

UI: **AGENT** tab · TERM `agent …` · `x`
