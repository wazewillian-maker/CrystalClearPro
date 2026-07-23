const assert = require("node:assert/strict");
const fs = require("node:fs");
const { transformSync } = require("@babel/core");

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const transformed = transformSync(source, {
    babelrc: false,
    configFile: false,
    filename,
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
    presets: [require.resolve("babel-preset-expo")],
  });
  module._compile(transformed.code, filename);
};

const {
  getScheduledAgendaItems,
  getScheduledVisitsForDate,
} = require("../src/services/scheduled-visits-service.ts");

const today = new Date(2026, 6, 23, 12);
const tomorrow = new Date(2026, 6, 24, 12);
const nextThursday = new Date(2026, 6, 30, 12);
const clients = [{
  address: "Rua Real, 1",
  id: "client-real",
  name: "Cliente Real",
  neighborhood: "Centro",
}];
const pools = [{
  clienteId: "client-real",
  diasAtendimento: ["thursday", "friday"],
  empresaId: "company-real",
  frequenciaSemanal: 2,
  id: "pool-real",
  nome: "Piscina Real",
  planoAtendimento: "semanal",
  status: "ativa",
}];

const todayVisits = getScheduledVisitsForDate({
  clients,
  date: today,
  employees: [],
  logDetails: false,
  persistedVisits: [],
  pools,
});
assert.equal(todayVisits.length, 1, "piscina configurada para hoje deve aparecer");
assert.equal(todayVisits[0].virtual, true, "recorrencia deve existir sem inclusao manual");

const tomorrowVisits = getScheduledVisitsForDate({
  clients,
  date: tomorrow,
  employees: [],
  logDetails: false,
  persistedVisits: [],
  pools,
});
assert.equal(tomorrowVisits.length, 1, "piscina configurada para amanha deve aparecer");

const manualVisit = {
  address: "Rua Real, 1",
  clientId: "client-real",
  clientName: "Cliente Real",
  data: "23/07/2026",
  id: "manual-real",
  neighborhood: "Centro",
  origem: "Manual",
  piscinaId: "pool-real",
  status: "pending",
};
const withManual = getScheduledVisitsForDate({
  clients,
  date: today,
  employees: [],
  logDetails: false,
  persistedVisits: [manualVisit],
  pools,
});
assert.equal(withManual.length, 1, "visita manual e automatica nao podem duplicar");
assert.equal(withManual[0].id, "manual-real", "visita manual existente deve ser preservada");

const completedToday = { ...manualVisit, id: "finished-real", origem: "Agenda Inteligente", status: "finished" };
const futureVisits = getScheduledVisitsForDate({
  clients,
  date: nextThursday,
  employees: [],
  logDetails: false,
  persistedVisits: [completedToday],
  pools,
});
assert.equal(futureVisits.length, 1, "conclusao nao pode interromper recorrencia futura");
assert.equal(futureVisits[0].virtual, true);

const firstLoad = getScheduledAgendaItems({
  clients,
  daysAhead: 28,
  employees: [],
  persistedVisits: [manualVisit],
  pools,
  referenceDate: today,
});
const secondLoad = getScheduledAgendaItems({
  clients,
  daysAhead: 28,
  employees: [],
  persistedVisits: firstLoad,
  pools,
  referenceDate: today,
});
const uniqueKeys = new Set(secondLoad.map((visit) => `${visit.piscinaId}:${visit.data ?? visit.visitDate}`));
assert.equal(secondLoad.length, uniqueKeys.size, "recarregar nao pode duplicar visitas");

console.log("Agenda recorrente: 6 cenarios validados.");
