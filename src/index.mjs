import { load } from "cheerio";
import { db } from "./db/index.mjs";
import { payouts } from "./db/schema.mjs";
const HOST = "https://www.theasianpokertour.com";
const EVENTS_LIST_URL = `${HOST}/en/series/apt-taipei-2024`;

const html = await fetch(EVENTS_LIST_URL).then((res) => res.text());

const $ = load(html);
let i = 0;
// get all a tag with href starts with /en/series/apt-taipei-2024/events/
const events = $("a[href^='/en/series/apt-taipei-2024/events/']");
const hrefs = events.toArray().map((el) => $(el).attr("href"));

await db.delete(payouts).execute();

for (const href of hrefs) {
  const url = `${HOST}${href}`;
  const eventId = href.split("/").pop();
  const eventHtml = await fetch(url).then((res) => res.text());
  const $$ = load(eventHtml);
  // get the h6 with text 'Total Buy-in'
  const totalBuyIn = $$("h6:contains('Total Buy-in')").next().text();
  const buyInValue = parseInt(totalBuyIn.replace(/[^0-9]/g, ""));

  // content of div with class 'col-span-3 md:min-w-[28rem] md:max-w-3xl p-2'
  const eventIndexString = $$(
    "div.col-span-3.md\\:min-w-\\[28rem\\].md\\:max-w-3xl.p-2 > span"
  )
    .text()
    .replace(/[^0-9]/g, "");
  const eventIndex = parseInt(eventIndexString);

  const eventName = $$("h1").text();

  const flight = eventName.match(/ - Flight (.+?) - /)?.[1] || null;

  const playersHtml = await fetch(`${url}/players`).then((res) => res.text());
  const playersData = extractDataFromTable(playersHtml, "table");
  if (!playersData?.length) continue;
  const payoutsHtml = await fetch(`${url}/results`).then((res) => res.text());
  const payoutsData = extractDataFromTable(payoutsHtml, "table");

  for (let player of playersData) {
    const playerPayout =
      payoutsData.find((payout) => payout["name"] === player["name"]) ?? {};
    Object.assign(player, {
      eventId,
      eventName,
      eventIndex,
      buyInValue,
      flight,
      ...playerPayout,
    });
    if (typeof player.name === "number") {
      throw "fuck";
    }
  }
  console.log({ eventIndex, eventName, playersData });
  try {
    await db.insert(payouts).values(playersData).execute();
  } catch (e) {
    throw e;
  }
  console.log(eventIndex, eventName);
}

function extractDataFromTable(html, tableSelector) {
  const $ = load(html);
  const headers = $(`${tableSelector} thead tr th`)
    .toArray()
    .map((el) => $(el).text())
    .map((text) => {
      // camal case of text
      return text
        .replace(/[()]/g, "")
        .split(" ")
        .map((word, i) => {
          if (i === 0) {
            return word.toLowerCase();
          }
          return word[0].toUpperCase() + word.slice(1).toLowerCase();
        })
        .join("");
    });
  const resultRows = $(`${tableSelector} tbody tr`);
  const results = resultRows.toArray().map((row) => {
    const cells = $(row).find("td").toArray();
    return headers.reduce((acc, header, i) => {
      try {
        const text = cells[i].firstChild.data;
        if (!text) return acc;
        // is string is number, convert it to number
        //
        const isNumberTextWithSeparator = text.match(/^[0-9\.,]+$/g);
        if (isNumberTextWithSeparator) {
          acc[header] = parseFloat(text.replace(/,/g, ""));
        } else {
          acc[header] = text.trim();
        }
      } catch (e) {}
      return acc;
    }, {});
  });
  return results;
}
