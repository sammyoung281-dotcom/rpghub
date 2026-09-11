import { useMemo, useRef } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { GUILD_LIST } from "../data/guilds";
import { CHARACTERS, getCharacter } from "../data/characters";
import { agent } from "../agent";
import type { RealmSnapshot } from "../agent/AgentEngine";
import { BAND_LABEL, describeRisk } from "../agent/risk";
import { Authority, type CharacterId, type GuildId } from "../types";
import "./Council.css";

const AUTH_LABEL: Record<Authority, string> = {
  [Authority.Petitioner]: "Petitioner",
  [Authority.Trusted]: "Trusted",
  [Authority.Steward]: "Steward",
};
const AUTH_HINT: Record<Authority, string> = {
  [Authority.Petitioner]: "Asks before every action",
  [Authority.Trusted]: "Acts on routine, asks on big calls",
  [Authority.Steward]: "Acts freely, reports after",
};

/**
 * The High Council: the Elder's realm-wide roll-up, each guild's report, and the
 * authority dial for every character — plus save/load of the whole realm. The
 * tallies are REAL (computed from live quest state); the narration comes from
 * the AgentEngine (scripted in Phase 1, Claude in Phase 2).
 */
export default function Council() {
  const open = useRealmStore((s) => s.councilOpen);
  const setOpen = useRealmStore((s) => s.setCouncilOpen);
  const proposals = useRealmStore((s) => s.proposals);
  const quests = useRealmStore((s) => s.quests);
  const permissions = useRealmStore((s) => s.permissions);
  const messages = useRealmStore((s) => s.messages);
  const tick = useRealmStore((s) => s.tick);
  const authorityOf = useRealmStore((s) => s.authorityOf);
  const setAuthority = useRealmStore((s) => s.setAuthority);
  const exportRealm = useRealmStore((s) => s.exportRealm);
  const importRealm = useRealmStore((s) => s.importRealm);
  const fileInput = useRef<HTMLInputElement>(null);

  // The snapshot handed to the reporting agents — the only state they may
  // summarise. Same shape the Claude engine will receive in Phase 3.
  const snapshot = useMemo<RealmSnapshot>(
    () => ({ tick, quests, proposals, permissions, messages }),
    [tick, quests, proposals, permissions, messages]
  );

  const tally = (guildId?: GuildId) => {
    const inGuild = (g: GuildId | "") => (guildId ? g === guildId : true);
    const props = proposals.filter((p) => inGuild(p.guildId));
    const qs = quests.filter((q) => inGuild(q.guildId));
    const perms = permissions.filter(
      (p) => p.status === "pending" && inGuild(getCharacter(p.characterId)?.guildId ?? "")
    );
    return {
      needsMe: props.length + qs.filter((q) => q.status === "blocked").length + perms.length,
      inProgress: qs.filter((q) => q.status === "in_progress").length,
      done: qs.filter((q) => q.status === "done").length,
    };
  };

  const realmTally = useMemo(() => tally(), [proposals, quests, permissions]);
  const elderReport = useMemo(() => agent.report("realm", snapshot), [snapshot]);

  if (!open) return null;

  const doExport = () => {
    const blob = new Blob([exportRealm()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "realm-of-endeavour.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = (file: File) => {
    file.text().then((t) => {
      if (!importRealm(t)) alert("That doesn't look like a valid realm save.");
    });
  };

  const elder = getCharacter("elder");

  return (
    <div className="cnc-backdrop" onClick={() => setOpen(false)}>
      <div className="cnc-panel" onClick={(e) => e.stopPropagation()}>
        <header className="cnc-head">
          <h2>⚖️ The High Council</h2>
          <button className="cnc-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </header>

        {/* Elder's realm roll-up */}
        <section className="cnc-elder">
          <div className="cnc-elder-top">
            <span className="cnc-portrait">{elder?.portrait}</span>
            <div>
              <div className="cnc-elder-name">{elder?.name}</div>
              <div className="cnc-elder-title">{elder?.title}</div>
            </div>
            <div className="cnc-tally">
              <span className="t-red">🟥 {realmTally.needsMe}</span>
              <span className="t-amber">🟨 {realmTally.inProgress}</span>
              <span className="t-green">🟩 {realmTally.done}</span>
            </div>
          </div>
          {elderReport.chunks.map((c, i) => (
            <p key={i} className="cnc-words">{c}</p>
          ))}
        </section>

        <CouncilDocket />

        {/* Guilds: report + authority dial */}
        <div className="cnc-guilds">
          {GUILD_LIST.map((g) => {
            const t = tally(g.id);
            const leader = getCharacter(g.leaderId);
            const members = Object.values(CHARACTERS).filter((c) => c.guildId === g.id);
            return (
              <section key={g.id} className="cnc-guild" style={{ borderLeftColor: g.accent }}>
                <div className="cnc-guild-head">
                  <span className="cnc-guild-name">{g.emoji} {g.name}</span>
                  <span className="cnc-tally small">
                    <span className="t-red">🟥 {t.needsMe}</span>
                    <span className="t-amber">🟨 {t.inProgress}</span>
                    <span className="t-green">🟩 {t.done}</span>
                  </span>
                </div>
                <p className="cnc-words small">“{agent.report(g.id, snapshot).chunks[0]}” — {leader?.name}</p>
                {members.map((m) => (
                  <AuthorityRow key={m.id} id={m.id} current={authorityOf(m.id)} onSet={setAuthority} />
                ))}
              </section>
            );
          })}
        </div>

        <footer className="cnc-foot">
          <span className="cnc-autosave">✓ Autosaves to this browser</span>
          <div className="cnc-saveload">
            <button className="cnc-btn" onClick={doExport}>⬇ Export realm</button>
            <button className="cnc-btn" onClick={() => fileInput.current?.click()}>⬆ Import</button>
            <button
              className="cnc-btn"
              onClick={() => {
                if (confirm("Wipe the realm and begin again from turn one?")) {
                  useRealmStore.getState().resetRealm();
                  setOpen(false);
                }
              }}
              title="Start a fresh realm"
            >
              ↺ Begin anew
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * The docket: everything the risk matrix said the council can settle without
 * interrupting the Chairman. Presented ONE AT A TIME with two big buttons
 * (ADHD rule #4), never as a form or a list to work through.
 */
function CouncilDocket() {
  const permissions = useRealmStore((s) => s.permissions);
  const decide = useRealmStore((s) => s.decidePermission);

  const docket = useMemo(
    () => permissions.filter((p) => p.status === "pending" && p.route === "council"),
    [permissions]
  );

  if (!docket.length) return null;

  const item = docket[0];
  const who = getCharacter(item.characterId);
  const remaining = docket.length - 1;

  return (
    <section className="cnc-docket">
      <div className="cnc-docket-head">
        <span>⚖️ In session — {docket.length} to settle</span>
        {remaining > 0 && <em>{remaining} after this</em>}
      </div>

      <div className="cnc-docket-item">
        <div className="cnc-docket-who">
          {who?.portrait} <strong>{who?.name}</strong> asks:
        </div>
        <div className="cnc-docket-action">{item.action}</div>
        <div className="cnc-docket-why">{item.rationale}</div>
        {item.factors && (
          <div className="cnc-docket-risk" title={item.because}>
            {describeRisk(item.factors)} — {BAND_LABEL[item.route ?? "council"]}
          </div>
        )}
        <div className="cnc-docket-buttons">
          <button className="cnc-yes" onClick={() => decide(item.id, true)}>
            Approve
          </button>
          <button className="cnc-no" onClick={() => decide(item.id, false)}>
            Refuse
          </button>
        </div>
      </div>
    </section>
  );
}

function AuthorityRow({
  id,
  current,
  onSet,
}: {
  id: CharacterId;
  current: Authority;
  onSet: (id: CharacterId, a: Authority) => void;
}) {
  const c = getCharacter(id);
  if (!c) return null;
  return (
    <div className="cnc-member">
      <span className="cnc-member-name">
        {c.portrait} {c.name}
        <em>{c.title}</em>
      </span>
      <div className="cnc-auth" title={AUTH_HINT[current]}>
        {[Authority.Petitioner, Authority.Trusted, Authority.Steward].map((lvl) => (
          <button
            key={lvl}
            className={"cnc-auth-btn" + (current === lvl ? " on" : "")}
            onClick={() => onSet(id, lvl)}
            title={AUTH_HINT[lvl]}
          >
            {AUTH_LABEL[lvl]}
          </button>
        ))}
      </div>
    </div>
  );
}
