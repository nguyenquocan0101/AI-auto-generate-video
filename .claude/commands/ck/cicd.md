---
description: Scaffold or audit a Docker → registry → deploy CI/CD pipeline on one of two tracks — Dokploy (GitHub Actions → DockerHub → Dokploy/VPS) or Azure (Azure DevOps Pipelines → DockerHub/ACR → Kubernetes via kubectl/Helm). Modes (pick one): --new (repo has none yet), --audit (review/fix an existing pipeline against the standard). No flag = auto-detect.
argument-hint: [--new | --audit] [target-path]
---

Load the `ck:cicd` skill and run it with `$ARGUMENTS`.
