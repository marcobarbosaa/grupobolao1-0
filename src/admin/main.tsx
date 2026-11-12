import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  FolderOpen,
  Upload,
  ShieldCheck,
  ChevronRight,
  Save,
  ScanText,
  CircleAlert,
} from "lucide-react";
import { phaseCatalog } from "../lib/statistics/phases";
import { metricCatalog } from "../lib/statistics/metrics";
import {
  identifySeason,
  inspectRelativePath,
  type LocalDraft,
  type LocalRow,
} from "../lib/statistics/local-import";
import type { CandidateItem } from "../lib/statistics/import-contracts";
import {
  readDroppedEntries,
  validateSelection,
  encodeImage,
  preprocessImage,
  type SelectedFile,
} from "./directories";
import { ExtrasEditor } from "./ExtrasEditor";
import "./importer.css";

let sessionToken = sessionStorage.getItem("bolao-import-session") ?? "";
async function api<T = any>(action: string, data: unknown = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/__bolao/api/" + action, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessionToken },
    body: JSON.stringify(data),
    signal,
  });
  if (action === "image" && response.ok) return (await response.blob()) as T;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Operação recusada");
  return result;
}
type Player = { id: string; name: string };
function RowEditor({
  draft,
  row,
  players,
  busy,
  onSave,
  onOcr,
  onDirty,
}: {
  draft: LocalDraft;
  row: LocalRow;
  players: Player[];
  busy: boolean;
  onSave: (item: CandidateItem, reviewed: boolean, reason: string) => void;
  onOcr: (processed?: string) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [item, setItem] = useState(row.item),
    [reason, setReason] = useState(row.excludedReason);
  const [group, setGroup] = useState<keyof typeof metricCatalog>("averages");
  const [image, setImage] = useState(""),
    [imageError, setImageError] = useState("");
  const [crop, setCrop] = useState([0, 0, 100, 100]),
    [dirty, setDirty] = useState(false);
  const blob = useRef<Blob | undefined>(undefined);
  useEffect(() => {
    let url = "",
      stopped = false;
    api<Blob>("image", { id: draft.id, rowId: row.id })
      .then((value) => {
        if (stopped) return;
        blob.current = value;
        url = URL.createObjectURL(value);
        setImage(url);
      })
      .catch((e) => setImageError(String(e)));
    return () => {
      stopped = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [draft.id, row.id]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const change = (next: CandidateItem) => {
    setItem(next);
    setDirty(true);
    onDirty(true);
  };
  const setMetric = (label: string, raw: string) =>
    change({
      ...item,
      values: [
        ...(item.values ?? []).filter((v) => v.label !== label),
        ...(raw === "" ? [] : [{ label, value: raw }]),
      ],
    });
  return (
    <section className="review-workbench">
      <div className="original-panel">
        <div className="panel-title">
          <span>FONTE ORIGINAL</span>
          <span>SHA-256 verificado</span>
        </div>
        {image ? (
          <a href={image} target="_blank" rel="noreferrer">
            <img src={image} alt={row.relativePath} />
          </a>
        ) : (
          <p>{imageError || "Carregando original…"}</p>
        )}
        <p className="path">{row.relativePath}</p>
        <details>
          <summary>OCR local e região de interesse</summary>
          <p>
            Recorte opcional em %: esquerda, topo, largura, altura. O OCR usa uma cópia em cinza; o
            original é preservado.
          </p>
          <div className="crop-fields">
            {["Esquerda", "Topo", "Largura", "Altura"].map((label, i) => (
              <label key={label}>
                {label}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={crop[i]}
                  onChange={(e) =>
                    setCrop(crop.map((v, n) => (n === i ? Number(e.target.value) : v)))
                  }
                />
              </label>
            ))}
          </div>
          <button disabled={busy || dirty} onClick={() => onOcr()}>
            <ScanText size={16} />
            Ler original
          </button>
          <button
            disabled={busy || dirty || !blob.current}
            onClick={() => {
              void preprocessImage(blob.current!, crop)
                .then(onOcr)
                .catch((e) => setImageError(String(e)));
            }}
          >
            Ler região em cinza
          </button>
          {row.ocr && (
            <>
              <p>Confiança média OCR: {row.ocr.confidence?.toFixed(1) ?? "não informada"}%</p>
              <ul>
                {row.ocr.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <pre>{row.ocr.text}</pre>
            </>
          )}
        </details>
        <small className="path">{row.source.source.contentHash}</small>
      </div>
      <div className="fields-panel">
        <div className="panel-title">
          <span>CONFERÊNCIA ESTATÍSTICA</span>
          <span>
            {dirty ? "Alterações não salvas" : row.reviewed ? "Revisado" : "Precisa de revisão"}
          </span>
        </div>
        <fieldset disabled={busy || Boolean(draft.published)}>
          <label>
            Tipo de registro
            <select
              value={item.kind}
              onChange={(e) =>
                change({
                  id: item.id,
                  kind: e.target.value as CandidateItem["kind"],
                  sourceIds: item.sourceIds,
                  notes: [],
                  unrecognizedFields: [],
                  ...(e.target.value === "season-extras"
                    ? {}
                    : { values: [], scope: "all-teams", availability: "available" }),
                })
              }
            >
              <option value="phase-summary">Estatísticas do jogador</option>
              <option value="season-extras">Extras · classificação e playoffs</option>
            </select>
          </label>
          {item.kind !== "season-extras" ? (
            <>
              <div className="field-pair">
                <label>
                  Jogador
                  <select
                    aria-label="Jogador"
                    value={item.player?.id ?? ""}
                    onChange={(e) =>
                      change({
                        ...item,
                        player: e.target.value ? { id: e.target.value } : undefined,
                      })
                    }
                  >
                    <option value="">Pasta desconhecida · selecionar</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Fase
                  <select
                    aria-label="Fase"
                    value={item.phaseId ?? ""}
                    onChange={(e) =>
                      change({ ...item, phaseId: e.target.value as CandidateItem["phaseId"] })
                    }
                  >
                    <option value="">Confirmar fase no print</option>
                    {phaseCatalog.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id === "quarterfinals" ? "Conference Semifinals" : p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>
                Consolidado de todas as equipes. Para separar por equipe, use os campos avançados
                com o ID cadastrado.
              </p>
              <div className="metric-tabs">
                {(["totals", "averages", "percentages"] as const).map((g) => (
                  <button
                    type="button"
                    className={g === group ? "active" : ""}
                    key={g}
                    onClick={() => setGroup(g)}
                  >
                    {{ totals: "Totais", averages: "Médias", percentages: "Percentuais" }[g]}
                  </button>
                ))}
              </div>
              <div className="metric-fields">
                {Object.keys(metricCatalog[group]).map((metric) => (
                  <label key={metric}>
                    {metric}
                    <input
                      inputMode="decimal"
                      placeholder="Ausente"
                      value={String(item.values?.find((v) => v.label === metric)?.value ?? "")}
                      onChange={(e) => setMetric(metric, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <ExtrasEditor
              value={item.extras ?? {}}
              onChange={(extras) => change({ ...item, extras })}
            />
          )}
          <details>
            <summary>Complementar ou corrigir registro publicado</summary>
            <p>
              Uma correção deve conter o registro completo, incluindo campos já publicados que devem
              permanecer.
            </p>
            <label>
              Revisão atual esperada
              <input
                type="number"
                min={1}
                value={item.correction?.expectedRevision ?? ""}
                onChange={(e) =>
                  change({
                    ...item,
                    correction: e.target.value
                      ? {
                          expectedRevision: Number(e.target.value),
                          reason: item.correction?.reason ?? "",
                        }
                      : undefined,
                  })
                }
              />
            </label>
            {item.correction && (
              <label>
                Motivo
                <input
                  value={item.correction.reason}
                  onChange={(e) =>
                    change({ ...item, correction: { ...item.correction!, reason: e.target.value } })
                  }
                />
              </label>
            )}
          </details>
          <details>
            <summary>Campos avançados · contrato do importador</summary>
            <p>
              Permite ajustar escopo, equipe e demais informações. Não altere o ID do candidato.
            </p>
            <textarea
              aria-label="Registro JSON"
              rows={14}
              defaultValue={JSON.stringify(item, null, 2)}
              key={JSON.stringify(item)}
              onBlur={(e) => {
                try {
                  change(JSON.parse(e.target.value));
                  setImageError("");
                } catch {
                  setImageError("JSON inválido; não aplicado");
                }
              }}
            />
          </details>
          <label>
            Excluir este arquivo do lote (motivo obrigatório para excluir)
            <input
              placeholder="Deixe vazio para incluir"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setDirty(true);
                onDirty(true);
              }}
            />
          </label>
          <div className="actions">
            <button
              onClick={() => {
                onSave(item, false, reason);
              }}
            >
              <Save size={16} />
              Salvar pendente
            </button>
            <button
              className="primary"
              onClick={() => {
                onSave(item, true, reason);
              }}
            >
              <ShieldCheck size={16} />
              Conferi este print · salvar
            </button>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
function Importer() {
  const [unsaved, setUnsaved] = useState(false);
  const [token, setToken] = useState(sessionToken),
    [connected, setConnected] = useState(false);
  const [info, setInfo] = useState<any>(),
    [draft, setDraft] = useState<LocalDraft>();
  const [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" }),
    [messages, setMessages] = useState<string[]>([]);
  const [pendingOnly, setPendingOnly] = useState(false),
    [report, setReport] = useState<any>(),
    [publication, setPublication] = useState<any>();
  const [approver, setApprover] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [corrections, setCorrections] = useState(false),
    [approved, setApproved] = useState(false);
  const [seasonName, setSeasonName] = useState(""),
    [aliasName, setAliasName] = useState(""),
    [aliasPlayer, setAliasPlayer] = useState("");
  const picker = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | undefined>(undefined);
  async function work(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  function changed(next: LocalDraft | undefined) {
    setUnsaved(false);
    setDraft(next);
    setReport(undefined);
    setPublication(undefined);
    setApproved(false);
    setConfirmed(false);
    setCorrections(false);
  }
  async function connect() {
    sessionToken = token;
    const data = await api("list");
    setInfo(data);
    setConnected(true);
    sessionStorage.setItem("bolao-import-session", token);
  }
  async function ingest(files: SelectedFile[]) {
    if (unsaved) throw new Error("Salve o print atual antes de importar outra pasta");
    const folder = validateSelection(files);
    let current =
      draft && !draft.published && draft.folder === folder
        ? draft
        : await api<LocalDraft>("create", { folder });
    changed(current);
    setSeasonName(folder);
    setMessages([]);
    const abort = controller.current ?? new AbortController();
    controller.current = abort;
    for (let i = 0; i < files.length; i++) {
      abort.signal.throwIfAborted();
      const { path, file } = files[i];
      setProgress({ done: i, total: files.length, label: path });
      try {
        const saved = current.rows.find((r) => r.relativePath === path);
        if (saved) {
          if (file.size > info.limits.fileBytes) throw new Error("Arquivo alterado excede limite");
          const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
          const hash = Array.from(new Uint8Array(digest), (b) =>
            b.toString(16).padStart(2, "0"),
          ).join("");
          if (hash !== saved.source.source.contentHash)
            throw new Error(
              "Arquivo mudou desde a leitura anterior. Crie outro lote para revisar a nova fonte.",
            );
          continue;
        }
        const parsed = inspectRelativePath(path);
        if (!parsed.supported) throw new Error("Arquivo não suportado ou fora de subpasta");
        const base64 = await encodeImage(file);
        current = await api<LocalDraft>(
          "upload",
          { id: current.id, revision: current.revision, path, base64 },
          abort.signal,
        );
        changed(current);
        if (info.ocrAvailable) {
          try {
            current = await api<LocalDraft>(
              "ocr",
              { id: current.id, revision: current.revision, rowId: current.rows.at(-1)!.id },
              abort.signal,
            );
            changed(current);
          } catch (e) {
            if (abort.signal.aborted) throw e;
            setMessages((m) => [...m, path + ": OCR pendente — " + String(e)]);
          }
        }
      } catch (e) {
        if (abort.signal.aborted) throw e;
        setMessages((m) => [...m, path + ": " + String(e)]);
      }
    }
    setProgress({ done: files.length, total: files.length, label: "Leitura concluída" });
    setSelected(current.rows[0]?.id ?? "");
    setInfo(await api("list"));
  }
  const rows = draft?.rows ?? [],
    chosen = rows.find((r) => r.id === selected);
  const pending = rows.filter((r) => !r.reviewed && !r.excludedReason).length;
  return (
    <div className="importer">
      <header className="import-header">
        <div>
          <span className="eyebrow">CENTRAL DO BOLÃO / OPERAÇÃO LOCAL</span>
          <h1>
            IMPORTADOR
            <br />
            <em>DE TEMPORADAS.</em>
          </h1>
          <p>Da pasta de screenshots ao arquivo oficial. Cada número, conferido.</p>
        </div>
        <div className="local-badge">
          <ShieldCheck size={20} />
          127.0.0.1 · PRIVADO
        </div>
      </header>
      {!connected ? (
        <form
          className="login-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void work(connect);
          }}
        >
          <h2>Abrir sessão local</h2>
          <p>
            Execute <code>npm run stats:import:local</code> e cole o código exibido no terminal. A
            sessão dura até 8 horas.
          </p>
          <label>
            Código da sessão
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <button disabled={busy} className="primary">
            Entrar <ChevronRight size={16} />
          </button>
        </form>
      ) : (
        <>
          <div className="top-actions">
            <label>
              Retomar revisão
              <select
                disabled={busy || unsaved}
                aria-label="Retomar revisão"
                value={draft?.id ?? ""}
                onChange={(e) => {
                  if (e.target.value)
                    void work(async () => {
                      const value = await api<LocalDraft>("load", { id: e.target.value });
                      changed(value);
                      setSelected(value.rows[0]?.id ?? "");
                      setSeasonName(value.folder);
                    });
                }}
              >
                <option value="">Selecionar lote salvo</option>
                {info.drafts.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.folder} · {d.files} imagens {d.published ? "· Publicado" : ""} ·{" "}
                    {d.createdAt}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={busy || unsaved}
              onClick={() => {
                changed(undefined);
                setSelected("");
              }}
            >
              Novo lote
            </button>
          </div>
          <section
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (busy) return;
              controller.current = new AbortController();
              const promise = readDroppedEntries(e.dataTransfer.items, controller.current.signal);
              void work(async () => ingest(await promise));
            }}
          >
            <Upload size={30} />
            <div>
              <h2>Arraste a pasta completa da temporada</h2>
              <p>Jogadores e Extras, juntos. JPG, PNG ou WebP · até 500 arquivos / 1 GiB.</p>
            </div>
            <button disabled={busy} onClick={() => picker.current?.click()}>
              <FolderOpen size={17} />
              Selecionar pasta
            </button>
            <input
              ref={picker}
              type="file"
              hidden
              multiple
              {...({ webkitdirectory: "" } as any)}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).map((file) => ({
                  file,
                  path: file.webkitRelativePath,
                }));
                e.target.value = "";
                controller.current = new AbortController();
                void work(() => ingest(files));
              }}
            />
          </section>
          {progress.total > 0 && (
            <div className="progress">
              <progress value={progress.done} max={progress.total} />
              <span>
                {progress.done}/{progress.total} · {progress.label}
              </span>
              {busy && <button onClick={() => controller.current?.abort()}>Cancelar</button>}
            </div>
          )}
          {!info.ocrAvailable && (
            <p className="notice">
              OCR não configurado. A revisão e a transcrição manual estão disponíveis. Nenhuma
              imagem sai deste computador.
            </p>
          )}
          {messages.length > 0 && (
            <details className="notice" open>
              <summary>{messages.length} arquivos com avisos</summary>
              <ul>
                {messages.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </details>
          )}
          {draft && (
            <>
              <section className="season-confirm">
                <div>
                  <span className="eyebrow">TEMPORADA IDENTIFICADA</span>
                  <h2>{draft.season?.label ?? "Nome não reconhecido"}</h2>
                  <p>{draft.season?.id ?? "Confirme o ano inicial e final abaixo"}</p>
                </div>
                <label>
                  Ano da temporada
                  <input
                    disabled={busy || unsaved || Boolean(draft.published)}
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.target.value)}
                  />
                </label>
                <button
                  disabled={busy || unsaved || Boolean(draft.published)}
                  onClick={() =>
                    void work(async () => {
                      const inferred = identifySeason(seasonName);
                      if (!inferred) throw new Error("Use o formato 2008-2009");
                      const existing = info.seasons.find((s: any) => s.id === inferred.id);
                      changed(
                        await api("configure", {
                          id: draft.id,
                          revision: draft.revision,
                          season: existing ?? inferred,
                          confirmed: true,
                        }),
                      );
                    })
                  }
                >
                  {draft.seasonConfirmed ? "Temporada confirmada" : "Confirmar temporada"}
                </button>
              </section>
              <div className="scoreboard">
                {[
                  ["Arquivos", rows.length],
                  ["Jogadores", new Set(rows.map((r) => r.item.player?.id).filter(Boolean)).size],
                  ["Extras", rows.filter((r) => r.item.kind === "season-extras").length],
                  ["Revisados", rows.filter((r) => r.reviewed).length],
                  ["Pendentes", pending],
                  ["Conflitos", report?.conflicts?.length ?? 0],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="review-nav">
                <h2>CONFERÊNCIA DOS PRINTS</h2>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={pendingOnly}
                    onChange={(e) => setPendingOnly(e.target.checked)}
                  />
                  Somente pendentes
                </label>
              </div>
              <div className="file-strip">
                {rows
                  .filter((r) => !pendingOnly || (!r.reviewed && !r.excludedReason))
                  .map((r) => (
                    <button
                      className={selected === r.id ? "active" : ""}
                      key={r.id}
                      disabled={busy || unsaved}
                      onClick={() => setSelected(r.id)}
                    >
                      <span>{r.relativePath.split("/").slice(1).join(" / ")}</span>
                      <small>
                        {draft.published
                          ? "Publicado"
                          : r.excludedReason
                            ? "Excluído"
                            : r.reviewed
                              ? report?.ready
                                ? "Validado"
                                : "Processado · revisado"
                              : "Precisa de revisão"}
                      </small>
                    </button>
                  ))}
              </div>
              {chosen && (
                <RowEditor
                  key={chosen.id + ":" + draft.revision}
                  draft={draft}
                  row={chosen}
                  players={info.players}
                  busy={busy}
                  onDirty={setUnsaved}
                  onSave={(item, reviewed, excludedReason) =>
                    void work(async () => {
                      changed(
                        await api("edit", {
                          id: draft.id,
                          revision: draft.revision,
                          rowId: chosen.id,
                          item,
                          reviewed,
                          excludedReason,
                        }),
                      );
                    })
                  }
                  onOcr={(processed) => {
                    controller.current = new AbortController();
                    void work(async () => {
                      changed(
                        await api(
                          "ocr",
                          { id: draft.id, revision: draft.revision, rowId: chosen.id, processed },
                          controller.current!.signal,
                        ),
                      );
                    });
                  }}
                />
              )}
              <details className="alias-panel">
                <summary>Correspondências de nomes aprovadas</summary>
                <p>Aplica-se às próximas leituras. Pastas desconhecidas nunca criam jogadores.</p>
                <div className="field-pair">
                  <label>
                    Nome da pasta
                    <input value={aliasName} onChange={(e) => setAliasName(e.target.value)} />
                  </label>
                  <label>
                    Jogador
                    <select value={aliasPlayer} onChange={(e) => setAliasPlayer(e.target.value)}>
                      <option value="">Selecionar</option>
                      {info.players.map((p: Player) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Responsável
                  <input value={approver} onChange={(e) => setApprover(e.target.value)} />
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    void work(async () => {
                      await api("alias", {
                        name: aliasName,
                        playerId: aliasPlayer,
                        approvedBy: approver,
                        confirmed: true,
                      });
                      setMessages((m) => [...m, "Correspondência aprovada e salva."]);
                    })
                  }
                >
                  Aprovar correspondência
                </button>
              </details>
              <section className="publication-panel">
                <span className="eyebrow">REVISAR → APROVAR → SIMULAR → PUBLICAR</span>
                <h2>PORTÃO DE PUBLICAÇÃO.</h2>
                <p>
                  Apenas os registros incluídos e conferidos entram no lote. Alterar qualquer dado
                  exige nova revisão e aprovação.
                </p>
                <button
                  disabled={busy || unsaved || Boolean(draft.published)}
                  onClick={() =>
                    void work(async () => {
                      setApproved(false);
                      setPublication(undefined);
                      setConfirmed(false);
                      setReport(await api("review", { id: draft.id }));
                    })
                  }
                >
                  Gerar relatório e validar
                </button>
                {report && (
                  <>
                    <p className={report.ready ? "success" : "notice"}>
                      {report.ready
                        ? "Validação concluída. Aguardando aprovação explícita."
                        : "Publicação bloqueada: resolva as pendências."}
                    </p>
                    <ul>
                      {report.issues.map((i: any, n: number) => (
                        <li key={n}>
                          {i.path}: {i.message}
                        </li>
                      ))}
                    </ul>
                    <details open>
                      <summary>Registros propostos, conflitos e procedência</summary>
                      <pre>
                        {JSON.stringify(
                          {
                            changes: report.changes,
                            conflicts: report.conflicts,
                            verifiedSources: report.verifiedSources,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                    <p className="path">Revisão: {report.reviewHash}</p>
                    <label>
                      Nome do responsável
                      <input value={approver} onChange={(e) => setApprover(e.target.value)} />
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />
                      Conferi o relatório e aprovo explicitamente estes registros e suas fontes.
                    </label>
                    {report.conflicts.length > 0 && (
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={corrections}
                          onChange={(e) => setCorrections(e.target.checked)}
                        />
                        Aceito as correções listadas e a preservação das revisões anteriores.
                      </label>
                    )}
                    <div className="actions">
                      <button
                        disabled={
                          busy ||
                          unsaved ||
                          !report.ready ||
                          !confirmed ||
                          !approver.trim() ||
                          (report.conflicts.length > 0 && !corrections)
                        }
                        onClick={() =>
                          void work(async () => {
                            await api("approve", {
                              id: draft.id,
                              reviewHash: report.reviewHash,
                              approvedBy: approver,
                              correctionIds: report.changes
                                .filter((c: any) => c.action === "correction")
                                .map((c: any) => c.itemId),
                              confirmed,
                            });
                            setApproved(true);
                          })
                        }
                      >
                        {approved ? "Aprovado" : "Aprovar revisão"}
                      </button>
                      <button
                        disabled={busy || unsaved || !approved}
                        onClick={() =>
                          void work(async () =>
                            setPublication(await api("dry-run", { id: draft.id })),
                          )
                        }
                      >
                        Executar dry-run
                      </button>
                      <button
                        className="primary"
                        disabled={busy || unsaved || publication?.mode !== "dry-run" || !confirmed}
                        onClick={() =>
                          void work(async () => {
                            const result = await api("publish", { id: draft.id, confirmed: true });
                            setPublication(result);
                            setDraft(await api("load", { id: draft.id }));
                            setInfo(await api("list"));
                          })
                        }
                      >
                        Publicar localmente
                      </button>
                    </div>
                  </>
                )}
                {publication && (
                  <>
                    <h3>
                      {publication.committed
                        ? "Publicado e validado"
                        : "Simulação — arquivos propostos"}
                    </h3>
                    <pre>{JSON.stringify(publication, null, 2)}</pre>
                  </>
                )}
                {draft.published && (
                  <p className="success">
                    Lote publicado. Execute npm run build para atualizar o site. Revise o diff e
                    inclua somente os JSON oficiais e recibos no commit. Nenhum push foi executado.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
      {error && (
        <div className="error" role="alert">
          <CircleAlert size={20} />
          <span>{error}</span>
        </div>
      )}
      {busy && (
        <div className="working" role="status">
          Processando localmente…{" "}
          <button onClick={() => controller.current?.abort()}>Cancelar leitura/OCR</button>
        </div>
      )}
      <footer>ARQUIVO ESTATÍSTICO / ORIGINAIS PRESERVADOS / PUBLICAÇÃO SOB REVISÃO</footer>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Importer />
  </StrictMode>,
);
