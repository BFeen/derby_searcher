const Apify = require('apify');
const { handleStart, handleLeagues, handleMatches } = require('./src/routes');

const { utils: { log } } = Apify;

Apify.main(async () => {
  const requestQueue = await Apify.openRequestQueue();
  await requestQueue.addRequest({ url: `https://fotmob.com` })

  const crawler = new Apify.CheerioCrawler({
    requestQueue,
    maxRequestsPerCrawl: 10,
    maxConcurrency: 1,
    handlePageFunction: async (context) => {
      const { request, $ } = context;
      const { url, userData: { label } } = request;
      const title = $(`title`).text();

      switch (label) {
        case `LEAGUES`:
          const { link, league, leaders } = await handleLeagues(context);

          if (!link || leaders.length <= 1) { 
            log.error(`unsuitable championship`);
            break; 
          }

          log.info(`LEAGUES BLOCK, "${league}"`, { url });

          await requestQueue.addRequest({
              url: link,
              userData: {
                  label: `MATCHES`,
                  league,
                  leaders,
              },
          }, { forefront: true });
          break;

        case 'MATCHES':
          log.info(`=>, "${title}"`, { url });
          const result = await handleMatches(context);
          
          if (result.length > 0) {
            await Apify.pushData(result);
            // console.log(result);
          }

          break;

        default:
          await handleStart(context, requestQueue);
      }
    },
  });

  log.info('Starting the crawl.');
  await crawler.run();
  log.info('Crawl finished.');
});
