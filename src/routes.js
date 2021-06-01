const Apify = require('apify');
const tools = require(`./utils`);

const { utils: { log, enqueueLinks } } = Apify;

exports.handleStart = async ({ request, $ }, requestQueue) => {
  //EnqueueLinks case
  const enqueued = await enqueueLinks({
    $,
    requestQueue,
    selector: `a[href]`, // a.css-1g2mffk-GroupTitleLink
    pseudoUrls: [`https://www.fotmob.com/leagues/[\\d+]/overview[.*]`],
    baseUrl: request.loadedUrl,
    transformRequestFunction: request => {
      request.userData.label = `LEAGUES`;
      return request;
    }
  });
  // log.info(`Found ${enqueued.length} links`);
};

exports.handleLeagues = ({ $ }) => {
  // в этом блоке вычисляются:
  let domain = `https://fotmob.com`;
  const leaders = [];
  // В первую очередь проверяем принадлежность лиги к "INTERNATIONAL" || "CUP"
  let league = $(`span.css-4bqt1f`).text();
  const championshipName = $(`span.css-1jz49xr`).text();

  if (league.toLowerCase() === `international` || championshipName.toLowerCase() === `cup`) {
    return {};
  }
  league += `, ${championshipName}`;

  // - лидеры чемпионата (первые 4); 
  // случается, что таблица отсутствует
  const table = $(`span.css-6ehfm0`);
  if (table.length > 0) {
    table.each((i, el) => {
      if(i < 4) {
        leaders.push($(el).text());
      }
    });
  }
  // - получение ссылки на страницу предстоящих матчей
  const urlText = $(`a.css-dvwbv5-NavLinkCSS`)
    .filter((i, el) => $(el).text() === `Matches`)
    .attr(`href`);

  const link = domain + urlText;
  // функция возвращает URL для дальнейшей его обработки в main.js и список лидеров
  return { link, league, leaders };
};

exports.handleMatches = ({ request, $ }) => {
  // в этом блоке вычисляются:
  // - получение вспомогательных данных из userData
  const { userData: { league, leaders } } = request;
  // - поиск группы элементов по дате
  const groupOfTheDays = $(`section.css-1wkyvwd-TLMatchesSectionCSS`);
  // - формирование детальной информации о предстоящих матчах
  const games = [];
  groupOfTheDays
    .toArray()
    .forEach((item) => {
      const date = $(item).find(`h3`).text(); 
      const teamNames = $(item).find(`.css-1i87lf9-TeamName`)
        .toArray()
        .map(el => $(el).text());

      const results = $(item).find(`span.css-5fx5n6`)
        .toArray()
        .map(el => $(el).text());

      const startTimeList = $(item).find(`span.css-8o8lqm`)
        .toArray()
        .map(el => $(el).text());

      const matchInfoList = [...results, ...startTimeList];
    // - сравнение списка лидеров с предстоящими матчами
      games.push(...tools.getGamesInfo(date, teamNames, matchInfoList, league, leaders));
    });
    
  return games;
};
