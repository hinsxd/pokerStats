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

  const eventName = $$(
    "div.col-span-3.md\\:min-w-\\[28rem\\].md\\:max-w-3xl.p-2 > h1"
  ).text();

  const flight = eventName.match(/ - Flight (.+?) - /)?.[1] || null;

  const resultsHtml = await fetch(`${url}/results`).then((res) => res.text());
  const $$$ = load(resultsHtml);

  const headers = $$$("table thead tr th")
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

  const resultRows = $$$("table tbody tr");

  for (const row of resultRows.toArray()) {
    const cells = $(row).find("td").toArray();
    const result = headers.reduce((acc, header, i) => {
      try {
        const text = cells[i].firstChild.data;
        if (!text) return acc;
        // is string is number, convert it to number
        const isNumber = text.replace(/[^0-9]/g, "").length > 0;
        if (isNumber) {
          acc[header] = parseInt(text.replace(/[^0-9]/g, ""));
        } else {
          acc[header] = text;
        }
      } catch (e) {}
      return acc;
    }, {});

    await db
      .insert(payouts)
      .values({
        ...result,
        buyInValue,
        eventId,
        eventIndex,
        eventName,
        flight,
      })
      .execute();
    console.log(i++);
  }
}
