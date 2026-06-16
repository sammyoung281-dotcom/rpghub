import { useMemo, useRef } from "react";
import { useRealmStore } from "../store/useRealmStore";
import { GUILD_LIST } from "../data/guilds";
import { CHARACTERS, getCharacter } from "../data/characters";
import { agent } from "../agent";
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
  const authorityOf = useRealmStore((s) => s.authorityOf);
  const setAuthority = useRealmStore((s) => s.setAuthority);
  const exportRealm = useRealmStore((s) => s.exportRealm);
  const importRealm = useRealmStore((s) => s.importRealm);
  const fileInput = useRef<HTMLInputElement>(null);

  const tally = (guildId?: GuildId) => {
    const inGuild = (g: GuildId | "") => (guildId ? g === guildId : true);
    const props = proposals.filter((p) => inGuild(p.guildId));
    const qs = quests.filter((q) => inGuild(q.guildId));
    return {
      needsMe: props.length + qs.filter((q) => q.status === "blocked").length,
      inProgress: qs.filter((q) => q.status === "in_progress").length,
      done: qs.filter((q) => q.status === "done").length,
    };
  };

  const realmTally = useMemo(() => tally(), [proposals, quests]);
  const elderReport = useMemo(() => agent.report("realm"), [proposals, quests]);

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
                <p className="cnc-words small">“{agent.report(g.id).chunks[0]}” — {leader?.name}</p>
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
