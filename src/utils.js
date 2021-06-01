exports.getGamesInfo = (date, teamNames, matchInfoList, league, leaders) => {
  const result = [];
  
  matchInfoList.forEach(info => {
    const name = `${teamNames.shift()} - ${teamNames.shift()}`;

    if (isInterestingGame(name, leaders)) {
      result.push({
        league, 
        name, 
        dateTime: `${date}, ${info}`,
      });
    }
  });

  return result;
};

function isInterestingGame(name, leaders) {
  let counter = 0;

  for (let item of leaders) {
    if (name.includes(item)) {
      counter++;
    }
  }

  return counter >= 2;
}
